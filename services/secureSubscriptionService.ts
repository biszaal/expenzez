/**
 * Secure Subscription Service
 * Handles subscription validation with server authority and cross-device sync
 */

import { api } from './config/apiClient';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface SecureSubscriptionStatus {
  isValid: boolean;
  tier: 'free' | 'premium';
  status: 'active' | 'expired' | 'cancelled' | 'trialing';
  expiresAt: string | null;
  isTrialActive: boolean;
  daysRemaining: number | null;
  features: string[];
  lastValidated: string;
  deviceRegistered: boolean;
  serverValidated: boolean; // Indicates if this came from server
}

export class SecureSubscriptionService {
  private static deviceId: string | null = null;
  private static lastValidation: SecureSubscriptionStatus | null = null;
  private static validationCache: Map<string, { data: SecureSubscriptionStatus; timestamp: number }> = new Map();

  /**
   * Initialize device ID for cross-device tracking
   */
  static async initialize(): Promise<void> {
    try {
      // Generate a consistent device ID using available device info
      const deviceName = Device.deviceName || 'unknown';
      const osName = Device.osName || Platform.OS;
      const osVersion = Device.osVersion || 'unknown';
      const modelName = Device.modelName || 'unknown';

      // Create a deterministic device ID from device characteristics
      // This is not as unique as a hardware ID but works for cross-device sync
      const deviceString = `${osName}-${deviceName}-${modelName}-${osVersion}`;
      this.deviceId = deviceString.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();

      console.log('🔒 [SecureSubscription] Device ID initialized:', this.deviceId?.substring(0, 16) + '...');
    } catch (error) {
      console.warn('🔒 [SecureSubscription] Failed to get device ID:', error);
      this.deviceId = `${Platform.OS}-device-${Date.now()}`;
    }
  }

  /**
   * Validate subscription with server authority
   * This is the primary method for checking subscription status
   */
  static async validateSubscription(forceRefresh = false): Promise<SecureSubscriptionStatus> {
    try {
      // Check cache first (valid for 5 minutes)
      const cacheKey = 'subscription-validation';
      const cached = this.validationCache.get(cacheKey);
      const cacheMaxAge = 5 * 60 * 1000; // 5 minutes

      if (!forceRefresh && cached && (Date.now() - cached.timestamp) < cacheMaxAge) {
        console.log('🔒 [SecureSubscription] Using cached validation');
        return cached.data;
      }

      // Ensure device ID is initialized
      if (!this.deviceId) {
        await this.initialize();
      }

      console.log('🔒 [SecureSubscription] Validating subscription with server...');

      // Call secure validation endpoint
      const response = await api.get('/subscription/validate', {
        headers: {
          'X-Device-ID': this.deviceId
        }
      });

      const serverSubscription = response.data.subscription as SecureSubscriptionStatus;
      serverSubscription.serverValidated = true;

      // Cache the result
      this.validationCache.set(cacheKey, {
        data: serverSubscription,
        timestamp: Date.now()
      });

      // Update last validation
      this.lastValidation = serverSubscription;

      // Save backup to AsyncStorage for offline access
      await this.saveValidationBackup(serverSubscription);

      console.log(`✅ [SecureSubscription] Server validation complete: ${serverSubscription.status} (${serverSubscription.tier})`);
      console.log(`🔒 [SecureSubscription] Days remaining: ${serverSubscription.daysRemaining}`);

      return serverSubscription;

    } catch (error) {
      console.error('🚨 [SecureSubscription] Server validation failed:', error);

      // Fallback to cached or local backup
      return await this.getValidationFallback();
    }
  }

  /**
   * Check if user can access a specific feature
   */
  static async validateFeatureAccess(feature: string): Promise<{
    allowed: boolean;
    reason?: string;
    subscription: SecureSubscriptionStatus;
  }> {
    try {
      console.log(`🔒 [SecureSubscription] Validating feature access: ${feature}`);

      const response = await api.get(`/subscription/validate/${feature}`, {
        headers: {
          'X-Device-ID': this.deviceId
        }
      });

      return {
        allowed: true,
        subscription: response.data.subscription
      };

    } catch (error: any) {
      console.log(`🚨 [SecureSubscription] Feature access denied: ${feature}`);

      // Get current subscription status for context
      const subscription = await this.validateSubscription();

      return {
        allowed: false,
        reason: error.response?.data?.reason || 'Feature not available',
        subscription
      };
    }
  }

  /**
   * Get fallback validation from cache or local storage
   */
  private static async getValidationFallback(): Promise<SecureSubscriptionStatus> {
    try {
      // Try AsyncStorage backup first
      const backupData = await AsyncStorage.getItem('secure-subscription-backup');
      if (backupData) {
        const backup = JSON.parse(backupData);
        const backupAge = Date.now() - new Date(backup.timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (backupAge < maxAge) {
          console.log('🔒 [SecureSubscription] Using backup validation data');
          const fallbackSubscription = backup.subscription;
          fallbackSubscription.serverValidated = false;
          return fallbackSubscription;
        }
      }

      // Return secure default
      console.log('🔒 [SecureSubscription] Using secure default');
      return this.getSecureDefault();

    } catch (error) {
      console.error('🚨 [SecureSubscription] Fallback failed:', error);
      return this.getSecureDefault();
    }
  }

  /**
   * Save validation backup to AsyncStorage
   */
  private static async saveValidationBackup(subscription: SecureSubscriptionStatus): Promise<void> {
    try {
      const backup = {
        subscription,
        timestamp: new Date().toISOString(),
        deviceId: this.deviceId
      };

      await AsyncStorage.setItem('secure-subscription-backup', JSON.stringify(backup));
    } catch (error) {
      console.warn('🔒 [SecureSubscription] Failed to save backup:', error);
    }
  }

  /**
   * Sync subscription across devices
   */
  static async syncAcrossDevices(): Promise<boolean> {
    try {
      console.log('🔄 [SecureSubscription] Syncing subscription across devices...');

      // Force refresh from server
      const subscription = await this.validateSubscription(true);

      if (subscription.serverValidated) {
        console.log('✅ [SecureSubscription] Cross-device sync complete');
        return true;
      }

      return false;

    } catch (error) {
      console.error('🚨 [SecureSubscription] Cross-device sync failed:', error);
      return false;
    }
  }

  /**
   * Check subscription expiration
   */
  static async checkExpiration(): Promise<{
    isExpired: boolean;
    isExpiringSoon: boolean; // Within 3 days
    daysRemaining: number;
    subscription: SecureSubscriptionStatus;
  }> {
    const subscription = await this.validateSubscription();

    const daysRemaining = subscription.daysRemaining || 0;
    const isExpired = !subscription.isValid || subscription.status === 'expired';
    const isExpiringSoon = daysRemaining <= 3 && daysRemaining > 0;

    return {
      isExpired,
      isExpiringSoon,
      daysRemaining,
      subscription
    };
  }

  /**
   * Get secure default subscription
   */
  private static getSecureDefault(): SecureSubscriptionStatus {
    return {
      isValid: false,
      tier: 'free',
      status: 'expired',
      expiresAt: null,
      isTrialActive: false,
      daysRemaining: 0,
      features: [
        'basicTransactionTracking',
        'basicBudgeting',
        'basicNotifications',
        'limitedAIChat',
        'singleGoal',
        'singleBudget'
      ],
      lastValidated: new Date().toISOString(),
      deviceRegistered: false,
      serverValidated: false
    };
  }

  /**
   * Clear all cached data (useful for logout)
   */
  static async clearCache(): Promise<void> {
    try {
      this.validationCache.clear();
      this.lastValidation = null;
      await AsyncStorage.removeItem('secure-subscription-backup');
      console.log('🔒 [SecureSubscription] Cache cleared');
    } catch (error) {
      console.warn('🔒 [SecureSubscription] Failed to clear cache:', error);
    }
  }

  /**
   * Get last validation result (for immediate UI updates)
   */
  static getLastValidation(): SecureSubscriptionStatus | null {
    return this.lastValidation;
  }

  /**
   * Force refresh subscription status
   */
  static async refreshSubscription(): Promise<SecureSubscriptionStatus> {
    return await this.validateSubscription(true);
  }
}