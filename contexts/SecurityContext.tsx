import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";

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

  useEffect(() => {
    checkSecurityStatus();
    setupAppStateListener();
  }, []);

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
      const securityEnabled = await AsyncStorage.getItem(SECURITY_ENABLED_KEY);
      const appLocked = await AsyncStorage.getItem(APP_LOCKED_KEY);

      setIsSecurityEnabled(securityEnabled === "true");
      setIsLocked(appLocked === "true");
    } catch (error) {
      console.error("Error checking security status:", error);
    }
  };

  const lockApp = async () => {
    try {
      await AsyncStorage.setItem(APP_LOCKED_KEY, "true");
      setIsLocked(true);
    } catch (error) {
      console.error("Error locking app:", error);
    }
  };

  const unlockApp = async () => {
    try {
      await AsyncStorage.setItem(APP_LOCKED_KEY, "false");
      setIsLocked(false);
    } catch (error) {
      console.error("Error unlocking app:", error);
    }
  };

  const enableSecurity = async () => {
    try {
      await AsyncStorage.setItem(SECURITY_ENABLED_KEY, "true");
      await AsyncStorage.setItem(APP_LOCKED_KEY, "true");
      setIsSecurityEnabled(true);
      setIsLocked(true);
    } catch (error) {
      console.error("Error enabling security:", error);
    }
  };

  const disableSecurity = async () => {
    try {
      await AsyncStorage.setItem(SECURITY_ENABLED_KEY, "false");
      await AsyncStorage.setItem(APP_LOCKED_KEY, "false");
      setIsSecurityEnabled(false);
      setIsLocked(false);
    } catch (error) {
      console.error("Error disabling security:", error);
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
