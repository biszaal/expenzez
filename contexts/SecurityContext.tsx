import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
import { nativeSecurityAPI } from "../services/api/nativeSecurityAPI";
import { nativeCryptoStorage } from "../services/nativeCryptoStorage";
import { deviceManager } from "../services/deviceManager";
import { useAuth } from "../app/auth/AuthContext";
import { enhancedSecurityAPI, UserSecurityPreferences } from "../services/api/enhancedSecurityAPI";

interface SecurityContextType {
  isLocked: boolean;
  isSecurityEnabled: boolean;
  needsPinSetup: boolean;
  isInitialized: boolean;
  securityPreferences: UserSecurityPreferences | null;
  lockApp: () => void;
  unlockApp: () => void;
  extendSession: () => Promise<void>;
  enableSecurity: () => Promise<void>;
  disableSecurity: () => Promise<void>;
  checkSecurityStatus: () => Promise<void>;
  syncSecurityPreferences: () => Promise<void>;
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
  const [needsPinSetup, setNeedsPinSetup] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [securityPreferences, setSecurityPreferences] = useState<UserSecurityPreferences | null>(null);
  const { isLoggedIn } = useAuth();

  // Debouncing ref to prevent excessive API calls
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initializeSecureSystem();
    setupAppStateListener();

    // Cleanup debounce timeout on unmount
    return () => {
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
      }
    };
  }, [isLoggedIn]); // Re-check security status when login state changes

  const initializeSecureSystem = async () => {
    try {
      console.log('🔐 [SecurityContext] Initializing secure security system...');

      // Step 1: Check if app should start in locked state
      const storedLockState = await AsyncStorage.getItem(APP_LOCKED_KEY);
      const storedSecurityEnabled = await AsyncStorage.getItem(SECURITY_ENABLED_KEY);
      const appLockPreference = await AsyncStorage.getItem('@expenzez_app_lock_preference');

      console.log('🔐 [SecurityContext] Initial storage check:', {
        storedLockState,
        storedSecurityEnabled,
        appLockPreference,
        isLoggedIn
      });

      // ALWAYS clear session on app startup to force fresh authentication
      // This ensures PIN is required every time the app is opened
      console.log('🔐 [SecurityContext] App startup - clearing all sessions to force fresh PIN entry');
      try {
        await nativeSecurityAPI.clearSession();
        await AsyncStorage.removeItem('@expenzez_last_unlock');
        console.log('🔐 [SecurityContext] ✅ All sessions cleared on app startup');
      } catch (clearError) {
        console.warn('🔐 [SecurityContext] Could not clear session on startup:', clearError);
      }

      // If security is enabled (legacy OR preference) and user is logged in, start locked
      const shouldStartLocked = (storedSecurityEnabled === 'true' || appLockPreference === 'true') && isLoggedIn;

      if (shouldStartLocked) {
        console.log('🔐 [SecurityContext] Security enabled on app startup - starting locked for PIN entry');
        setIsLocked(true);
        setIsSecurityEnabled(true);
        await AsyncStorage.setItem(APP_LOCKED_KEY, "true");
      }

      // Step 2: Initialize the secure security API with better error handling
      try {
        await nativeSecurityAPI.initialize();
        console.log('🔐 [SecurityContext] Secure API initialized successfully');
      } catch (initError: any) {
        console.warn('🔐 [SecurityContext] Secure API initialization failed (non-critical):', initError.message);
        // Don't fail the entire system if initialization has issues
      }

      // Step 3: Always check security status (this should work even if initialization failed)
      await checkSecurityStatus();
      
      setIsInitialized(true);
      console.log('🔐 [SecurityContext] ✅ Security system initialized');
    } catch (error) {
      console.error('🔐 [SecurityContext] ❌ Critical error in security initialization:', error);
      
      // Even on critical error, try basic security check
      try {
        await checkSecurityStatus();
      } catch (statusError) {
        console.error('🔐 [SecurityContext] ❌ Security status check also failed:', statusError);
        // Set safe defaults
        setIsSecurityEnabled(false);
        setIsLocked(false);
        setNeedsPinSetup(false);
      }
      
      setIsInitialized(true);
    }
  };

  const setupAppStateListener = () => {
    let backgroundTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Clear any pending background timeout
      if (backgroundTimeout) {
        clearTimeout(backgroundTimeout);
        backgroundTimeout = null;
      }

      if (nextAppState === "background") {
        // Only lock when app actually goes to background, not just inactive
        if (isSecurityEnabled) {
          console.log('🔐 [SecurityContext] App backgrounded, locking in 500ms...');
          // Add small delay to prevent locking during navigation transitions
          backgroundTimeout = setTimeout(() => {
            lockApp();
          }, 500);
        }
      } else if (nextAppState === "active") {
        console.log('🔐 [SecurityContext] App became active, canceling any pending lock');
        // App became active again, don't lock
        if (backgroundTimeout) {
          clearTimeout(backgroundTimeout);
          backgroundTimeout = null;
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      if (backgroundTimeout) {
        clearTimeout(backgroundTimeout);
      }
      subscription?.remove();
    };
  };

  const syncSecurityPreferences = useCallback(async () => {
    try {
      if (!isLoggedIn) {
        console.log('🔐 [SecurityContext] Not logged in, skipping preference sync');
        setSecurityPreferences(null);
        return;
      }

      console.log('🔐 [SecurityContext] Syncing security preferences from server...');

      const preferences = await enhancedSecurityAPI.getSecurityPreferences();

      if (preferences) {
        console.log('🔐 [SecurityContext] ✅ Synced preferences:', {
          appLockEnabled: preferences.appLockEnabled,
          biometricEnabled: preferences.biometricEnabled,
          sessionTimeout: preferences.sessionTimeout,
        });
        setSecurityPreferences(preferences);
      } else {
        console.log('🔐 [SecurityContext] ⚠️ No preferences found, checking local fallback storage');

        // Check for local fallback storage
        try {
          const localAppLockPref = await AsyncStorage.getItem('@expenzez_app_lock_preference');
          const appLockEnabled = localAppLockPref === 'true';

          const fallbackPrefs: UserSecurityPreferences = {
            appLockEnabled: appLockEnabled,
            biometricEnabled: false,
            sessionTimeout: 5 * 60 * 1000,
            maxAttempts: 5,
            lastUpdated: Date.now(),
          };

          console.log('🔐 [SecurityContext] ✅ Using local fallback preferences:', { appLockEnabled });
          setSecurityPreferences(fallbackPrefs);
        } catch (localError) {
          console.log('🔐 [SecurityContext] ⚠️ Local fallback failed, using defaults');
          const defaultPrefs: UserSecurityPreferences = {
            appLockEnabled: false,
            biometricEnabled: false,
            sessionTimeout: 5 * 60 * 1000,
            maxAttempts: 5,
            lastUpdated: Date.now(),
          };
          setSecurityPreferences(defaultPrefs);
        }
      }
    } catch (error) {
      console.error('🔐 [SecurityContext] ❌ Error syncing preferences:', error);

      // Try to use local fallback storage first
      try {
        const localAppLockPref = await AsyncStorage.getItem('@expenzez_app_lock_preference');
        const appLockEnabled = localAppLockPref === 'true';

        console.log('🔐 [SecurityContext] ✅ Using local fallback after error:', { appLockEnabled });
        setSecurityPreferences({
          appLockEnabled: appLockEnabled,
          biometricEnabled: false,
          sessionTimeout: 5 * 60 * 1000,
          maxAttempts: 5,
          lastUpdated: Date.now(),
        });
      } catch (localError) {
        console.log('🔐 [SecurityContext] ⚠️ Local fallback also failed, using defaults');
        // Use fallback defaults
        setSecurityPreferences({
          appLockEnabled: false,
          biometricEnabled: false,
          sessionTimeout: 5 * 60 * 1000,
          maxAttempts: 5,
          lastUpdated: Date.now(),
        });
      }
    }
  }, [isLoggedIn]);

  // Debounced sync to prevent excessive API calls
  const debouncedSyncPreferences = useCallback(() => {
    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }
    syncDebounceRef.current = setTimeout(() => {
      console.log('🔐 [SecurityContext] Debounced preference sync triggered');
      syncSecurityPreferences();
    }, 500);
  }, [syncSecurityPreferences]);

  const checkSecurityStatus = useCallback(async () => {
    try {
      console.log('🔐 [SecurityContext] Checking enhanced security status...', { isLoggedIn });

      if (isLoggedIn) {
        // Step 1: Sync security preferences from server
        await syncSecurityPreferences();

        // Step 2: Get comprehensive security status
        const securityStatus = await enhancedSecurityAPI.getSecurityStatus();

        if (securityStatus) {
          console.log('🔐 [SecurityContext] Enhanced security status:', {
            appLockEnabled: securityStatus.preferences.appLockEnabled,
            hasDevicePIN: securityStatus.hasDevicePIN,
            needsPinSetup: securityStatus.needsPinSetup,
          });

          // Update state based on server preferences
          setIsSecurityEnabled(securityStatus.preferences.appLockEnabled);
          setNeedsPinSetup(securityStatus.needsPinSetup);

          // Determine lock state
          if (securityStatus.preferences.appLockEnabled) {
            if (securityStatus.hasDevicePIN) {
              // Check if we have a valid session
              const hasValidSession = await nativeSecurityAPI.hasValidSession();
              setIsLocked(!hasValidSession);
              console.log('🔐 [SecurityContext] App lock enabled with PIN, locked:', !hasValidSession);
            } else {
              // App lock enabled but no PIN on this device - don't lock yet, show PIN setup
              setIsLocked(false);
              console.log('🔐 [SecurityContext] App lock enabled but no device PIN - PIN setup needed');
            }
          } else {
            // App lock disabled - ensure app is unlocked
            setIsLocked(false);
            console.log('🔐 [SecurityContext] App lock disabled - app unlocked');
          }

          // Update backward compatibility storage
          await AsyncStorage.setItem(SECURITY_ENABLED_KEY, securityStatus.preferences.appLockEnabled.toString());
          await AsyncStorage.setItem(APP_LOCKED_KEY, (!securityStatus.preferences.appLockEnabled || securityStatus.hasDevicePIN) ? "false" : "true");
        } else {
          console.log('🔐 [SecurityContext] ⚠️ Could not get enhanced status, falling back to legacy check');
          await checkSecurityStatusLegacy();
        }
      } else {
        console.log('🔐 [SecurityContext] User not logged in - clearing security state');
        setIsSecurityEnabled(false);
        setIsLocked(false);
        setNeedsPinSetup(false);
        setSecurityPreferences(null);

        await AsyncStorage.setItem(SECURITY_ENABLED_KEY, "false");
        await AsyncStorage.setItem(APP_LOCKED_KEY, "false");
      }
    } catch (error) {
      console.error("🔐 [SecurityContext] Error checking enhanced security status:", error);
      // Fallback to legacy method
      await checkSecurityStatusLegacy();
    }
  }, [isLoggedIn, syncSecurityPreferences]);

  const checkSecurityStatusLegacy = useCallback(async () => {
    try {
      console.log('🔐 [SecurityContext] Falling back to legacy security check...', { isLoggedIn });
      
      // Only check server/database for user's PIN if logged in
      let hasPinOnServer = false;
      if (isLoggedIn) {
        try {
          const deviceId = await deviceManager.getDeviceId();
          const securitySettings = await nativeSecurityAPI.getSecuritySettings(deviceId);
          hasPinOnServer = !!securitySettings && !!securitySettings.encryptedPin;
          
          console.log('🔐 [SecurityContext] Server PIN check:', { 
            hasPinOnServer, 
            hasSettings: !!securitySettings,
            hasEncryptedPin: !!securitySettings?.encryptedPin 
          });

          // CRITICAL FIX: If server has PIN but local doesn't, sync it down
          // This happens when user logs in from a different device or after cache clear
          // BUT: Don't sync if security was just disabled (check the security enabled flag)
          if (hasPinOnServer && securitySettings?.encryptedPin) {
            const hasLocalPin = await AsyncStorage.getItem("@expenzez_app_password");
            const isSecurityLocallyEnabled = await AsyncStorage.getItem(SECURITY_ENABLED_KEY);
            
            // Only sync down if security is enabled locally - prevents re-enabling after disable
            if (!hasLocalPin && isSecurityLocallyEnabled === 'true') {
              console.log('🔐 [SecurityContext] Server PIN exists but no local PIN - syncing down');
              // Store the server's encrypted PIN locally for validation
              await AsyncStorage.setItem("@expenzez_app_password", securitySettings.encryptedPin);
              console.log('🔐 [SecurityContext] Server PIN synced to local storage');
            } else if (!hasLocalPin && isSecurityLocallyEnabled !== 'true') {
              console.log('🔐 [SecurityContext] Server PIN exists but security disabled locally - not syncing');
            }
          }
        } catch (error) {
          // Silently handle server errors - no user-facing error needed
          console.log('🔐 [SecurityContext] Server check failed, using local fallback');
          hasPinOnServer = false;
        }
      } else {
        console.log('🔐 [SecurityContext] User not logged in, skipping server PIN check');
      }

      // For production app, prioritize database (server) PIN as source of truth
      // Local PIN is backup for offline scenarios
      // Re-check local PIN after potential server sync
      const hasLocalPin = await AsyncStorage.getItem("@expenzez_app_password");
      
      // DATABASE FIRST: If server has PIN, that's authoritative
      // Local PIN is only used if server is unavailable
      const hasPin = hasPinOnServer || !!hasLocalPin;
      
      console.log('🔐 [SecurityContext] PIN authority check:', { 
        hasPinOnServer, 
        hasLocalPin: !!hasLocalPin, 
        hasPin,
        prioritySource: hasPinOnServer ? 'SERVER' : hasLocalPin ? 'LOCAL' : 'NONE'
      });

      console.log('🔐 [SecurityContext] PIN status:', { hasPinOnServer, hasLocalPin: !!hasLocalPin, hasPin });

      // If logged in, check if PIN exists for optional security
      if (isLoggedIn) {
        // CRITICAL FIX: Check if user has locally disabled security before re-enabling
        const isSecurityLocallyEnabled = await AsyncStorage.getItem(SECURITY_ENABLED_KEY);

        // ENHANCED FIX: Read preferences directly from storage to avoid timing issues
        let currentAppLockPreference = securityPreferences?.appLockEnabled;
        if (currentAppLockPreference === undefined) {
          // If state is not yet updated, read directly from local storage
          const localAppLockPref = await AsyncStorage.getItem('@expenzez_app_lock_preference');
          currentAppLockPreference = localAppLockPref === 'true';
          console.log('🔐 [SecurityContext] State not ready, reading from storage:', { currentAppLockPreference });
        }

        // Prioritize security preferences over legacy storage
        // If preferences say appLockEnabled=true, that overrides legacy "false" setting
        const shouldEnableSecurity = hasPin && (
          currentAppLockPreference === true ||
          (currentAppLockPreference !== false && isSecurityLocallyEnabled !== 'false')
        );

        console.log('🔐 [SecurityContext] Security state check:', {
          hasPin,
          hasLocalPin: !!hasLocalPin,
          isSecurityLocallyEnabled,
          appLockEnabled: securityPreferences?.appLockEnabled,
          currentAppLockPreference,
          shouldEnableSecurity,
          condition1: hasPin && isSecurityLocallyEnabled !== 'false',
          condition2: hasPin && isSecurityLocallyEnabled === 'false'
        });

        // DATABASE PRIORITY: If PIN exists (server or local), enable security unless explicitly disabled
        if (shouldEnableSecurity) {
          console.log('🔐 [SecurityContext] PIN found (server or local) and security not disabled - enabling security');
          console.log('🔐 [SecurityContext] Enabling security - PIN source:', hasPinOnServer ? 'SERVER' : 'LOCAL');
          setIsSecurityEnabled(true);
          
          // Use session-based locking: if no recent unlock session, require PIN
          const lastUnlockTime = await AsyncStorage.getItem('@expenzez_last_unlock');
          const now = Date.now();
          const sessionTimeout = 2 * 60 * 1000; // 2 minutes session for testing (was 15 minutes)
          
          const hasValidSession = lastUnlockTime && (now - parseInt(lastUnlockTime)) < sessionTimeout;
          
          console.log('🔐 [SecurityContext] Session check:', {
            lastUnlockTime: lastUnlockTime ? new Date(parseInt(lastUnlockTime)).toISOString() : 'null',
            now: new Date(now).toISOString(),
            sessionAge: lastUnlockTime ? (now - parseInt(lastUnlockTime)) / 1000 + 's' : 'N/A',
            sessionTimeout: sessionTimeout / 1000 + 's',
            hasValidSession
          });
          
          if (!hasValidSession) {
            console.log('🔐 [SecurityContext] ⚠️ No valid unlock session - LOCKING for PIN entry');
            setIsLocked(true);
            await AsyncStorage.setItem(APP_LOCKED_KEY, "true");
            console.log('🔐 [SecurityContext] App locked state set to TRUE');
          } else {
            console.log('🔐 [SecurityContext] ✅ Valid unlock session found - staying unlocked');
            setIsLocked(false);
            await AsyncStorage.setItem(APP_LOCKED_KEY, "false");
            console.log('🔐 [SecurityContext] App locked state set to FALSE');
          }
          
          setNeedsPinSetup(false);
          // Update legacy storage to match the new security state
          await AsyncStorage.setItem(SECURITY_ENABLED_KEY, "true");
        } else if (hasPin && !shouldEnableSecurity) {
          console.log('🔐 [SecurityContext] PIN found but security explicitly disabled - respecting local choice');
          setIsSecurityEnabled(false);
          setIsLocked(false);
          setNeedsPinSetup(false);

          // Keep security disabled state
          await AsyncStorage.setItem(SECURITY_ENABLED_KEY, "false");
          await AsyncStorage.setItem(APP_LOCKED_KEY, "false");
        } else {
          console.log('🔐 [SecurityContext] No PIN found (server or local) - security disabled, app unlocked');
          
          // CRITICAL FIX: When no PIN exists anywhere, completely disable security
          // This prevents the PIN screen from showing when there's nothing to validate against
          setIsSecurityEnabled(false);
          setIsLocked(false);
          setNeedsPinSetup(false);
          
          // Clear any stale security state that might cause issues
          await AsyncStorage.setItem(SECURITY_ENABLED_KEY, "false");
          await AsyncStorage.setItem(APP_LOCKED_KEY, "false");
          await AsyncStorage.removeItem("@expenzez_app_password");
          await AsyncStorage.removeItem("@expenzez_biometric_enabled");
          await AsyncStorage.removeItem("@expenzez_last_unlock");
          
          console.log('🔐 [SecurityContext] Security completely disabled - no PIN exists anywhere');
        }
      } else {
        console.log('🔐 [SecurityContext] User not logged in - clearing security state');
        // When user is logged out, clear all security state to prevent PIN validation issues
        // This prevents the scenario where app was locked but user session expired
        setIsSecurityEnabled(false);
        setIsLocked(false);
        setNeedsPinSetup(false);
        
        // Clear potentially stale security storage
        await AsyncStorage.setItem(SECURITY_ENABLED_KEY, "false");
        await AsyncStorage.setItem(APP_LOCKED_KEY, "false");
        await AsyncStorage.removeItem("@expenzez_last_unlock");
        
        console.log('🔐 [SecurityContext] Security state cleared - app unlocked for logged out user');
      }
    } catch (error) {
      // Silently handle errors and use safe defaults
      console.log("🔐 [SecurityContext] Error checking security status, using safe defaults");
      // If we can't determine status, default to unlocked state to prevent user lockout
      // This is safer than defaulting to locked, especially after session expiry
      setIsSecurityEnabled(false);
      setIsLocked(false);
    }
  }, [isLoggedIn, securityPreferences]);

  const lockApp = useCallback(async () => {
    try {
      console.log("🔐 [SecurityContext] Locking app (going to background)");

      // Use secure API to clear session
      await nativeSecurityAPI.clearSession();

      // Update local state
      await AsyncStorage.setItem(APP_LOCKED_KEY, "true");
      setIsLocked(true);
    } catch (error) {
      // Silently handle storage errors, still update state
      console.log("🔐 [SecurityContext] Storage error during lock, using memory state");
      setIsLocked(true);
    }
  }, []);

  const unlockApp = useCallback(async () => {
    try {
      console.log("🔐 [SecurityContext] Unlocking app (PIN validated)");

      // Create session using secure API
      const deviceId = await deviceManager.getDeviceId();
      await nativeSecurityAPI.clearSession(); // Clear any old session first
      await nativeCryptoStorage.createSession(deviceId); // Create new session

      // Update local state and backward compatibility
      await AsyncStorage.setItem(APP_LOCKED_KEY, "false");
      await AsyncStorage.setItem('@expenzez_last_unlock', Date.now().toString());
      setIsLocked(false);
    } catch (error) {
      // Silently handle storage errors, still update state
      console.log("🔐 [SecurityContext] Storage error during unlock, using memory state");
      setIsLocked(false);
    }
  }, []);

  const extendSession = useCallback(async () => {
    try {
      // Extend both session systems
      await nativeSecurityAPI.extendSession();
      await AsyncStorage.setItem('@expenzez_last_unlock', Date.now().toString());
      console.log("🔐 [SecurityContext] ✅ Session extended (both systems)");
    } catch (error) {
      console.warn("🔐 [SecurityContext] Failed to extend session:", error);
    }
  }, []);

  const enableSecurity = useCallback(async () => {
    try {
      console.log("🔐 [SecurityContext] Enabling security with enhanced API");

      if (!isLoggedIn) {
        console.log("🔐 [SecurityContext] ❌ User not logged in, cannot enable security");
        return;
      }

      // Use enhanced API to enable app lock across all devices
      const result = await enhancedSecurityAPI.enableAppLock();

      if (result.success) {
        console.log("🔐 [SecurityContext] ✅ App lock enabled across devices");

        // Update local state
        setIsSecurityEnabled(true);
        setNeedsPinSetup(result.needsPinSetup);
        setIsLocked(false); // Don't lock until PIN is set up

        // Sync preferences to get latest state
        await syncSecurityPreferences();

        // Update backward compatibility storage
        await AsyncStorage.setItem(SECURITY_ENABLED_KEY, "true");
        await AsyncStorage.setItem(APP_LOCKED_KEY, "false");

        console.log("🔐 [SecurityContext] Security enabled, PIN setup needed:", result.needsPinSetup);
      } else {
        console.log("🔐 [SecurityContext] ❌ Failed to enable app lock");
        throw new Error("Failed to enable app lock");
      }
    } catch (error) {
      console.error("🔐 [SecurityContext] ❌ Error enabling security:", error);
      // Fallback to local state changes
      setIsSecurityEnabled(true);
      setIsLocked(false);
      setNeedsPinSetup(true);
    }
  }, [isLoggedIn, syncSecurityPreferences]);

  const disableSecurity = useCallback(async () => {
    try {
      console.log("🔐 [SecurityContext] Disabling security using enhanced API");

      // Unlock the app immediately when disabling security
      setIsLocked(false);

      if (!isLoggedIn) {
        console.log("🔐 [SecurityContext] User not logged in, clearing local security data only");
        await AsyncStorage.multiRemove([
          SECURITY_ENABLED_KEY,
          APP_LOCKED_KEY,
          "@expenzez_app_password",
          "@expenzez_biometric_enabled",
          "@expenzez_last_unlock",
          "@expenzez_encrypted_pin",
        ]);
        setIsSecurityEnabled(false);
        setSecurityPreferences(null);
        return;
      }

      // Use enhanced API to disable app lock across all devices (but keep device PINs)
      const success = await enhancedSecurityAPI.disableAppLock();

      if (success) {
        console.log("🔐 [SecurityContext] ✅ App lock disabled across all devices");

        // Update local state
        setIsSecurityEnabled(false);
        setNeedsPinSetup(false);

        // Sync preferences to get latest state
        await syncSecurityPreferences();

        // Update backward compatibility storage
        await AsyncStorage.setItem(SECURITY_ENABLED_KEY, "false");
        await AsyncStorage.setItem(APP_LOCKED_KEY, "false");

        console.log("🔐 [SecurityContext] ✅ Security completely disabled across devices");
      } else {
        console.log("🔐 [SecurityContext] ⚠️ Enhanced API disable failed, but this should not happen with new fallback logic");
        // The enhanced API should now handle fallbacks internally, so this shouldn't happen
        // But if it does, we'll fall through to the catch block for manual cleanup
        throw new Error("Enhanced API failed unexpectedly");
      }
    } catch (error) {
      console.error("🔐 [SecurityContext] ❌ Error disabling security:", error);

      // Fallback: Clear local data and update state
      await AsyncStorage.multiRemove([
        SECURITY_ENABLED_KEY,
        APP_LOCKED_KEY,
        "@expenzez_app_password",
        "@expenzez_biometric_enabled",
        "@expenzez_last_unlock",
        "@expenzez_encrypted_pin",
        "@expenzez_app_lock_preference", // Clear the app lock preference too
      ]);

      setIsSecurityEnabled(false);
      setIsLocked(false);
      setNeedsPinSetup(false);
      setSecurityPreferences({
        appLockEnabled: false,
        biometricEnabled: false,
        sessionTimeout: 5 * 60 * 1000,
        maxAttempts: 5,
        lastUpdated: Date.now(),
      });
    }

    // Force a security status re-check to ensure UI updates (debounced)
    setTimeout(async () => {
      console.log("🔐 [SecurityContext] Re-checking security status after disable...");
      await checkSecurityStatus();
    }, 100);
  }, [isLoggedIn, syncSecurityPreferences, checkSecurityStatus]);

  const value: SecurityContextType = {
    isLocked,
    isSecurityEnabled,
    needsPinSetup,
    isInitialized,
    securityPreferences,
    lockApp,
    unlockApp,
    extendSession,
    enableSecurity,
    disableSecurity,
    checkSecurityStatus,
    syncSecurityPreferences,
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
