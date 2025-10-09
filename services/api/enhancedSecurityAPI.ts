import { api } from "../config/apiClient";
import { deviceManager } from "../deviceManager";

export interface UserSecurityPreferences {
  appLockEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number;
  maxAttempts: number;
  lastUpdated: number;
}

export interface SecurityStatus {
  userId: string;
  deviceId: string;
  preferences: UserSecurityPreferences;
  hasDevicePIN: boolean;
  needsPinSetup: boolean;
}

export interface SecurityResponse {
  success: boolean;
  error?: string;
  preferences?: UserSecurityPreferences;
  status?: SecurityStatus;
  message?: string;
}

export const enhancedSecurityAPI = {
  /**
   * Get user's security preferences (synced across all devices)
   */
  getSecurityPreferences: async (): Promise<UserSecurityPreferences | null> => {
    try {
      console.log('🔐 [Enhanced Security] Getting security preferences from server...');

      const response = await api.get('/security/preferences');

      if (response.status === 200 && response.data.success) {
        console.log('🔐 [Enhanced Security] ✅ Got preferences:', response.data.preferences);
        return response.data.preferences;
      }

      console.log('🔐 [Enhanced Security] ❌ Failed to get preferences:', response.data);
      return null;
    } catch (error: any) {
      console.log('🔐 [Enhanced Security] ⚠️ Server error getting preferences:', error.message);
      return null;
    }
  },

  /**
   * Update user's security preferences (synced across all devices)
   */
  updateSecurityPreferences: async (
    preferences: Partial<UserSecurityPreferences>
  ): Promise<boolean> => {
    try {
      console.log('🔐 [Enhanced Security] Updating security preferences:', preferences);

      const response = await api.put('/security/preferences', preferences);

      if (response.status === 200 && response.data.success) {
        console.log('🔐 [Enhanced Security] ✅ Preferences updated successfully');
        return true;
      }

      console.log('🔐 [Enhanced Security] ❌ Failed to update preferences:', response.data);
      return false;
    } catch (error: any) {
      console.log('🔐 [Enhanced Security] ⚠️ Server error updating preferences:', error.message);
      return false;
    }
  },

  /**
   * Get comprehensive security status for current device
   */
  getSecurityStatus: async (): Promise<SecurityStatus | null> => {
    try {
      const deviceId = await deviceManager.getDeviceId();
      console.log('🔐 [Enhanced Security] Getting security status for device:', deviceId);

      const response = await api.get(`/security/status/${deviceId}`);

      if (response.status === 200 && response.data.success) {
        console.log('🔐 [Enhanced Security] ✅ Got security status:', {
          appLockEnabled: response.data.status.preferences.appLockEnabled,
          hasDevicePIN: response.data.status.hasDevicePIN,
          needsPinSetup: response.data.status.needsPinSetup,
        });
        return response.data.status;
      }

      console.log('🔐 [Enhanced Security] ❌ Failed to get status:', response.data);
      return null;
    } catch (error: any) {
      console.log('🔐 [Enhanced Security] ⚠️ Server error getting status:', error.message);
      return null;
    }
  },

  /**
   * Enable app lock (syncs preference across devices, prompts PIN setup if needed)
   */
  enableAppLock: async (): Promise<{ success: boolean; needsPinSetup: boolean }> => {
    try {
      console.log('🔐 [Enhanced Security] Enabling app lock...');

      // First, update the preference across all devices
      const prefUpdateSuccess = await enhancedSecurityAPI.updateSecurityPreferences({
        appLockEnabled: true,
      });

      // Store local preference regardless of server success (for offline support)
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('@expenzez_app_lock_preference', 'true');
      await AsyncStorage.setItem('@expenzez_security_enabled', 'true');
      console.log('🔐 [Enhanced Security] ✅ App lock preference stored locally');

      if (!prefUpdateSuccess) {
        console.log('🔐 [Enhanced Security] ⚠️ Server update failed, using offline mode');
        return { success: true, needsPinSetup: false }; // PIN already created locally
      }

      // Check if current device needs PIN setup
      const status = await enhancedSecurityAPI.getSecurityStatus();

      if (!status) {
        console.log('🔐 [Enhanced Security] ⚠️ Could not get status, assuming PIN setup complete');
        return { success: true, needsPinSetup: false };
      }

      console.log('🔐 [Enhanced Security] ✅ App lock enabled, PIN setup needed:', status.needsPinSetup);
      return { success: true, needsPinSetup: status.needsPinSetup };
    } catch (error: any) {
      console.error('🔐 [Enhanced Security] ❌ Error enabling app lock:', error);
      // Fallback to local storage in case of any error
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem('@expenzez_app_lock_preference', 'true');
        await AsyncStorage.setItem('@expenzez_security_enabled', 'true');
        console.log('🔐 [Enhanced Security] ✅ Fallback: App lock preference stored locally');
        return { success: true, needsPinSetup: false };
      } catch (fallbackError) {
        console.error('🔐 [Enhanced Security] ❌ Fallback also failed:', fallbackError);
        return { success: false, needsPinSetup: false };
      }
    }
  },

  /**
   * Disable app lock (syncs preference across devices, keeps device PINs for privacy)
   */
  disableAppLock: async (): Promise<boolean> => {
    try {
      console.log('🔐 [Enhanced Security] Disabling app lock...');

      // Only update the preference - keep device PINs for user privacy
      const success = await enhancedSecurityAPI.updateSecurityPreferences({
        appLockEnabled: false,
      });

      // Update local preference regardless of server success (for offline support)
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('@expenzez_app_lock_preference', 'false');
      await AsyncStorage.setItem('@expenzez_security_enabled', 'false');
      console.log('🔐 [Enhanced Security] ✅ App lock preference disabled locally');

      if (success) {
        console.log('🔐 [Enhanced Security] ✅ App lock disabled across all devices');
        return true;
      } else {
        console.log('🔐 [Enhanced Security] ⚠️ Server disable failed, but using local offline mode');
        return true;
      }
    } catch (error: any) {
      console.error('🔐 [Enhanced Security] ❌ Error disabling app lock:', error);
      // Fallback to local storage in case of any error
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem('@expenzez_app_lock_preference', 'false');
        await AsyncStorage.setItem('@expenzez_security_enabled', 'false');
        console.log('🔐 [Enhanced Security] ✅ Fallback: App lock preference disabled locally');
        return true;
      } catch (fallbackError) {
        console.error('🔐 [Enhanced Security] ❌ Fallback also failed:', fallbackError);
        return false;
      }
    }
  },

  /**
   * Check if user needs to set up PIN on current device
   */
  needsPinSetup: async (): Promise<boolean> => {
    try {
      const status = await enhancedSecurityAPI.getSecurityStatus();
      return status?.needsPinSetup || false;
    } catch (error: any) {
      console.error('🔐 [Enhanced Security] ❌ Error checking PIN setup status:', error);
      return false;
    }
  },

  /**
   * Mark that PIN setup is complete on current device (called after successful PIN creation)
   */
  onPinSetupComplete: async (): Promise<void> => {
    try {
      console.log('🔐 [Enhanced Security] PIN setup completed on this device');
      // The existing PIN setup API will handle storing the device-specific PIN
      // This is just for logging and potential future enhancements
    } catch (error: any) {
      console.error('🔐 [Enhanced Security] ❌ Error in PIN setup completion:', error);
    }
  },
};