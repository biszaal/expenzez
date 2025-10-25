import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Using lightweight PBKDF2 for mobile-optimized password hashing
import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';

// Secure storage keys
const SECURE_KEYS = {
  PIN_HASH: 'expenzez_pin_hash',
  PIN_SALT: 'expenzez_pin_salt',
  BIOMETRIC_KEY: 'expenzez_biometric_key',
  SESSION_TOKEN: 'expenzez_session_token',
  DEVICE_KEY: 'expenzez_device_key',
  USER_DATA: 'expenzez_user_data',
  USER_PROFILE: 'expenzez_user_profile',
} as const;

// AsyncStorage keys for non-sensitive data
const STORAGE_KEYS = {
  SECURITY_ENABLED: '@expenzez_security_enabled',
  BIOMETRIC_ENABLED: '@expenzez_biometric_enabled',
  LAST_UNLOCK: '@expenzez_last_unlock',
  APP_LOCKED: '@expenzez_app_locked',
  SECURITY_SETTINGS: '@expenzez_security_settings',
} as const;

interface SecuritySettings {
  securityEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number;
  maxAttempts: number;
  createdAt: number;
  lastUpdated: number;
}

interface SessionInfo {
  token: string;
  createdAt: number;
  expiresAt: number;
  deviceId: string;
}

class SecureStorageService {
  private static instance: SecureStorageService;
  private deviceKey: string | null = null;

  private constructor() {}

  /**
   * Generate cryptographically secure random bytes using Expo Crypto
   */
  private async generateSecureRandom(byteLength: number = 32): Promise<string> {
    try {
      // Use Expo Crypto for secure random generation
      const randomBytes = await Crypto.getRandomBytesAsync(byteLength);
      // Convert to hex string
      const hexString = Array.from(randomBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      return hexString;
    } catch (error) {
      console.warn('🔒 [SecureStorage] Expo Crypto failed, using fallback:', error);
      
      // Fallback: Use Math.random with timestamp (less secure but functional)
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2);
      return CryptoJS.SHA256(`${timestamp}_${random}_${Math.random()}`).toString();
    }
  }

  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  /**
   * Initialize secure storage and generate device key if needed
   */
  async initialize(): Promise<void> {
    try {
      
      // Generate or retrieve device key
      this.deviceKey = await this.getOrCreateDeviceKey();
      
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to initialize:', error);
      throw new Error('Failed to initialize secure storage');
    }
  }

  /**
   * Generate or retrieve a unique device key for encryption
   */
  private async getOrCreateDeviceKey(): Promise<string> {
    try {
      // Try to get existing device key from secure store
      let deviceKey = await SecureStore.getItemAsync(SECURE_KEYS.DEVICE_KEY);
      
      if (!deviceKey) {
        
        // Generate a strong random key using secure random generator
        deviceKey = await this.generateSecureRandom(32);
        
        // Store in secure store
        await SecureStore.setItemAsync(SECURE_KEYS.DEVICE_KEY, deviceKey, {
          requireAuthentication: false, // Device key should be accessible
          keychainService: 'expenzez-security',
          accessGroup: undefined,
        });
        
      }
      
      return deviceKey;
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to generate device key:', error);
      // Fallback to a deterministic but unique key based on device info
      const fallbackKey = await this.generateFallbackKey();
      return fallbackKey;
    }
  }

  /**
   * Generate a fallback device key when secure store is unavailable
   */
  private async generateFallbackKey(): Promise<string> {
    try {
      // Use device ID and user info to create a unique key
      const deviceId = await AsyncStorage.getItem('device_id') || 'unknown_device';
      const userInfo = await AsyncStorage.getItem('user') || 'unknown_user';
      
      // Create a deterministic but unique key
      const keyMaterial = `${deviceId}_${userInfo}_expenzez_v2_${Date.now()}`;
      return CryptoJS.SHA256(keyMaterial).toString();
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to generate fallback key:', error);
      // Last resort: use a timestamp-based key
      return CryptoJS.SHA256(`expenzez_emergency_key_${Date.now()}`).toString();
    }
  }

  /**
   * Generate a cryptographically secure PIN hash with salt
   */
  async hashPin(pin: string): Promise<{ hash: string; salt: string }> {
    try {
      
      if (!this.deviceKey) {
        await this.initialize();
      }

      const salt = await this.generateSecureRandom(32);
      
      // Use very lightweight PBKDF2 for mobile (1000 iterations = ~50ms)
      const iterations = 1000; // Super mobile-friendly
      const keySize = 256 / 32; // 256 bits = 8 words (32-bit each)
      
      
      // Combine device key with salt for additional security
      const saltWithDeviceKey = `${salt}_${this.deviceKey}`;
      
      
      // Use setTimeout to make PBKDF2 non-blocking for the UI thread
      const hash = await new Promise<string>((resolve, reject) => {
        setTimeout(() => {
          try {
            // Generate hash using CryptoJS PBKDF2 with SHA-256 (faster than SHA-512)
            const result = CryptoJS.PBKDF2(pin, saltWithDeviceKey, {
              keySize: keySize,
              iterations: iterations,
              hasher: CryptoJS.algo.SHA256 // SHA-256 is faster than SHA-512
            }).toString();
            
            resolve(result);
          } catch (error) {
            console.error('🔒 [SecureStorage] ❌ PBKDF2 failed:', error);
            reject(error);
          }
        }, 10); // Small delay to yield control to UI thread
      });
      
      
      return { hash, salt };
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to hash PIN:', error);
      console.error('🔒 [SecureStorage] ❌ Hash error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw new Error('Failed to hash PIN with lightweight PBKDF2');
    }
  }

  /**
   * Verify a PIN against the stored hash
   */
  async verifyPin(pin: string): Promise<boolean> {
    try {
      if (!this.deviceKey) {
        await this.initialize();
      }

      // Get stored hash and salt
      const storedHash = await SecureStore.getItemAsync(SECURE_KEYS.PIN_HASH);
      const storedSalt = await SecureStore.getItemAsync(SECURE_KEYS.PIN_SALT);
      
      if (!storedHash || !storedSalt) {
        return false;
      }

      // Recreate the salt with device key
      const saltWithDeviceKey = `${storedSalt}_${this.deviceKey}`;
      
      // Hash the provided PIN with the same lightweight parameters (async)
      const iterations = 1000; // Same as hashPin function
      const keySize = 256 / 32; // 256 bits = 8 words (32-bit each)
      
      const computedHash = await new Promise<string>((resolve, reject) => {
        setTimeout(() => {
          try {
            const result = CryptoJS.PBKDF2(pin, saltWithDeviceKey, {
              keySize: keySize,
              iterations: iterations,
              hasher: CryptoJS.algo.SHA256 // Same as hashPin
            }).toString();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, 10); // Small delay to yield control to UI thread
      });
      
      // Compare hashes using constant-time comparison
      const isValid = this.constantTimeCompare(computedHash, storedHash);
      
      
      return isValid;
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to verify PIN:', error);
      return false;
    }
  }

  /**
   * Store PIN hash securely
   */
  async storePinHash(pin: string): Promise<void> {
    try {
      
      const { hash, salt } = await this.hashPin(pin);
      
      await SecureStore.setItemAsync(SECURE_KEYS.PIN_HASH, hash, {
        requireAuthentication: false,
        keychainService: 'expenzez-security',
      });
      
      await SecureStore.setItemAsync(SECURE_KEYS.PIN_SALT, salt, {
        requireAuthentication: false,
        keychainService: 'expenzez-security',
      });
      
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to store PIN hash:', error);
      console.error('🔒 [SecureStorage] ❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw new Error('Failed to store PIN hash');
    }
  }

  /**
   * Remove PIN hash and related data
   */
  async removePinHash(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEYS.PIN_HASH);
      await SecureStore.deleteItemAsync(SECURE_KEYS.PIN_SALT);
      
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to remove PIN hash:', error);
      throw new Error('Failed to remove PIN hash');
    }
  }

  /**
   * Check if a PIN is stored
   */
  async hasPinHash(): Promise<boolean> {
    try {
      const hash = await SecureStore.getItemAsync(SECURE_KEYS.PIN_HASH);
      const salt = await SecureStore.getItemAsync(SECURE_KEYS.PIN_SALT);
      
      
      const hasBoth = !!(hash && salt);
      
      return hasBoth;
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to check PIN hash:', error);
      return false;
    }
  }

  /**
   * Store security settings (non-sensitive data)
   */
  async setSecuritySettings(settings: Partial<SecuritySettings>): Promise<void> {
    try {
      const currentSettings = await this.getSecuritySettings();
      const updatedSettings: SecuritySettings = {
        ...currentSettings,
        ...settings,
        lastUpdated: Date.now(),
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.SECURITY_SETTINGS, JSON.stringify(updatedSettings));
      
      // Also update individual flags for backward compatibility
      if (settings.securityEnabled !== undefined) {
        await AsyncStorage.setItem(STORAGE_KEYS.SECURITY_ENABLED, settings.securityEnabled.toString());
      }
      
      if (settings.biometricEnabled !== undefined) {
        await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, settings.biometricEnabled.toString());
      }
      
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to set security settings:', error);
      throw new Error('Failed to set security settings');
    }
  }

  /**
   * Get security settings
   */
  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const settingsStr = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_SETTINGS);
      
      if (settingsStr) {
        return JSON.parse(settingsStr);
      }
      
      // Default settings
      const defaultSettings: SecuritySettings = {
        securityEnabled: false,
        biometricEnabled: false,
        sessionTimeout: 5 * 60 * 1000, // 5 minutes
        maxAttempts: 5,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };
      
      await this.setSecuritySettings(defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to get security settings:', error);
      
      // Return safe defaults
      return {
        securityEnabled: false,
        biometricEnabled: false,
        sessionTimeout: 5 * 60 * 1000,
        maxAttempts: 5,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };
    }
  }

  /**
   * Create a secure session token
   */
  async createSession(deviceId: string, duration: number = 5 * 60 * 1000): Promise<string> {
    try {
      const sessionInfo: SessionInfo = {
        token: await this.generateSecureRandom(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + duration,
        deviceId,
      };
      
      await SecureStore.setItemAsync(SECURE_KEYS.SESSION_TOKEN, JSON.stringify(sessionInfo), {
        requireAuthentication: false,
        keychainService: 'expenzez-security',
      });
      
      // Also set last unlock time for backward compatibility
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_UNLOCK, Date.now().toString());
      await AsyncStorage.setItem(STORAGE_KEYS.APP_LOCKED, 'false');
      
      
      return sessionInfo.token;
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to create session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Validate current session
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const sessionStr = await SecureStore.getItemAsync(SECURE_KEYS.SESSION_TOKEN);
      
      if (!sessionStr) {
        return false;
      }
      
      const session: SessionInfo = JSON.parse(sessionStr);
      const now = Date.now();
      
      if (now > session.expiresAt) {
        // Session expired, remove it
        await this.clearSession();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to validate session:', error);
      return false;
    }
  }

  /**
   * Clear current session
   */
  async clearSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEYS.SESSION_TOKEN);
      await AsyncStorage.setItem(STORAGE_KEYS.APP_LOCKED, 'true');
      
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to clear session:', error);
    }
  }

  /**
   * Clear all security data
   */
  async clearAllSecurityData(): Promise<void> {
    try {
      // Clear secure store items
      await this.removePinHash();
      await SecureStore.deleteItemAsync(SECURE_KEYS.BIOMETRIC_KEY);
      await SecureStore.deleteItemAsync(SECURE_KEYS.SESSION_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_KEYS.USER_DATA);
      await SecureStore.deleteItemAsync(SECURE_KEYS.USER_PROFILE);

      // Clear AsyncStorage items
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SECURITY_ENABLED,
        STORAGE_KEYS.BIOMETRIC_ENABLED,
        STORAGE_KEYS.LAST_UNLOCK,
        STORAGE_KEYS.APP_LOCKED,
        STORAGE_KEYS.SECURITY_SETTINGS,
      ]);

      // Clear legacy storage keys
      await AsyncStorage.multiRemove([
        '@expenzez_app_password',
        '@expenzez_encrypted_pin',
        '@expenzez_pin_removed',
        'user', // Old user data location
        'profile', // Old profile location
      ]);

    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to clear security data:', error);
      throw new Error('Failed to clear security data');
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Store user data securely in SecureStore
   */
  async storeUserDataSecurely(userData: any): Promise<void> {
    try {
      if (!userData) {
        console.warn('🔒 [SecureStorage] User data is empty, skipping storage');
        return;
      }

      // Serialize user data
      const serialized = typeof userData === 'string' ? userData : JSON.stringify(userData);

      // Store in secure store
      await SecureStore.setItemAsync(SECURE_KEYS.USER_DATA, serialized, {
        requireAuthentication: false,
        keychainService: 'expenzez-security',
      });

      console.log('🔒 [SecureStorage] ✅ User data stored securely');
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to store user data securely:', error);
      throw new Error('Failed to store user data securely');
    }
  }

  /**
   * Retrieve user data securely from SecureStore
   */
  async getUserDataSecurely(): Promise<any | null> {
    try {
      const serialized = await SecureStore.getItemAsync(SECURE_KEYS.USER_DATA);

      if (!serialized) {
        return null;
      }

      // Try to parse as JSON
      try {
        return JSON.parse(serialized);
      } catch {
        // If not JSON, return as string
        return serialized;
      }
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to retrieve user data securely:', error);
      return null;
    }
  }

  /**
   * Check if user data exists in SecureStore
   */
  async hasUserData(): Promise<boolean> {
    try {
      const data = await SecureStore.getItemAsync(SECURE_KEYS.USER_DATA);
      return !!data;
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to check user data existence:', error);
      return false;
    }
  }

  /**
   * Clear user data from SecureStore
   */
  async clearUserDataSecurely(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEYS.USER_DATA);
      await SecureStore.deleteItemAsync(SECURE_KEYS.USER_PROFILE);
      console.log('🔒 [SecureStorage] ✅ User data cleared securely');
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to clear user data securely:', error);
      throw new Error('Failed to clear user data securely');
    }
  }

  /**
   * Store user profile data securely
   */
  async storeUserProfileSecurely(profileData: any): Promise<void> {
    try {
      if (!profileData) {
        console.warn('🔒 [SecureStorage] Profile data is empty, skipping storage');
        return;
      }

      const serialized = typeof profileData === 'string' ? profileData : JSON.stringify(profileData);

      await SecureStore.setItemAsync(SECURE_KEYS.USER_PROFILE, serialized, {
        requireAuthentication: false,
        keychainService: 'expenzez-security',
      });

      console.log('🔒 [SecureStorage] ✅ User profile stored securely');
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to store user profile securely:', error);
      throw new Error('Failed to store user profile securely');
    }
  }

  /**
   * Retrieve user profile data securely
   */
  async getUserProfileSecurely(): Promise<any | null> {
    try {
      const serialized = await SecureStore.getItemAsync(SECURE_KEYS.USER_PROFILE);

      if (!serialized) {
        return null;
      }

      try {
        return JSON.parse(serialized);
      } catch {
        return serialized;
      }
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to retrieve user profile securely:', error);
      return null;
    }
  }

  /**
   * Migrate user data from AsyncStorage to SecureStore
   */
  async migrateUserData(): Promise<boolean> {
    try {
      console.log('🔒 [SecureStorage] Starting user data migration...');

      // Check if we already have secure user data
      const hasSecureData = await this.hasUserData();
      if (hasSecureData) {
        console.log('🔒 [SecureStorage] Secure user data already exists, skipping migration');
        return true;
      }

      // Get user data from AsyncStorage
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        try {
          // Validate it's valid JSON
          JSON.parse(userData);
          // Store in SecureStore
          await this.storeUserDataSecurely(userData);
          console.log('🔒 [SecureStorage] ✅ User data migrated to SecureStore');
        } catch (parseError) {
          console.warn('🔒 [SecureStorage] Invalid user data JSON, skipping');
          return false;
        }
      }

      // Migrate profile data if exists
      const profileData = await AsyncStorage.getItem('profile');
      if (profileData) {
        try {
          JSON.parse(profileData);
          await this.storeUserProfileSecurely(profileData);
          console.log('🔒 [SecureStorage] ✅ User profile migrated to SecureStore');
        } catch (parseError) {
          console.warn('🔒 [SecureStorage] Invalid profile data JSON, skipping');
        }
      }

      return true;
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to migrate user data:', error);
      return false;
    }
  }

  // Backward compatibility methods for migration
  async migrateLegacyPin(): Promise<boolean> {
    try {
      // Check if we already have a secure hash
      const hasSecureHash = await this.hasPinHash();
      if (hasSecureHash) {
        return true;
      }
      
      // Check for legacy plain text PIN
      const legacyPin = await AsyncStorage.getItem('@expenzez_app_password');
      if (legacyPin && /^\d{5}$/.test(legacyPin)) {
        
        // Store as secure hash
        await this.storePinHash(legacyPin);
        
        // Remove legacy storage
        await AsyncStorage.removeItem('@expenzez_app_password');
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('🔒 [SecureStorage] ❌ Failed to migrate legacy PIN:', error);
      return false;
    }
  }
}

// Export singleton instance
export const secureStorage = SecureStorageService.getInstance();

// Export constants for external use
export { STORAGE_KEYS, SECURE_KEYS };
export type { SecuritySettings, SessionInfo };