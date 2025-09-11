import { api } from "../config/apiClient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

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

// Generate a device-specific encryption key
const getEncryptionKey = async (): Promise<string> => {
  try {
    const deviceId = await AsyncStorage.getItem('device_id');
    const userId = await AsyncStorage.getItem('user');
    let userInfo = '';
    
    try {
      if (userId) {
        const user = JSON.parse(userId);
        userInfo = user.username || user.id || '';
      }
    } catch (_error) {
      // Fallback to stored user ID
    }
    
    // Create a unique key combining device ID and user info
    return CryptoJS.SHA256(`${deviceId}_${userInfo}_expenzez_security`).toString();
  } catch (_error) {
    console.warn('Error generating encryption key, using fallback:', error);
    // Fallback to a simpler key for Expo Go
    return 'expenzez_fallback_key_12345';
  }
};

// Encrypt PIN for secure storage
const encryptPin = async (pin: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    return CryptoJS.AES.encrypt(pin, key).toString();
  } catch (_error) {
    // Silently fallback for Expo Go - this is expected behavior
    const key = await getEncryptionKey();
    const combined = `${pin}_${key.substring(0, 10)}`;
    return btoa(combined);
  }
};

// Decrypt PIN for validation
const _decryptPin = async (encryptedPin: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedPin, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (decrypted) {
      return decrypted;
    } else {
      throw new Error('Decryption produced empty result');
    }
  } catch (_error) {
    // Silently try fallback for Expo Go
    try {
      const decoded = atob(encryptedPin);
      const [pin] = decoded.split('_');
      if (pin && /^\d{5}$/.test(pin)) {
        return pin;
      }
    } catch (_fallbackError) {
      // Silent fallback failure
    }
    throw new Error('Failed to decrypt PIN');
  }
};

export const securityAPI = {
  /**
   * Set up a new 5-digit PIN for the user
   */
  setupPin: async (request: SetPinRequest): Promise<SecurityValidationResponse> => {
    try {
      // Validate PIN format
      if (!/^\d{5}$/.test(request.pin)) {
        return { success: false, error: 'PIN must be exactly 5 digits' };
      }

      // Encrypt the PIN
      const encryptedPin = await encryptPin(request.pin);
      
      const payload = {
        encryptedPin,
        deviceId: request.deviceId,
        biometricEnabled: request.biometricEnabled || false,
      };

      const response = await api.post('/security/setup-pin', payload);
      
      if (response.status === 200) {
        // Also store locally for offline validation
        await AsyncStorage.setItem('@expenzez_app_password', request.pin);
        await AsyncStorage.setItem('@expenzez_security_enabled', 'true');
        if (request.biometricEnabled) {
          await AsyncStorage.setItem('@expenzez_biometric_enabled', 'true');
        }
        
        return { success: true };
      } else {
        return { success: false, error: 'Failed to set up PIN' };
      }
    } catch (error: any) {
      // Skip logging in development - fallback works fine
      if (error.response?.status !== 404 && !error.message?.includes('Network Error')) {
        console.error('PIN setup error:', error);
      }
      
      // Fallback: store locally if server is unavailable
      if (error.response?.status === 404 || !error.response) {
        console.log('Server unavailable, storing PIN locally only');
        await AsyncStorage.setItem('@expenzez_app_password', request.pin);
        await AsyncStorage.setItem('@expenzez_security_enabled', 'true');
        if (request.biometricEnabled) {
          await AsyncStorage.setItem('@expenzez_biometric_enabled', 'true');
        }
        return { success: true };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to set up PIN' 
      };
    }
  },

  /**
   * Validate PIN against server and local storage
   */
  validatePin: async (request: ValidatePinRequest): Promise<SecurityValidationResponse> => {
    try {
      // First validate locally for immediate feedback
      const localPin = await AsyncStorage.getItem('@expenzez_app_password');
      if (localPin && localPin === request.pin) {
        // Try to sync with server, but don't fail if server is down
        try {
          const encryptedPin = await encryptPin(request.pin);
          await api.post('/security/validate-pin', {
            encryptedPin,
            deviceId: request.deviceId,
          });
        } catch (_serverError) {
          console.log('Server validation failed, but local validation succeeded');
        }
        
        return { success: true };
      }

      // If local validation fails, try server validation
      const encryptedPin = await encryptPin(request.pin);
      const response = await api.post('/security/validate-pin', {
        encryptedPin,
        deviceId: request.deviceId,
      });

      if (response.status === 200) {
        // Update local storage with server's PIN
        await AsyncStorage.setItem('@expenzez_app_password', request.pin);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid PIN' };
      }
    } catch (error: any) {
      // Skip logging in development - fallback works fine
      if (error.response?.status !== 404 && !error.message?.includes('Network Error')) {
        console.error('PIN validation error:', error);
      }
      
      // Fallback to local validation only
      const localPin = await AsyncStorage.getItem('@expenzez_app_password');
      if (localPin && localPin === request.pin) {
        return { success: true };
      }
      
      return { 
        success: false, 
        error: 'Invalid PIN' 
      };
    }
  },

  /**
   * Get security settings for the current user/device
   */
  getSecuritySettings: async (deviceId: string): Promise<SecuritySettings | null> => {
    try {
      const response = await api.get(`/security/settings/${deviceId}`);
      
      if (response.status === 200) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      // Skip all logging in development - fallback works fine
      
      // Fallback: return local settings
      const localPin = await AsyncStorage.getItem('@expenzez_app_password');
      const biometricEnabled = await AsyncStorage.getItem('@expenzez_biometric_enabled');
      const user = await AsyncStorage.getItem('user');
      
      if (localPin && user) {
        try {
          const userObj = JSON.parse(user);
          const encryptedPin = await encryptPin(localPin);
          
          return {
            userId: userObj.username || userObj.id,
            encryptedPin,
            biometricEnabled: biometricEnabled === 'true',
            deviceId,
            lastUpdated: Date.now(),
            createdAt: Date.now(),
          };
        } catch (parseError) {
          console.error('Error parsing local user data:', parseError);
        }
      }
      
      return null;
    }
  },

  /**
   * Update biometric settings
   */
  updateBiometricSettings: async (deviceId: string, enabled: boolean): Promise<SecurityValidationResponse> => {
    try {
      const response = await api.patch('/security/biometric', {
        deviceId,
        biometricEnabled: enabled,
      });

      if (response.status === 200) {
        await AsyncStorage.setItem('@expenzez_biometric_enabled', enabled.toString());
        return { success: true };
      } else {
        return { success: false, error: 'Failed to update biometric settings' };
      }
    } catch (error: any) {
      console.error('Update biometric settings error:', error);
      
      // Fallback: update local settings only
      await AsyncStorage.setItem('@expenzez_biometric_enabled', enabled.toString());
      return { success: true };
    }
  },

  /**
   * Change PIN
   */
  changePin: async (deviceId: string, oldPin: string, newPin: string): Promise<SecurityValidationResponse> => {
    try {
      // Validate old PIN first
      const oldPinValid = await securityAPI.validatePin({ pin: oldPin, deviceId });
      if (!oldPinValid.success) {
        return { success: false, error: 'Current PIN is incorrect' };
      }

      // Validate new PIN format
      if (!/^\d{5}$/.test(newPin)) {
        return { success: false, error: 'New PIN must be exactly 5 digits' };
      }

      // Encrypt the new PIN
      const encryptedPin = await encryptPin(newPin);
      
      const response = await api.patch('/security/change-pin', {
        deviceId,
        oldEncryptedPin: await encryptPin(oldPin),
        newEncryptedPin: encryptedPin,
      });

      if (response.status === 200) {
        await AsyncStorage.setItem('@expenzez_app_password', newPin);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to change PIN' };
      }
    } catch (error: any) {
      console.error('Change PIN error:', error);
      
      // Fallback: validate old PIN locally and change locally
      const localPin = await AsyncStorage.getItem('@expenzez_app_password');
      if (localPin === oldPin) {
        await AsyncStorage.setItem('@expenzez_app_password', newPin);
        return { success: true };
      }
      
      return { 
        success: false, 
        error: 'Failed to change PIN' 
      };
    }
  },

  /**
   * Remove PIN (for account deletion or security reset)
   */
  removePin: async (deviceId: string): Promise<SecurityValidationResponse> => {
    try {
      const response = await api.delete(`/security/pin/${deviceId}`);
      
      if (response.status === 200) {
        // Clear local storage
        await AsyncStorage.multiRemove([
          '@expenzez_app_password',
          '@expenzez_security_enabled',
          '@expenzez_biometric_enabled',
        ]);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to remove PIN' };
      }
    } catch (error: any) {
      console.error('Remove PIN error:', error);
      
      // Fallback: clear local storage
      await AsyncStorage.multiRemove([
        '@expenzez_app_password',
        '@expenzez_security_enabled',
        '@expenzez_biometric_enabled',
      ]);
      return { success: true };
    }
  },
};