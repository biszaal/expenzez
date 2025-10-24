/**
 * Debug Service
 * Provides development-only tools for testing premium features
 *
 * ⚠️ THIS SERVICE IS FOR DEVELOPMENT BUILDS ONLY
 * It will not work in production builds
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const DEBUG_PREMIUM_KEY = '@expenzez_debug_premium';

export class DebugService {
  /**
   * Check if we're in a development environment
   */
  static isDevEnvironment(): boolean {
    // Only available in Expo Go or development builds
    const isExpoGo = !Constants.appOwnership || Constants.appOwnership === 'expo';
    const isDev = process.env.NODE_ENV === 'development';
    return isExpoGo || isDev;
  }

  /**
   * Toggle premium status for testing
   * Returns true if premium is now enabled, false if disabled
   */
  static async toggleDebugPremium(): Promise<boolean> {
    if (!this.isDevEnvironment()) {
      console.warn('Debug features are only available in development builds');
      return false;
    }

    const currentValue = await this.isDebugPremiumEnabled();
    const newValue = !currentValue;
    await AsyncStorage.setItem(DEBUG_PREMIUM_KEY, JSON.stringify(newValue));
    console.log(`[Debug] Premium override: ${newValue}`);
    return newValue;
  }

  /**
   * Check if debug premium is currently enabled
   */
  static async isDebugPremiumEnabled(): Promise<boolean> {
    if (!this.isDevEnvironment()) {
      return false;
    }

    try {
      const value = await AsyncStorage.getItem(DEBUG_PREMIUM_KEY);
      return value !== null ? JSON.parse(value) : false;
    } catch (error) {
      console.error('[Debug] Error reading debug premium flag:', error);
      return false;
    }
  }

  /**
   * Reset debug settings
   */
  static async resetDebugSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DEBUG_PREMIUM_KEY);
      console.log('[Debug] Settings reset');
    } catch (error) {
      console.error('[Debug] Error resetting settings:', error);
    }
  }

  /**
   * Get debug info
   */
  static getDebugInfo(): {
    isDev: boolean;
    environment: string;
    appOwnership: string | null;
  } {
    return {
      isDev: this.isDevEnvironment(),
      environment: process.env.NODE_ENV || 'unknown',
      appOwnership: Constants.appOwnership || null,
    };
  }
}

const debugService = new DebugService();

export default debugService;
