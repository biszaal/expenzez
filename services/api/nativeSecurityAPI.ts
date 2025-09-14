import { api } from "../config/apiClient";
import { nativeCryptoStorage } from "../nativeCryptoStorage";
import { deviceManager } from "../deviceManager";

export interface SecuritySettings {
  userId: string;
  encryptedPin: string;
  biometricEnabled: boolean;
  deviceId: string;
  lastUpdated: number;
  createdAt: number;
}

export interface SetPinRequest {
  pin: string;
  deviceId: string;
  biometricEnabled?: boolean;
}

export interface ValidatePinRequest {
  pin: string;
  deviceId: string;
}

export interface SecurityValidationResponse {
  success: boolean;
  requiresNewPin?: boolean;
  error?: string;
}

/**
 * Native Security API - Uses expo-crypto instead of CryptoJS
 * This eliminates memory crashes and provides better performance on iOS
 */
export const nativeSecurityAPI = {
  /**
   * Initialize the native security system
   */
  initialize: async (): Promise<void> => {
    try {
      console.log('🔐 [NativeSecurityAPI] Initializing native security system...');
      await nativeCryptoStorage.initialize();
      console.log('🔐 [NativeSecurityAPI] ✅ Native security system initialized');
    } catch (error) {
      console.error('🔐 [NativeSecurityAPI] ❌ Failed to initialize:', error);
      throw error;
    }
  },

  /**
   * Set up a new 5-digit PIN with server-side storage for cross-device sync
   */
  setupPin: async (request: SetPinRequest): Promise<SecurityValidationResponse> => {
    try {
      console.log('🔐 [NativeSecurityAPI] Setting up PIN with server-side storage...');

      // Validate PIN format
      if (!/^\d{5}$/.test(request.pin)) {
        console.log('🔐 [NativeSecurityAPI] ❌ Invalid PIN format');
        return { success: false, error: 'PIN must be exactly 5 digits' };
      }

      console.log('🔐 [NativeSecurityAPI] PIN format valid, storing on server for cross-device sync...');

      // Store PIN on server (hashed) for cross-device access
      const payload = {
        pin: request.pin, // Send plain PIN to server for secure hashing
        deviceId: request.deviceId,
        biometricEnabled: request.biometricEnabled || false,
      };

      const response = await api.post('/security/setup-pin', payload);

      if (response.status === 200) {
        console.log('🔐 [NativeSecurityAPI] ✅ PIN stored on server for cross-device sync');

        // Also store locally as backup/cache
        await nativeCryptoStorage.storePinHash(request.pin);
        console.log('🔐 [NativeSecurityAPI] ✅ PIN also cached locally as backup');

        // Update local security settings
        await nativeCryptoStorage.setSecuritySettings({
          securityEnabled: true,
          biometricEnabled: request.biometricEnabled || false,
        });

        // Create a local session
        await nativeCryptoStorage.createSession(request.deviceId);
        console.log('🔐 [NativeSecurityAPI] ✅ Local session created');

        return { success: true };
      } else {
        console.log('🔐 [NativeSecurityAPI] ❌ Server PIN storage failed:', response.status);
        return { success: false, error: 'Failed to store PIN on server' };
      }
    } catch (error: any) {
      console.error('🔐 [NativeSecurityAPI] ❌ PIN setup failed:', error);

      // Fallback: Try local storage only
      try {
        console.log('🔐 [NativeSecurityAPI] Attempting fallback to local PIN storage...');
        await nativeCryptoStorage.storePinHash(request.pin);
        await nativeCryptoStorage.setSecuritySettings({
          securityEnabled: true,
          biometricEnabled: request.biometricEnabled || false,
        });
        await nativeCryptoStorage.createSession(request.deviceId);
        console.log('🔐 [NativeSecurityAPI] ⚠️ Fallback successful - PIN stored locally only');
        return { success: true };
      } catch (fallbackError: any) {
        console.error('🔐 [NativeSecurityAPI] ❌ Fallback also failed:', fallbackError);
        return {
          success: false,
          error: error.message || 'Failed to set up PIN'
        };
      }
    }
  },

  /**
   * Validate PIN using local fallback (server endpoint not available in current AWS deployment)
   */
  validatePin: async (request: ValidatePinRequest): Promise<SecurityValidationResponse> => {
    try {
      console.log('🔐 [NativeSecurityAPI] Validating PIN using local verification...');

      // Use local validation since server endpoint is not deployed to AWS yet
      const settings = await nativeCryptoStorage.getSecuritySettings();
      if (!settings.securityEnabled) {
        console.log('🔐 [NativeSecurityAPI] Security not enabled locally');
        return { success: false, error: 'Security not enabled' };
      }

      // Check if PIN exists locally
      const hasPinHash = await nativeCryptoStorage.hasPinHash();
      if (!hasPinHash) {
        console.log('🔐 [NativeSecurityAPI] No local PIN found');
        return { success: false, error: 'No PIN set up locally' };
      }

      // Verify PIN using local crypto
      const isValidPin = await nativeCryptoStorage.verifyPin(request.pin);

      if (isValidPin) {
        console.log('🔐 [NativeSecurityAPI] ✅ Local PIN validation successful');
        await nativeCryptoStorage.createSession(request.deviceId);
        return { success: true };
      } else {
        console.log('🔐 [NativeSecurityAPI] ❌ Local PIN validation failed');
        return { success: false, error: 'Invalid PIN' };
      }

    } catch (error: any) {
      console.error('🔐 [NativeSecurityAPI] ❌ PIN validation error:', error);
      return {
        success: false,
        error: 'Validation failed'
      };
    }
  },

  /**
   * Get security settings
   */
  getSecuritySettings: async (deviceId: string): Promise<SecuritySettings | null> => {
    try {
      console.log('🔐 [NativeSecurityAPI] Getting security settings...');
      
      const settings = await nativeCryptoStorage.getSecuritySettings();
      const hasPinHash = await nativeCryptoStorage.hasPinHash();
      
      if (hasPinHash && settings.securityEnabled) {
        const securitySettings: SecuritySettings = {
          userId: 'current_user',
          encryptedPin: 'NATIVE_CRYPTO_STORED',
          biometricEnabled: settings.biometricEnabled,
          deviceId,
          lastUpdated: settings.lastUpdated,
          createdAt: settings.createdAt,
        };
        
        console.log('🔐 [NativeSecurityAPI] ✅ Security settings found');
        return securitySettings;
      }

      console.log('🔐 [NativeSecurityAPI] No security settings found');
      return null;
    } catch (error: any) {
      console.error('🔐 [NativeSecurityAPI] ❌ Failed to get security settings:', error);
      return null;
    }
  },

  /**
   * Update biometric settings
   */
  updateBiometricSettings: async (deviceId: string, enabled: boolean): Promise<SecurityValidationResponse> => {
    try {
      console.log('🔐 [NativeSecurityAPI] Updating biometric settings...');
      
      await nativeCryptoStorage.setSecuritySettings({ biometricEnabled: enabled });
      
      return { success: true };
    } catch (error: any) {
      console.error('🔐 [NativeSecurityAPI] ❌ Failed to update biometric settings:', error);
      return { 
        success: false, 
        error: 'Failed to update biometric settings' 
      };
    }
  },

  /**
   * Change PIN
   */
  changePin: async (deviceId: string, oldPin: string, newPin: string): Promise<SecurityValidationResponse> => {
    try {
      console.log('🔐 [NativeSecurityAPI] Changing PIN...');
      
      // Validate old PIN
      const oldPinValid = await nativeCryptoStorage.verifyPin(oldPin);
      if (!oldPinValid) {
        return { success: false, error: 'Current PIN is incorrect' };
      }

      // Validate new PIN format
      if (!/^\d{5}$/.test(newPin)) {
        return { success: false, error: 'New PIN must be exactly 5 digits' };
      }

      // Store new PIN
      await nativeCryptoStorage.storePinHash(newPin);
      
      // Create new session
      await nativeCryptoStorage.createSession(deviceId);
      
      return { success: true };
    } catch (error: any) {
      console.error('🔐 [NativeSecurityAPI] ❌ Failed to change PIN:', error);
      return { 
        success: false, 
        error: 'Failed to change PIN' 
      };
    }
  },

  /**
   * Remove PIN and all security data
   */
  removePin: async (deviceId: string): Promise<SecurityValidationResponse> => {
    try {
      console.log('🔐 [NativeSecurityAPI] Removing PIN and security data...');
      
      await nativeCryptoStorage.clearAllSecurityData();
      
      return { success: true };
    } catch (error: any) {
      console.error('🔐 [NativeSecurityAPI] ❌ Failed to remove PIN:', error);
      return { 
        success: false, 
        error: 'Failed to remove PIN' 
      };
    }
  },

  /**
   * Check if user has a valid session
   */
  hasValidSession: async (): Promise<boolean> => {
    try {
      return await nativeCryptoStorage.isSessionValid();
    } catch (error) {
      console.error('🔐 [NativeSecurityAPI] ❌ Session validation failed:', error);
      return false;
    }
  },

  /**
   * Extend current session
   */
  extendSession: async (): Promise<void> => {
    try {
      const deviceId = await deviceManager.getDeviceId();
      await nativeCryptoStorage.createSession(deviceId); // Refresh the session
      console.log('🔐 [NativeSecurityAPI] ✅ Session extended');
    } catch (error) {
      console.error('🔐 [NativeSecurityAPI] ❌ Failed to extend session:', error);
    }
  },

  /**
   * Clear current session
   */
  clearSession: async (): Promise<void> => {
    try {
      await nativeCryptoStorage.clearSession();
    } catch (error) {
      console.error('🔐 [NativeSecurityAPI] ❌ Failed to clear session:', error);
    }
  },

  /**
   * Check if PIN is set up (checks server-side first, then local fallback)
   */
  hasPinSetup: async (): Promise<boolean> => {
    try {
      console.log('🔐 [NativeSecurityAPI] Checking if PIN is set up...');

      // First check server-side (works across all devices)
      try {
        const deviceId = await deviceManager.getDeviceId();
        const response = await api.get(`/security/status/${deviceId}`);

        if (response.status === 200 && response.data?.success) {
          const hasServerPin = response.data.status?.hasDevicePIN;
          console.log('🔐 [NativeSecurityAPI] Server PIN check result:', { hasServerPin });

          if (hasServerPin) {
            return true;
          }
        }
      } catch (serverError) {
        console.log('🔐 [NativeSecurityAPI] Server PIN check failed, checking locally:', serverError.message);
      }

      // Fallback to local check
      const hasLocalPin = await nativeCryptoStorage.hasPinHash();
      console.log('🔐 [NativeSecurityAPI] Local PIN check result:', { hasLocalPin });
      return hasLocalPin;
    } catch (error) {
      console.error('🔐 [NativeSecurityAPI] ❌ Failed to check PIN setup:', error);
      return false;
    }
  },

  /**
   * Get current security settings
   */
  getCurrentSettings: async () => {
    try {
      return await nativeCryptoStorage.getSecuritySettings();
    } catch (error) {
      console.error('🔐 [NativeSecurityAPI] ❌ Failed to get current settings:', error);
      return {
        securityEnabled: false,
        biometricEnabled: false,
        sessionTimeout: 5 * 60 * 1000,
        maxAttempts: 5,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };
    }
  },
};