import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
import { securityAPI } from "../services/api/securityAPI";
import { deviceManager } from "../services/deviceManager";
import { useAuth } from "../app/auth/AuthContext";

interface SecurityContextType {
  isLocked: boolean;
  isSecurityEnabled: boolean;
  lockApp: () => void;
  unlockApp: () => void;
  enableSecurity: () => Promise<void>;
  disableSecurity: () => Promise<void>;
  checkSecurityStatus: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(
  undefined
);

const SECURITY_ENABLED_KEY = "@expenzez_security_enabled";
const APP_LOCKED_KEY = "@expenzez_app_locked";

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(false);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    checkSecurityStatus();
    setupAppStateListener();
  }, [isLoggedIn]); // Re-check security status when login state changes

  const setupAppStateListener = () => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        // Lock app when it goes to background
        if (isSecurityEnabled) {
          lockApp();
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  };

  const checkSecurityStatus = async () => {
    try {
      console.log('🔐 [SecurityContext] Checking security status...');
      
      // Only check server/database for user's PIN if logged in
      let hasPinOnServer = false;
      if (isLoggedIn) {
        try {
          const deviceId = await deviceManager.getDeviceId();
          const securitySettings = await securityAPI.getSecuritySettings(deviceId);
          hasPinOnServer = !!securitySettings;
          
          console.log('🔐 [SecurityContext] Server PIN check:', { hasPinOnServer });
        } catch (error) {
          // Silently handle server errors - no user-facing error needed
          console.log('🔐 [SecurityContext] Server check failed, using local fallback');
          hasPinOnServer = false;
        }
      } else {
        console.log('🔐 [SecurityContext] User not logged in, skipping server PIN check');
      }

      // Fallback to local storage
      const hasLocalPin = await AsyncStorage.getItem("@expenzez_app_password");
      const hasPin = hasPinOnServer || !!hasLocalPin;

      console.log('🔐 [SecurityContext] PIN status:', { hasPinOnServer, hasLocalPin: !!hasLocalPin, hasPin });

      // If logged in, PIN setup/entry is mandatory
      if (isLoggedIn) {
        if (hasPin) {
          console.log('🔐 [SecurityContext] PIN found - enabling security and locking app for PIN entry');
          setIsSecurityEnabled(true);
          setIsLocked(true);
          // Update stored values
          await AsyncStorage.setItem(SECURITY_ENABLED_KEY, "true");
          await AsyncStorage.setItem(APP_LOCKED_KEY, "true");
        } else {
          console.log('🔐 [SecurityContext] No PIN found but user is logged in - mandatory PIN setup required');
          setIsSecurityEnabled(true); // Enable security to trigger setup
          setIsLocked(true); // Lock app to show PIN setup screen
          // Update stored values
          await AsyncStorage.setItem(SECURITY_ENABLED_KEY, "true");
          await AsyncStorage.setItem(APP_LOCKED_KEY, "true");
        }
      } else {
        console.log('🔐 [SecurityContext] User not logged in - using stored security settings');
        const securityEnabled = await AsyncStorage.getItem(SECURITY_ENABLED_KEY);
        const appLocked = await AsyncStorage.getItem(APP_LOCKED_KEY);
        setIsSecurityEnabled(securityEnabled === "true");
        setIsLocked(appLocked === "true");
      }
    } catch (error) {
      // Silently handle errors and use safe defaults
      console.log("🔐 [SecurityContext] Error checking security status, using safe defaults");
      // Default to secure state - if we can't check, assume security should be enabled
      setIsSecurityEnabled(true);
      setIsLocked(false); // Don't lock if we can't determine status
    }
  };

  const lockApp = async () => {
    try {
      await AsyncStorage.setItem(APP_LOCKED_KEY, "true");
      setIsLocked(true);
    } catch (error) {
      // Silently handle storage errors, still update state
      console.log("🔐 [SecurityContext] Storage error during lock, using memory state");
      setIsLocked(true);
    }
  };

  const unlockApp = async () => {
    try {
      await AsyncStorage.setItem(APP_LOCKED_KEY, "false");
      setIsLocked(false);
    } catch (error) {
      // Silently handle storage errors, still update state
      console.log("🔐 [SecurityContext] Storage error during unlock, using memory state");
      setIsLocked(false);
    }
  };

  const enableSecurity = async () => {
    try {
      await AsyncStorage.setItem(SECURITY_ENABLED_KEY, "true");
      await AsyncStorage.setItem(APP_LOCKED_KEY, "true");
      setIsSecurityEnabled(true);
      setIsLocked(true);
    } catch (error) {
      // Silently handle storage errors, still update state
      console.log("🔐 [SecurityContext] Storage error during enable, using memory state");
      setIsSecurityEnabled(true);
      setIsLocked(true);
    }
  };

  const disableSecurity = async () => {
    try {
      await AsyncStorage.setItem(SECURITY_ENABLED_KEY, "false");
      await AsyncStorage.setItem(APP_LOCKED_KEY, "false");
      setIsSecurityEnabled(false);
      setIsLocked(false);
    } catch (error) {
      // Silently handle storage errors, still update state
      console.log("🔐 [SecurityContext] Storage error during disable, using memory state");
      setIsSecurityEnabled(false);
      setIsLocked(false);
    }
  };

  const value: SecurityContextType = {
    isLocked,
    isSecurityEnabled,
    lockApp,
    unlockApp,
    enableSecurity,
    disableSecurity,
    checkSecurityStatus,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
};
