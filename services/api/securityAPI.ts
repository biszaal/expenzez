import { api } from "../config/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { secureStorage } from "../secureStorage";

export interface SecuritySettings {
  userId: string;
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

export const securityAPI = {
  /**
   * Set up a new 5-digit PIN for the user
   */
  setupPin: async (
    request: SetPinRequest
  ): Promise<SecurityValidationResponse> => {
    try {
      // Validate PIN format
      if (!/^\d{5}$/.test(request.pin)) {
        return { success: false, error: "PIN must be exactly 5 digits" };
      }

      const payload = {
        pin: request.pin,
        deviceId: request.deviceId,
        biometricEnabled: request.biometricEnabled || false,
      };

      const response = await api.post("/security/setup-pin", payload);

      if (response.status === 200) {
        // CRITICAL FIX: Clear old local PIN before storing new one
        console.log(
          "🔒 [SecurityAPI] Clearing old local PIN before storing new PIN"
        );
        await secureStorage.removePinHash();

        // Store new PIN securely in SecureStore for offline validation
        await secureStorage.storePinHash(request.pin);
        await AsyncStorage.setItem("@expenzez_security_enabled", "true");
        if (request.biometricEnabled) {
          await AsyncStorage.setItem("@expenzez_biometric_enabled", "true");
        }

        // Clear PIN removal flag since new PIN is now created
        await AsyncStorage.removeItem("@expenzez_pin_removed");

        console.log(
          "🔒 [SecurityAPI] ✅ PIN setup successful - old PIN cleared, new PIN stored securely in SecureStore"
        );
        console.log("🔒 [SecurityAPI] Server response:", response.data);
        return { success: true };
      } else {
        console.log(
          "🔒 [SecurityAPI] ❌ Server setup failed with status:",
          response.status
        );
        console.log("🔒 [SecurityAPI] Response data:", response.data);
        return {
          success: false,
          error: response.data?.message || "Failed to set up PIN",
        };
      }
    } catch (error: any) {
      // Skip logging in development - fallback works fine
      if (
        error.response?.status !== 404 &&
        !error.message?.includes("Network Error")
      ) {
        console.error("PIN setup error:", error);
      }

      // Fallback: store locally if server is unavailable
      if (error.response?.status === 404 || !error.response) {
        console.log(
          "🔒 [SecurityAPI] ⚠️ Server unavailable, storing PIN locally securely"
        );
        console.log("🔒 [SecurityAPI] Error details:", error.message);

        // CRITICAL FIX: Clear old local PIN before storing new one (fallback case)
        console.log(
          "🔒 [SecurityAPI] Clearing old local PIN before storing new PIN (fallback)"
        );
        await secureStorage.removePinHash();

        await secureStorage.storePinHash(request.pin);
        await AsyncStorage.setItem("@expenzez_security_enabled", "true");
        if (request.biometricEnabled) {
          await AsyncStorage.setItem("@expenzez_biometric_enabled", "true");
        }

        // Clear PIN removal flag since new PIN is now created
        await AsyncStorage.removeItem("@expenzez_pin_removed");

        console.log(
          "🔒 [SecurityAPI] ✅ PIN stored securely in SecureStore as fallback (server will sync later)"
        );
        return { success: true };
      }

      return {
        success: false,
        error: error.response?.data?.message || "Failed to set up PIN",
      };
    }
  },

  /**
   * Validate PIN against server and local storage
   */
  validatePin: async (
    request: ValidatePinRequest
  ): Promise<SecurityValidationResponse> => {
    try {
      console.log(
        "🔒 [SecurityAPI] Validating PIN for device:",
        request.deviceId
      );

      // Check if security is enabled
      const securityEnabled = await AsyncStorage.getItem(
        "@expenzez_security_enabled"
      );
      if (securityEnabled !== "true") {
        console.log(
          "🔒 [SecurityAPI] Security not enabled, rejecting PIN validation"
        );
        return { success: false, error: "Security not enabled" };
      }

      // First validate locally using SecureStore for immediate feedback
      const hasLocalPin = await secureStorage.hasPinHash();
      console.log("🔒 [SecurityAPI] Local PIN check:", {
        hasLocalPin: hasLocalPin,
        requestPin: request.pin.substring(0, 2) + "***",
      });

      // If no local PIN exists, validation should fail
      if (!hasLocalPin) {
        console.log("🔒 [SecurityAPI] No local PIN found in SecureStore, validation failed");

        // EMERGENCY FIX: If no PIN exists, completely disable security to prevent lock loop
        console.log(
          "🚨 [SecurityAPI] EMERGENCY: No PIN found but app is locked - force disabling security"
        );
        await AsyncStorage.multiRemove([
          "@expenzez_security_enabled",
          "@expenzez_app_locked",
          "@expenzez_last_unlock",
          "@expenzez_biometric_enabled",
        ]);

        return { success: false, error: "No PIN set up - security disabled" };
      }

      // Verify PIN against secure hash
      const isValid = await secureStorage.verifyPin(request.pin);
      if (isValid) {
        console.log("🔒 [SecurityAPI] Local validation successful (SecureStore)");
        // Try to sync with server, but don't fail if server is down
        try {
          await api.post("/security/validate-pin", {
            pin: request.pin,
            deviceId: request.deviceId,
          });
          console.log(
            "🔒 [SecurityAPI] Local and server validation both successful"
          );
        } catch (serverError: any) {
          console.log(
            "🔒 [SecurityAPI] Server validation failed, but local validation succeeded - continuing...",
            {
              status: serverError.response?.status,
              isNetworkError: !serverError.response,
              error: serverError.message,
            }
          );
          // Don't let server validation errors affect local validation success
          // This prevents session logout when PIN is correct but server has issues
        }

        return { success: true };
      }

      // If local validation fails, try server validation
      console.log(
        "🔒 [SecurityAPI] Local validation failed, trying server validation"
      );
      const response = await api.post("/security/validate-pin", {
        pin: request.pin,
        deviceId: request.deviceId,
      });

      if (response.status === 200) {
        console.log(
          "🔒 [SecurityAPI] Server validation successful, updating SecureStore with PIN hash"
        );
        // Update local storage with server's PIN (store hash securely)
        await secureStorage.storePinHash(request.pin);
        return { success: true };
      } else {
        console.log(
          "🔒 [SecurityAPI] Server validation failed with status:",
          response.status
        );
        return { success: false, error: "Invalid PIN" };
      }
    } catch (error: any) {
      console.log(
        "🔒 [SecurityAPI] Server validation failed, using local fallback:",
        {
          errorType: error.constructor.name,
          status: error.response?.status,
          isNetworkError: !error.response,
          hasLocalPin: await secureStorage.hasPinHash(),
        }
      );

      // For security endpoints, server failures (like 401) are expected for incorrect PINs
      // Always fallback to local validation if server fails
      const isValid = await secureStorage.verifyPin(request.pin);
      if (isValid) {
        console.log(
          "🔒 [SecurityAPI] Local PIN validation successful (server failed)"
        );
        return { success: true };
      }

      console.log("🔒 [SecurityAPI] Both server and local validation failed");
      // For PIN validation, we return a specific error that won't cause logout
      return {
        success: false,
        error: "Invalid PIN",
      };
    }
  },

  /**
   * Get security settings for the current user/device
   */
  getSecuritySettings: async (
    deviceId: string
  ): Promise<SecuritySettings | null> => {
    try {
      console.log(
        "🔒 [SecurityAPI] Fetching security settings from server for device:",
        deviceId
      );
      const response = await api.get(`/security/settings/${deviceId}`);

      if (response.status === 200) {
        const payload = response.data?.settings || response.data;

        if (payload) {
          console.log("🔒 [SecurityAPI] ✅ Server security settings found:", {
            hasServerRecord: !!payload.deviceId,
            biometricEnabled: payload.biometricEnabled,
          });
          return {
            userId: payload.userId,
            biometricEnabled: !!payload.biometricEnabled,
            deviceId: payload.deviceId,
            lastUpdated: payload.lastUpdated || Date.now(),
            createdAt: payload.createdAt || Date.now(),
          };
        }
      }
      console.log(
        "🔒 [SecurityAPI] Server returned non-200 status:",
        response.status
      );
      return null;
    } catch (error: any) {
      console.log(
        "🔒 [SecurityAPI] ⚠️ Server security settings fetch failed, using local fallback"
      );
      console.log(
        "🔒 [SecurityAPI] Error:",
        error.response?.status || error.message
      );

      // Fallback: return local settings from SecureStore
      const hasLocalPin = await secureStorage.hasPinHash();
      const biometricEnabled = await AsyncStorage.getItem(
        "@expenzez_biometric_enabled"
      );
      const user = await AsyncStorage.getItem("user");

      console.log("🔒 [SecurityAPI] Local fallback check:", {
        hasLocalPin: hasLocalPin,
        hasUser: !!user,
        biometricEnabled: biometricEnabled === "true",
      });

      if (hasLocalPin && user) {
        try {
          const userObj = JSON.parse(user);
          const localSettings = {
            userId: userObj.username || userObj.id,
            biometricEnabled: biometricEnabled === "true",
            deviceId,
            lastUpdated: Date.now(),
            createdAt: Date.now(),
          };

          console.log(
            "🔒 [SecurityAPI] ✅ Local security settings created as fallback"
          );
          return localSettings;
        } catch (parseError) {
          console.error(
            "🔒 [SecurityAPI] ❌ Error parsing local user data:",
            parseError
          );
        }
      }

      console.log("🔒 [SecurityAPI] ❌ No local PIN or user data found");
      return null;
    }
  },

  /**
   * Update biometric settings
   */
  updateBiometricSettings: async (
    deviceId: string,
    enabled: boolean
  ): Promise<SecurityValidationResponse> => {
    try {
      const response = await api.patch("/security/biometric", {
        deviceId,
        biometricEnabled: enabled,
      });

      if (response.status === 200) {
        await AsyncStorage.setItem(
          "@expenzez_biometric_enabled",
          enabled.toString()
        );
        return { success: true };
      } else {
        return { success: false, error: "Failed to update biometric settings" };
      }
    } catch (error: any) {
      console.error("Update biometric settings error:", error);

      // Fallback: update local settings only
      await AsyncStorage.setItem(
        "@expenzez_biometric_enabled",
        enabled.toString()
      );
      return { success: true };
    }
  },

  /**
   * Change PIN
   */
  changePin: async (
    deviceId: string,
    oldPin: string,
    newPin: string
  ): Promise<SecurityValidationResponse> => {
    try {
      // Validate old PIN first
      const oldPinValid = await securityAPI.validatePin({
        pin: oldPin,
        deviceId,
      });
      if (!oldPinValid.success) {
        return { success: false, error: "Current PIN is incorrect" };
      }

      // Validate new PIN format
      if (!/^\d{5}$/.test(newPin)) {
        return { success: false, error: "New PIN must be exactly 5 digits" };
      }

      const response = await api.patch("/security/change-pin", {
        deviceId,
        oldPin,
        newPin,
      });

      if (response.status === 200) {
        await secureStorage.storePinHash(newPin);
        return { success: true };
      } else {
        return { success: false, error: "Failed to change PIN" };
      }
    } catch (error: any) {
      console.error("Change PIN error:", error);

      // Fallback: validate old PIN locally and change locally
      const isOldPinValid = await secureStorage.verifyPin(oldPin);
      if (isOldPinValid) {
        await secureStorage.storePinHash(newPin);
        return { success: true };
      }

      return {
        success: false,
        error: "Failed to change PIN",
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
        // Clear secure storage
        await secureStorage.removePinHash();
        await AsyncStorage.multiRemove([
          "@expenzez_security_enabled",
          "@expenzez_biometric_enabled",
        ]);
        return { success: true };
      } else {
        return { success: false, error: "Failed to remove PIN" };
      }
    } catch (error: any) {
      // Only log non-network errors to reduce noise
      if (
        error.response?.status !== 404 &&
        !error.message?.includes("Network Error") &&
        !error.message?.includes("timeout")
      ) {
        console.log(
          "🔒 [SecurityAPI] Server PIN removal had issues, using local fallback:",
          error.message
        );
      } else {
        console.log(
          "🔒 [SecurityAPI] Server unavailable during PIN removal, clearing locally"
        );
      }

      // Fallback: clear secure storage
      await secureStorage.removePinHash();
      await AsyncStorage.multiRemove([
        "@expenzez_security_enabled",
        "@expenzez_biometric_enabled",
      ]);
      return { success: true };
    }
  },
};
