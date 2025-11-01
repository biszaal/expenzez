// app/auth/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import { authAPI } from "../../services/api";
import { CURRENT_API_CONFIG } from "../../config/api";
import { deviceManager } from "../../services/deviceManager";
import { securityAPI } from "../../services/api/securityAPI";
import { sessionManager } from "../../services/sessionManager";
import { deviceAPI } from "../../services/api/deviceAPI";
import { useRevenueCat } from "../../contexts/RevenueCatContext";

interface User {
  id: string;
  name?: string;
  username?: string;
  email: string;
  address?: string;
  birthdate?: string;
  createdAt?: string | number | Date;
  sub?: string;
  given_name?: string;
  family_name?: string;
  firstName?: string;
  lastName?: string;
  phone_number?: string;
  phone?: string;
  occupation?: string;
  company?: string;
}

interface RegisterInput {
  username: string;
  name: string;
  given_name: string;
  family_name: string;
  email: string;
  password: string;
  phone_number: string;
  birthdate: string;
  address: string;
  gender: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  userBudget: number | null;
  needsPinSetup: boolean;
  login: (
    identifier: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{
    success: boolean;
    error?: string;
    needsPinSetup?: boolean;
    needsEmailVerification?: boolean;
    email?: string;
    username?: string;
  }>;
  loginWithApple: (
    identityToken: string,
    authorizationCode: string,
    user?: string,
    email?: string | null,
    fullName?: { givenName?: string | null; familyName?: string | null } | null,
    rememberMe?: boolean
  ) => Promise<{
    success: boolean;
    error?: string;
    needsProfileCompletion?: boolean;
    user?: any;
  }>;
  autoLoginAfterVerification: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string; needsPinSetup?: boolean }>;
  register: (
    input: RegisterInput
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearAllData: () => Promise<void>;
  clearCorruptedCache: () => Promise<void>;
  clearNeedsPinSetup: () => void;
  loading: boolean;
  isDeviceTrusted: boolean;
  setRememberMe: (rememberMe: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  userBudget: null,
  needsPinSetup: false,
  login: async () => ({ success: false }),
  loginWithApple: async () => ({ success: false }),
  autoLoginAfterVerification: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  clearAllData: async () => {},
  clearCorruptedCache: async () => {},
  clearNeedsPinSetup: () => {},
  loading: true,
  isDeviceTrusted: false,
  setRememberMe: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userBudget, setUserBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadedAuthState, setHasLoadedAuthState] = useState(false);
  const [isDeviceTrusted, setIsDeviceTrusted] = useState(false);
  const [needsPinSetup, setNeedsPinSetup] = useState(false);

  // RevenueCat integration for subscription management
  const { loginUser: revenueCatLogin, logoutUser: revenueCatLogout } = useRevenueCat();

  // Helper function to check if user has PIN in database
  const checkUserHasPin = async (): Promise<boolean> => {
    try {
      console.log("🔐 [AuthContext] Checking if user has PIN in database...");
      const deviceId = await deviceManager.getDeviceId();
      const securitySettings = await securityAPI.getSecuritySettings(deviceId);
      const hasPin = !!securitySettings && !!securitySettings.encryptedPin;
      console.log("🔐 [AuthContext] PIN check result:", { hasPin });
      return hasPin;
    } catch (error) {
      console.log("🔐 [AuthContext] PIN check failed, assuming no PIN:", error);
      return false;
    }
  };

  // Initialize device trust state
  const initializeDeviceState = async () => {
    try {
      const trusted = await deviceManager.isDeviceTrusted();
      setIsDeviceTrusted(trusted);
      console.log("[AuthContext] Device trust state:", trusted);
    } catch (error) {
      console.error("[AuthContext] Error checking device trust:", error);
    }
  };

  // Set remember me preference
  const setRememberMe = async (rememberMe: boolean) => {
    try {
      if (rememberMe && user) {
        // Create persistent session for current user
        const refreshToken = await SecureStore.getItemAsync("refreshToken", {
          keychainService: "expenzez-tokens",
        });
        if (refreshToken && user.username) {
          await deviceManager.createPersistentSession(
            user.username,
            refreshToken,
            rememberMe
          );
          await deviceManager.trustDevice(rememberMe);
          setIsDeviceTrusted(true);
        }
      } else {
        // Clear persistent session
        await deviceManager.untrustDevice();
        setIsDeviceTrusted(false);
      }
      console.log("[AuthContext] Remember me preference set:", rememberMe);
    } catch (error) {
      console.error("[AuthContext] Error setting remember me:", error);
    }
  };

  const loadAuthState = async () => {
    console.log("🔄 [AuthContext] Starting auth state loading...");

    // Add overall timeout for the entire auth loading process
    const authTimeout = setTimeout(() => {
      console.log(
        "⏰ [AuthContext] Auth loading timeout reached (5s), setting loading to false"
      );
      setLoading(false);
    }, 5000); // Reduced to 5 second timeout for better UX

    // Smart cache management - clear cache if it's stale or version changed
    try {
      const CACHE_VERSION = "1.0.3"; // Update this when you want to force cache clear
      const storedVersion = await AsyncStorage.getItem("app_cache_version");
      const lastClearTime = await AsyncStorage.getItem("last_cache_clear");
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;

      // Check if device is trusted to adjust cache clearing strategy
      const isTrustedDevice = await deviceManager.isDeviceTrusted();
      const persistentSession = await deviceManager.getPersistentSession();

      // Less aggressive cache clearing for trusted devices with persistent sessions
      const cacheExpiryTime =
        isTrustedDevice && persistentSession
          ? 24 * ONE_HOUR // 24 hours for trusted devices
          : 6 * ONE_HOUR; // 6 hours for non-trusted devices

      const shouldClearCache =
        storedVersion !== CACHE_VERSION || // Version changed
        !lastClearTime || // Never cleared
        now - parseInt(lastClearTime || "0") > cacheExpiryTime;

      if (shouldClearCache) {
        console.log("🧹 [AuthContext] Smart cache clearing triggered", {
          versionChanged: storedVersion !== CACHE_VERSION,
          neverCleared: !lastClearTime,
          staleCache:
            lastClearTime &&
            now - parseInt(lastClearTime || "0") > 6 * ONE_HOUR,
        });
        await clearAllData();
        await AsyncStorage.setItem("app_cache_version", CACHE_VERSION);
        await AsyncStorage.setItem("last_cache_clear", now.toString());
      } else {
        console.log("ℹ️ [AuthContext] Smart cache clearing not needed");
      }
    } catch (error) {
      console.log("❌ [AuthContext] Smart cache management failed:", error);
    }

    try {
      // Add timeout to AsyncStorage operations
      const storagePromise = Promise.all([
        AsyncStorage.getItem("isLoggedIn"),
        AsyncStorage.getItem("user"),
        SecureStore.getItemAsync("accessToken", {
          keychainService: "expenzez-tokens",
        }),
        SecureStore.getItemAsync("idToken", {
          keychainService: "expenzez-tokens",
        }),
        SecureStore.getItemAsync("refreshToken", {
          keychainService: "expenzez-tokens",
        }),
        AsyncStorage.getItem("userBudget"),
      ]);

      const storageTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("AsyncStorage timeout")), 3000);
      });

      const result = (await Promise.race([storagePromise, storageTimeout])) as [
        string | null,
        string | null,
        string | null,
        string | null,
        string | null,
        string | null,
      ];

      const [
        storedLogin,
        storedUser,
        accessToken,
        idToken,
        refreshToken,
        storedBudget,
      ] = result;

      console.log("📦 [AuthContext] Stored auth data:", {
        hasStoredLogin: storedLogin === "true",
        hasStoredUser: !!storedUser,
        hasAccessToken: !!accessToken,
        hasIdToken: !!idToken,
      });

      if (
        storedLogin === "true" &&
        storedUser &&
        accessToken &&
        idToken &&
        accessToken !== "null" &&
        idToken !== "null"
      ) {
        if (accessToken.trim() !== "" && idToken.trim() !== "") {
          // Skip aggressive token validation on startup - let API calls handle refresh

          // Always attempt optimistic login if we have stored credentials
          // Let the API interceptors handle token refresh when needed
          setIsLoggedIn(true);
          setUser(JSON.parse(storedUser));

          // Initialize secure subscription service for cross-device sync
          // Temporarily disabled until Lambda deployment completes
          try {
            // await SecureSubscriptionService.initialize();
            console.log(
              "🔒 [AuthContext] Secure subscription service initialization skipped (Lambda deployment pending)"
            );
          } catch (error) {
            console.warn(
              "🔒 [AuthContext] Failed to initialize secure subscription service:",
              error
            );
          }
        } else {
          await Promise.all([
            AsyncStorage.removeItem("isLoggedIn"),
            SecureStore.deleteItemAsync("accessToken", {
              keychainService: "expenzez-tokens",
            }).catch(() => {}),
            SecureStore.deleteItemAsync("idToken", {
              keychainService: "expenzez-tokens",
            }).catch(() => {}),
            SecureStore.deleteItemAsync("refreshToken", {
              keychainService: "expenzez-tokens",
            }).catch(() => {}),
            AsyncStorage.removeItem("user"),
          ]);
        }
      } else {
        // Check for persistent session if no stored login found
        console.log(
          "🔄 [AuthContext] No stored login found, checking for persistent session..."
        );
        const persistentSession = await deviceManager.getPersistentSession();

        if (persistentSession) {
          console.log(
            "✅ [AuthContext] Valid persistent session found, attempting automatic login"
          );

          try {
            // Restore the refresh token and try to get fresh tokens
            await SecureStore.setItemAsync(
              "refreshToken",
              persistentSession.refreshToken,
              { keychainService: "expenzez-tokens" }
            );

            // Try to refresh the token to get fresh access tokens
            const authAPI = require("../../services/api").authAPI;
            const refreshResponse = await authAPI.refreshToken(
              persistentSession.refreshToken
            );

            if (refreshResponse && refreshResponse.accessToken) {
              // Store the new tokens
              const storagePromises = [
                AsyncStorage.setItem("isLoggedIn", "true"),
                SecureStore.setItemAsync(
                  "accessToken",
                  refreshResponse.accessToken,
                  { keychainService: "expenzez-tokens" }
                ),
                SecureStore.setItemAsync(
                  "idToken",
                  refreshResponse.idToken || "",
                  { keychainService: "expenzez-tokens" }
                ),
                SecureStore.setItemAsync(
                  "refreshToken",
                  refreshResponse.refreshToken ||
                    persistentSession.refreshToken,
                  { keychainService: "expenzez-tokens" }
                ),
              ];

              if (refreshResponse.user) {
                storagePromises.push(
                  AsyncStorage.setItem(
                    "user",
                    JSON.stringify(refreshResponse.user)
                  )
                );
                setUser(refreshResponse.user);
              } else {
                // Create basic user object with username from persistent session
                const basicUser = {
                  username: persistentSession.userId,
                  email: "",
                  id: persistentSession.userId,
                };
                storagePromises.push(
                  AsyncStorage.setItem("user", JSON.stringify(basicUser))
                );
                setUser(basicUser);
              }

              await Promise.all(storagePromises);

              setIsLoggedIn(true);
              setIsDeviceTrusted(persistentSession.rememberMe);

              console.log(
                "✅ [AuthContext] Successfully restored session from persistent data"
              );
            } else {
              console.log(
                "❌ [AuthContext] Token refresh failed, clearing persistent session"
              );
              await deviceManager.clearPersistentSession();
            }
          } catch (restoreError) {
            console.log(
              "❌ [AuthContext] Error restoring from persistent session:",
              restoreError
            );
            await deviceManager.clearPersistentSession();
          }
        }
      }

      if (storedBudget) {
        setUserBudget(parseFloat(storedBudget));
      }

      // Initialize device state after loading auth
      await initializeDeviceState();

      // PIN is now optional - no mandatory setup required
      setNeedsPinSetup(false);
    } catch (error) {
      console.log("❌ [AuthContext] Error during auth state loading:", error);
      // Don't aggressively clear auth data for minor errors - let user stay logged in
      // Only clear if there's a specific corruption indicator
      if (error instanceof Error && error.message.includes("JSON")) {
        console.log(
          "🧹 [AuthContext] JSON parsing error detected, clearing corrupted user data only"
        );
        try {
          await AsyncStorage.removeItem("user"); // Only clear corrupted user data
        } catch (clearError) {
          console.log(
            "❌ [AuthContext] Error clearing corrupted user data:",
            clearError
          );
        }
      } else {
        console.log(
          "ℹ️ [AuthContext] Preserving auth tokens despite loading error"
        );
      }
    } finally {
      console.log(
        "✅ [AuthContext] Auth state loading complete, setting loading to false"
      );
      clearTimeout(authTimeout);
      setLoading(false);
      setHasLoadedAuthState(true);
    }
  };

  useEffect(() => {
    // Only load auth state on mount if we haven't loaded it yet and we're not already logged in
    if (!hasLoadedAuthState && !isLoggedIn) {
      loadAuthState();
    } else if (hasLoadedAuthState) {
    } else if (isLoggedIn) {
      setLoading(false);
    }
  }, []);

  // Listen for session expiration (when API client sets isLoggedIn to false)
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const currentStoredLogin = await AsyncStorage.getItem("isLoggedIn");

        // If storage says logged out but context says logged in, update context
        if (currentStoredLogin === "false" && isLoggedIn) {
          setIsLoggedIn(false);
          setUser(null);
          setUserBudget(null);
        }
        // If storage says logged in but context says logged out, update context
        else if (
          currentStoredLogin === "true" &&
          !isLoggedIn &&
          hasLoadedAuthState
        ) {
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            setIsLoggedIn(true);
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        // Ignore errors during auth state check
      }
    };

    // Check auth state periodically
    const interval = setInterval(checkAuthState, 1000); // Check every second

    // Also check when app becomes active
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkAuthState();
      }
    });

    return () => {
      clearInterval(interval);
      subscription?.remove();
    };
  }, [isLoggedIn, hasLoadedAuthState]);

  const login = async (
    identifier: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    try {
      setLoading(true);

      // Determine if identifier is email or username
      let loginPayload: { email?: string; username?: string; password: string };
      if (identifier.includes("@")) {
        loginPayload = { email: identifier, password };
      } else {
        loginPayload = { username: identifier, password };
      }

      const response = await authAPI.login(loginPayload);

      // Check if we have a successful response with tokens
      // Handle both direct response and nested response.data structure
      const responseData = response.data || response;
      if (responseData && responseData.idToken && responseData.accessToken) {
        // 🚨 CRITICAL: Clear old user data BEFORE storing new user data
        console.log(
          "🧹 [Login] Clearing old user data before storing new user..."
        );
        await AsyncStorage.removeItem("user");
        await AsyncStorage.removeItem("profile");

        // Store Cognito tokens and user data
        const storagePromises = [
          AsyncStorage.setItem("isLoggedIn", "true"),
          SecureStore.setItemAsync("accessToken", responseData.accessToken, {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.setItemAsync("idToken", responseData.idToken, {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.setItemAsync(
            "refreshToken",
            responseData.refreshToken || "",
            { keychainService: "expenzez-tokens" }
          ),
          AsyncStorage.setItem("user", JSON.stringify(responseData.user)),
        ];

        await Promise.all(storagePromises);

        // Small delay to ensure AsyncStorage write is complete
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 🚨 CRITICAL: Clear old state FIRST to force re-render
        console.log("🔄 [Login] Clearing old state before setting new user...");
        setUser(null);
        setIsLoggedIn(false);

        // Wait a tick to ensure state is cleared
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Update state with new user
        console.log("✅ [Login] Setting new user state:", responseData.user);
        setIsLoggedIn(true);
        setUser(responseData.user);
        setHasLoadedAuthState(true); // Mark that we've handled auth state

        // Always create persistent session for device remembering
        // Long duration (30 days) for rememberMe, shorter duration (7 days) for regular login
        console.log(
          "🔍 [AuthContext] Full login response structure:",
          JSON.stringify(responseData, null, 2)
        );
        console.log(
          "🔄 [AuthContext] Attempting to create persistent session:",
          {
            hasRefreshToken: !!responseData.refreshToken,
            hasUserId: !!responseData.user?.username,
            userId: responseData.user?.username,
            userObject: responseData.user,
            rememberMe,
          }
        );

        if (responseData.refreshToken && responseData.user?.username) {
          await deviceManager.createPersistentSession(
            responseData.user.username,
            responseData.refreshToken,
            rememberMe
          );
          if (rememberMe) {
            await deviceManager.trustDevice(true);
            setIsDeviceTrusted(true);
            console.log(
              "✅ [AuthContext] Long-term persistent session created (30 days)"
            );
          } else {
            console.log(
              "✅ [AuthContext] Short-term persistent session created (7 days)"
            );
          }

          // Register device with backend for trusted device management
          try {
            const deviceInfo = await deviceManager.getDeviceInfo();
            // Generate device fingerprint for secure identification
            const deviceFingerprint =
              await deviceManager.generateDeviceFingerprint();

            const registrationResult = await deviceAPI.registerDevice({
              deviceId: deviceInfo.deviceId,
              deviceFingerprint: deviceFingerprint,
              deviceName: deviceInfo.deviceName,
              platform: deviceInfo.platform,
              appVersion: deviceInfo.appVersion,
              rememberMe: rememberMe || false,
              userEmail:
                responseData.user.email ||
                (identifier.includes("@") ? identifier : "test@expenzez.com"), // Use user email, or identifier if it's an email, otherwise use test email
            });

            if (registrationResult.success) {
              console.log(
                "✅ [AuthContext] Device registered with backend successfully"
              );
            } else {
              console.log(
                "⚠️ [AuthContext] Device registration failed but continuing login:",
                registrationResult.message
              );
            }
          } catch (deviceRegError) {
            console.log(
              "⚠️ [AuthContext] Device registration error (non-blocking):",
              deviceRegError
            );
          }
        } else {
          console.log(
            "❌ [AuthContext] Cannot create persistent session - missing data:",
            {
              missingRefreshToken: !responseData.refreshToken,
              missingUserId: !responseData.user?.username,
            }
          );
        }

        // Initialize device state
        await initializeDeviceState();

        // Link RevenueCat subscription to this user
        // Use user.id or user.username as the unique identifier
        const revenueCatUserId = responseData.user.id || responseData.user.username || responseData.user.sub;
        if (revenueCatUserId) {
          console.log("🎫 [AuthContext] Linking RevenueCat subscription to user:", revenueCatUserId);
          await revenueCatLogin(revenueCatUserId);
        }

        // Verify tokens were stored
        const storedAccessToken = await SecureStore.getItemAsync(
          "accessToken",
          { keychainService: "expenzez-tokens" }
        );
        const storedIdToken = await SecureStore.getItemAsync("idToken", {
          keychainService: "expenzez-tokens",
        });

        return {
          success: true,
          needsPinSetup: false,
        };
      } else {
        return {
          success: false,
          error: response?.message || "Login failed. Please try again.",
        };
      }
    } catch (error: any) {
      console.log("🔍 [AuthContext] Login error details:", error);
      console.log("🔍 [AuthContext] Error structure check:", {
        message: error.message,
        "response?.data?.message": error.response?.data?.message,
        "response?.data": error.response?.data,
        errorCode: error.code,
        errorName: error.name,
      });

      // Debug: Log the error details to understand what we're receiving
      console.log("🔍 [AuthContext] Login error details:", {
        statusCode: error.statusCode,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        message: error.message,
        isEmailNotVerified: error.isEmailNotVerified,
      });

      // Check if this is an email verification error
      if (
        error.statusCode === 403 ||
        error.response?.status === 403 ||
        error.isEmailNotVerified ||
        error.response?.data?.error === "UserNotConfirmedException" ||
        error.response?.data?.message
          ?.toLowerCase()
          .includes("not confirmed") ||
        error.response?.data?.message?.toLowerCase().includes("not verified") ||
        error.message?.toLowerCase().includes("not verified")
      ) {
        console.log(
          "🔍 [AuthContext] Email verification error detected, returning special flag"
        );
        return {
          success: false,
          error:
            error.message ||
            "Email address not verified. Please check your email and verify your account.",
          needsEmailVerification: true,
          email: identifier.includes("@") ? identifier : "",
          username: !identifier.includes("@") ? identifier : "",
        };
      }

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please try again.";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const loginWithApple = async (
    identityToken: string,
    authorizationCode: string,
    user?: string,
    email?: string | null,
    fullName?: { givenName?: string | null; familyName?: string | null } | null,
    rememberMe: boolean = false
  ) => {
    try {
      setLoading(true);

      const loginPayload = {
        identityToken,
        authorizationCode,
        user,
        email,
        fullName,
      };

      // Call the Apple login API endpoint
      const response = await authAPI.loginWithApple(loginPayload);

      // Check if we have a successful response with tokens (handle both direct and nested token formats)
      const tokens = response?.tokens || response;
      if (response && tokens?.idToken && tokens?.accessToken) {
        // 🚨 CRITICAL: Clear old user data BEFORE storing new user data
        console.log(
          "🧹 [AppleLogin] Clearing old user data before storing new user..."
        );
        await AsyncStorage.removeItem("user");
        await AsyncStorage.removeItem("profile");

        // Store Cognito tokens and user data - CRITICAL: Use SecureStore for tokens like regular login
        const storagePromises = [
          AsyncStorage.setItem("isLoggedIn", "true"),
          SecureStore.setItemAsync("accessToken", tokens.accessToken, {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.setItemAsync("idToken", tokens.idToken, {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.setItemAsync("refreshToken", tokens.refreshToken || "", {
            keychainService: "expenzez-tokens",
          }),
          AsyncStorage.setItem("user", JSON.stringify(response.user)),
        ];

        await Promise.all(storagePromises);

        // Small delay to ensure AsyncStorage write is complete
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 🚨 CRITICAL: Clear old state FIRST to force re-render
        console.log(
          "🔄 [AppleLogin] Clearing old state before setting new user..."
        );
        setUser(null);
        setIsLoggedIn(false);

        // Wait a tick to ensure state is cleared
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Update state with new user
        console.log("✅ [AppleLogin] Setting new user state:", response.user);
        setIsLoggedIn(true);
        setUser(response.user);
        setHasLoadedAuthState(true);

        // Always create persistent session for device remembering
        // Long duration (30 days) for rememberMe, shorter duration (7 days) for regular login
        console.log(
          "🔄 [AuthContext] Attempting to create Apple persistent session:",
          {
            hasRefreshToken: !!tokens.refreshToken,
            hasUserId: !!response.user?.username,
            userId: response.user?.username,
            rememberMe,
          }
        );

        if (tokens.refreshToken && response.user?.username) {
          await deviceManager.createPersistentSession(
            response.user.username,
            tokens.refreshToken,
            rememberMe
          );
          if (rememberMe) {
            await deviceManager.trustDevice(true);
            setIsDeviceTrusted(true);
            console.log(
              "✅ [AuthContext] Long-term persistent session created for Apple login (30 days)"
            );
          } else {
            console.log(
              "✅ [AuthContext] Short-term persistent session created for Apple login (7 days)"
            );
          }

          // Register device with backend for trusted device management
          try {
            const deviceInfo = await deviceManager.getDeviceInfo();
            // Generate device fingerprint for secure identification
            const deviceFingerprint =
              await deviceManager.generateDeviceFingerprint();

            const registrationResult = await deviceAPI.registerDevice({
              deviceId: deviceInfo.deviceId,
              deviceFingerprint: deviceFingerprint,
              deviceName: deviceInfo.deviceName,
              platform: deviceInfo.platform,
              appVersion: deviceInfo.appVersion,
              rememberMe: rememberMe || false,
              userEmail: response.user.email || email || "test@expenzez.com", // Use user email or fallback to email parameter
            });

            if (registrationResult.success) {
              console.log(
                "✅ [AuthContext] Device registered with backend successfully (Apple login)"
              );
            } else {
              console.log(
                "⚠️ [AuthContext] Apple login device registration failed but continuing login:",
                registrationResult.message
              );
            }
          } catch (deviceRegError) {
            console.log(
              "⚠️ [AuthContext] Apple login device registration error (non-blocking):",
              deviceRegError
            );
          }
        } else {
          console.log(
            "❌ [AuthContext] Cannot create Apple persistent session - missing data:",
            {
              missingRefreshToken: !tokens.refreshToken,
              missingUserId: !response.user?.username,
            }
          );
        }

        // Initialize device state
        await initializeDeviceState();

        // Link RevenueCat subscription to this user
        const revenueCatUserId = response.user.id || response.user.username || response.user.sub;
        if (revenueCatUserId) {
          console.log("🎫 [AppleLogin] Linking RevenueCat subscription to user:", revenueCatUserId);
          await revenueCatLogin(revenueCatUserId);
        }

        // Check if profile completion is needed
        if (response.needsProfileCompletion) {
          return {
            success: true,
            needsProfileCompletion: true,
            user: response.user,
          };
        }

        return { success: true };
      } else if (response && response.needsProfileCompletion) {
        // Apple Sign-In successful but needs profile completion
        return {
          success: true,
          needsProfileCompletion: true,
          user: response.user,
        };
      } else {
        // For now, since backend is still in development, return success for UI demonstration
        return {
          success: false,
          error:
            response?.message ||
            "Apple Sign In is in development. Full authentication coming soon!",
        };
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Apple login failed. Please try again.";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const autoLoginAfterVerification = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    try {
      const loginPayload = { email, password };
      const response = await authAPI.login(loginPayload);

      // Check if we have a successful response with tokens
      // Handle both direct response and nested response.data structure
      const responseData = response.data || response;
      if (responseData && responseData.idToken && responseData.accessToken) {
        // 🚨 CRITICAL: Clear old user data BEFORE storing new user data
        console.log(
          "🧹 [AutoLogin] Clearing old user data before storing new user..."
        );
        await AsyncStorage.removeItem("user");
        await AsyncStorage.removeItem("profile");

        // Store Cognito tokens and user data
        const storagePromises = [
          AsyncStorage.setItem("isLoggedIn", "true"),
          SecureStore.setItemAsync("accessToken", responseData.accessToken, {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.setItemAsync("idToken", responseData.idToken, {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.setItemAsync(
            "refreshToken",
            responseData.refreshToken || "",
            { keychainService: "expenzez-tokens" }
          ),
          AsyncStorage.setItem("user", JSON.stringify(responseData.user)),
        ];

        await Promise.all(storagePromises);

        // 🚨 CRITICAL: Clear old state FIRST to force re-render
        console.log(
          "🔄 [AutoLogin] Clearing old state before setting new user..."
        );
        setUser(null);
        setIsLoggedIn(false);

        // Wait a tick to ensure state is cleared
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Update state with new user
        console.log(
          "✅ [AutoLogin] Setting new user state:",
          responseData.user
        );
        setIsLoggedIn(true);
        setUser(responseData.user);

        // Create persistent session if rememberMe is enabled
        if (
          rememberMe &&
          responseData.refreshToken &&
          responseData.user?.username
        ) {
          await deviceManager.createPersistentSession(
            responseData.user.username,
            responseData.refreshToken,
            rememberMe
          );
          await deviceManager.trustDevice(rememberMe);
          setIsDeviceTrusted(true);
          console.log(
            "✅ [AuthContext] Persistent session created for auto login"
          );
        }

        // Initialize device state
        await initializeDeviceState();

        return {
          success: true,
          needsPinSetup: false,
        };
      } else {
        return {
          success: false,
          error:
            response?.message ||
            "Auto-login failed. Please try logging in manually.",
        };
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Auto-login failed. Please try logging in manually.";
      return { success: false, error: errorMessage };
    }
  };

  const register = async (input: RegisterInput) => {
    try {
      setLoading(true);
      const response = await authAPI.register(input);
      // Check for successful registration response
      if (
        response &&
        (response.cognitoUserSub ||
          response.message === "User registered successfully!")
      ) {
        return { success: true, password: input.password }; // Return password for auto-login
      } else {
        return {
          success: false,
          error: response?.message || "Registration failed. Please try again.",
        };
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log(
        "🚨 SECURITY: Starting STRICT logout - clearing ALL user data..."
      );

      // Clear persistent session and device trust
      await deviceManager.clearPersistentSession();
      await deviceManager.untrustDevice();
      setIsDeviceTrusted(false);

      // Logout from RevenueCat to clear subscription data
      console.log("🎫 [AuthContext] Logging out from RevenueCat...");
      await revenueCatLogout();

      // Clear secure subscription cache
      // Temporarily disabled until Lambda deployment completes
      try {
        // await SecureSubscriptionService.clearCache();
        console.log(
          "🔒 [AuthContext] Secure subscription cache clearing skipped (Lambda deployment pending)"
        );
      } catch (error) {
        console.warn(
          "🔒 [AuthContext] Failed to clear secure subscription cache:",
          error
        );
      }

      // 🚨 CRITICAL: Clear ALL SecureStore data
      try {
        console.log("🔐 [AuthContext] Clearing SecureStore data...");
        await Promise.all([
          SecureStore.deleteItemAsync("accessToken", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("idToken", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("refreshToken", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("tokenExpiresAt", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("user", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("profile", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("biometric_enabled", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("pin_hash", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("security_settings", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("notification_token", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("banking_connections", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("chat_history", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("budget_data", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("spending_data", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("credit_score", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("financial_insights", {
            keychainService: "expenzez-tokens",
          }),
          SecureStore.deleteItemAsync("app_preferences", {
            keychainService: "expenzez-tokens",
          }),
        ]);
        console.log("✅ [AuthContext] SecureStore data cleared successfully");
      } catch (secureStoreError) {
        console.error(
          "❌ [AuthContext] Failed to clear SecureStore data:",
          secureStoreError
        );
      }

      // 🚨 STRICT SECURITY: Clear ALL keys except absolute essentials
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        console.log("📋 Found storage keys:", allKeys.length);

        // Only preserve essential device identification keys
        const essentialKeysToKeep = ["device_id", "deviceId", "installationId"];

        const keysToRemove = allKeys.filter(
          (key) => !essentialKeysToKeep.includes(key)
        );

        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
          console.log(
            "🚨 SECURITY: Removed",
            keysToRemove.length,
            "storage keys"
          );
          console.log(
            "🔐 Preserved essential keys:",
            essentialKeysToKeep.filter((key) => allKeys.includes(key))
          );
        }

        // Explicitly remove all known sensitive keys to ensure complete cleanup
        const explicitSensitiveKeys = [
          "isLoggedIn",
          "accessToken",
          "idToken",
          "refreshToken",
          "user",
          "accounts",
          "transactions",
          "profile",
          "userBudget",
          "trusted_devices",
          "device_registrations",
          "persistent_session",
          "remember_me",
          "biometric_enabled",
          "pin_hash",
          "security_settings",
          "notification_token",
          "notification_preferences",
          "banking_connections",
          "banking_data",
          "chat_history",
          "ai_conversations",
          "budget_data",
          "spending_data",
          "credit_score",
          "financial_insights",
          "cached_api_data",
          "app_preferences",
          "theme_preference",
          "onboarding_completed",
          "tutorial_completed",
          "feature_flags",
          "analytics_data",
          "crash_reports",
          "performance_logs",
        ];

        await AsyncStorage.multiRemove(explicitSensitiveKeys);
        console.log("🚨 SECURITY: Explicitly cleared all sensitive data keys");
      } catch (storageError) {
        console.error("❌ Storage cleanup error:", storageError);
      }

      // Force clear any in-memory caches
      try {
        if ((global as any).__USER_CACHE__) {
          (global as any).__USER_CACHE__ = null;
        }
        if ((global as any).__API_CACHE__) {
          (global as any).__API_CACHE__ = null;
        }
        if ((global as any).__BANKING_CACHE__) {
          (global as any).__BANKING_CACHE__ = null;
        }
        console.log("🧹 Cleared in-memory caches");
      } catch (cacheError) {
        console.warn("⚠️ Cache clear warning:", cacheError);
      }

      // Clear API cache to ensure no data leaks between users
      try {
        const { clearAllCache } = await import(
          "../../services/config/apiCache"
        );
        await clearAllCache();
        console.log("🧹 Cleared API cache");
      } catch (cacheError) {
        console.warn("⚠️ API cache clear warning:", cacheError);
      }

      // Update state - clear everything
      setIsLoggedIn(false);
      setUser(null);
      setUserBudget(null);
      setNeedsPinSetup(false);

      console.log("✅ STRICT LOGOUT COMPLETED - ALL user data cleared");
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  // Function to clear the PIN setup requirement (called after PIN is set up)
  const clearNeedsPinSetup = () => {
    console.log("🔐 [AuthContext] Clearing PIN setup requirement");
    setNeedsPinSetup(false);
  };

  // Function to manually clear all stored data (for testing)
  const clearAllData = async () => {
    try {
      console.log(
        "🧹 [AuthContext] Clearing cached data (preserving auth tokens)..."
      );

      // Get all keys first
      const keys = await AsyncStorage.getAllKeys();
      console.log("🔍 [AuthContext] Found", keys.length, "cached keys");

      // Preserve authentication and essential data
      const authKeys = [
        "accessToken",
        "idToken",
        "refreshToken",
        "isLoggedIn",
        "user",
        "userBudget",
        "app_cache_version",
        "last_cache_clear",
        // Device manager keys for persistent sessions
        "device_id",
        "persistent_session",
        "trusted_devices",
        "remember_me",
      ];

      // Remove only cache keys, not auth keys
      const cacheKeysToRemove = keys.filter(
        (key) =>
          !authKeys.includes(key) &&
          (key.startsWith("@expenzez_cache_") || key.includes("cache"))
      );

      if (cacheKeysToRemove.length > 0) {
        await AsyncStorage.multiRemove(cacheKeysToRemove);
        console.log(
          `✅ [AuthContext] Cleared ${cacheKeysToRemove.length} cache keys, preserved ${authKeys.length} auth keys`
        );
      } else {
        console.log("ℹ️ [AuthContext] No cache keys to clear");
      }

      // Don't update auth state here - let loadAuthState handle it
    } catch (error) {
      console.log("❌ [AuthContext] Error clearing cached data:", error);
    }
  };

  // Function to clear only problematic cache entries
  const clearCorruptedCache = async () => {
    try {
      console.log(
        "🔧 [AuthContext] Clearing potentially corrupted cache entries..."
      );

      const keys = await AsyncStorage.getAllKeys();

      const problematicKeys = keys.filter(
        (key) =>
          key.startsWith("@expenzez_cache_") || // Network cache
          key.includes("transactions") ||
          key.includes("spending") ||
          key.startsWith("requisition_") || // Remove all banking requisition data
          key.includes("nordigen") ||
          key.includes("gocardless") ||
          key.includes("truelayer") ||
          key.includes("plaid")
      );

      if (problematicKeys.length > 0) {
        await AsyncStorage.multiRemove(problematicKeys);
        console.log(
          "✅ [AuthContext] Cleared",
          problematicKeys.length,
          "potentially corrupted cache entries"
        );
      }
    } catch (error) {
      console.log("❌ [AuthContext] Error clearing corrupted cache:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        userBudget,
        needsPinSetup,
        login,
        loginWithApple,
        autoLoginAfterVerification,
        register,
        logout,
        clearAllData,
        clearCorruptedCache,
        clearNeedsPinSetup,
        loading,
        isDeviceTrusted,
        setRememberMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Default export to fix the warning
export default AuthProvider;
