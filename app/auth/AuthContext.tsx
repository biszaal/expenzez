// app/auth/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import { authAPI } from "../../services/api";
import { CURRENT_API_CONFIG } from "../../config/api";
import { deviceManager } from "../../services/deviceManager";

interface User {
  id: string;
  name?: string;
  username?: string;
  email: string;
  address?: string;
  birthdate?: string;
  createdAt?: string | number | Date;
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
  login: (
    identifier: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithApple: (
    identityToken: string,
    authorizationCode: string,
    user?: string,
    email?: string | null,
    fullName?: { givenName?: string | null; familyName?: string | null } | null,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string; needsProfileCompletion?: boolean; user?: any }>;
  autoLoginAfterVerification: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    input: RegisterInput
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearAllData: () => Promise<void>;
  clearCorruptedCache: () => Promise<void>;
  loading: boolean;
  isDeviceTrusted: boolean;
  setRememberMe: (rememberMe: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  userBudget: null,
  login: async () => ({ success: false }),
  loginWithApple: async () => ({ success: false }),
  autoLoginAfterVerification: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  clearAllData: async () => {},
  clearCorruptedCache: async () => {},
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

  // Initialize device trust state
  const initializeDeviceState = async () => {
    try {
      const trusted = await deviceManager.isDeviceTrusted();
      setIsDeviceTrusted(trusted);
      console.log('[AuthContext] Device trust state:', trusted);
    } catch (error) {
      console.error('[AuthContext] Error checking device trust:', error);
    }
  };

  // Set remember me preference
  const setRememberMe = async (rememberMe: boolean) => {
    try {
      if (rememberMe && user) {
        // Create persistent session for current user
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken && user.username) {
          await deviceManager.createPersistentSession(user.username, refreshToken, rememberMe);
          await deviceManager.trustDevice(rememberMe);
          setIsDeviceTrusted(true);
        }
      } else {
        // Clear persistent session
        await deviceManager.untrustDevice();
        setIsDeviceTrusted(false);
      }
      console.log('[AuthContext] Remember me preference set:', rememberMe);
    } catch (error) {
      console.error('[AuthContext] Error setting remember me:', error);
    }
  };

  const loadAuthState = async () => {
      console.log('🔄 [AuthContext] Starting auth state loading...');
      
      // Add overall timeout for the entire auth loading process
      const authTimeout = setTimeout(() => {
        console.log('⏰ [AuthContext] Auth loading timeout reached (5s), setting loading to false');
        setLoading(false);
      }, 5000); // Reduced to 5 second timeout for better UX

      // Smart cache management - clear cache if it's stale or version changed
      try {
        const CACHE_VERSION = '1.0.3'; // Update this when you want to force cache clear
        const storedVersion = await AsyncStorage.getItem('app_cache_version');
        const lastClearTime = await AsyncStorage.getItem('last_cache_clear');
        const now = Date.now();
        const ONE_HOUR = 60 * 60 * 1000;
        
        // Check if device is trusted to adjust cache clearing strategy
        const isTrustedDevice = await deviceManager.isDeviceTrusted();
        const persistentSession = await deviceManager.getPersistentSession();
        
        // Less aggressive cache clearing for trusted devices with persistent sessions
        const cacheExpiryTime = (isTrustedDevice && persistentSession) ? 
          (24 * ONE_HOUR) : // 24 hours for trusted devices
          (6 * ONE_HOUR); // 6 hours for non-trusted devices
        
        const shouldClearCache = (
          storedVersion !== CACHE_VERSION || // Version changed
          !lastClearTime || // Never cleared
          (now - parseInt(lastClearTime || '0')) > cacheExpiryTime
        );
        
        if (shouldClearCache) {
          console.log('🧹 [AuthContext] Smart cache clearing triggered', {
            versionChanged: storedVersion !== CACHE_VERSION,
            neverCleared: !lastClearTime,
            staleCache: lastClearTime && (now - parseInt(lastClearTime || '0')) > (6 * ONE_HOUR)
          });
          await clearAllData();
          await AsyncStorage.setItem('app_cache_version', CACHE_VERSION);
          await AsyncStorage.setItem('last_cache_clear', now.toString());
        } else {
          console.log('ℹ️ [AuthContext] Smart cache clearing not needed');
        }
      } catch (error) {
        console.log('❌ [AuthContext] Smart cache management failed:', error);
      }
      
      try {
        // Add timeout to AsyncStorage operations
        const storagePromise = Promise.all([
          AsyncStorage.getItem("isLoggedIn"),
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("accessToken"),
          AsyncStorage.getItem("idToken"),
          AsyncStorage.getItem("refreshToken"),
          AsyncStorage.getItem("userBudget"),
        ]);

        const storageTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AsyncStorage timeout')), 3000);
        });

        const result = await Promise.race([storagePromise, storageTimeout]) as [
          string | null,
          string | null,
          string | null,
          string | null,
          string | null,
          string | null
        ];
        
        const [
          storedLogin,
          storedUser,
          accessToken,
          idToken,
          refreshToken,
          storedBudget,
        ] = result;

        console.log('📦 [AuthContext] Stored auth data:', { 
          hasStoredLogin: storedLogin === "true",
          hasStoredUser: !!storedUser,
          hasAccessToken: !!accessToken,
          hasIdToken: !!idToken 
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
          } else {
            await Promise.all([
              AsyncStorage.removeItem("isLoggedIn"),
              AsyncStorage.removeItem("accessToken"),
              AsyncStorage.removeItem("idToken"),
              AsyncStorage.removeItem("refreshToken"),
              AsyncStorage.removeItem("user"),
            ]);
          }
        } else {
          // Check for persistent session if no stored login found
          console.log('🔄 [AuthContext] No stored login found, checking for persistent session...');
          const persistentSession = await deviceManager.getPersistentSession();
          
          if (persistentSession) {
            console.log('✅ [AuthContext] Valid persistent session found, attempting automatic login');
            
            try {
              // Restore the refresh token and try to get fresh tokens
              await AsyncStorage.setItem('refreshToken', persistentSession.refreshToken);
              
              // Try to refresh the token to get fresh access tokens
              const authAPI = require('../../services/api').authAPI;
              const refreshResponse = await authAPI.refreshToken(persistentSession.refreshToken);
              
              if (refreshResponse && refreshResponse.accessToken) {
                // Store the new tokens
                const storagePromises = [
                  AsyncStorage.setItem("isLoggedIn", "true"),
                  AsyncStorage.setItem("accessToken", refreshResponse.accessToken),
                  AsyncStorage.setItem("idToken", refreshResponse.idToken || ""),
                  AsyncStorage.setItem("refreshToken", refreshResponse.refreshToken || persistentSession.refreshToken)
                ];
                
                if (refreshResponse.user) {
                  storagePromises.push(AsyncStorage.setItem("user", JSON.stringify(refreshResponse.user)));
                  setUser(refreshResponse.user);
                } else {
                  // Create basic user object with username from persistent session
                  const basicUser = { username: persistentSession.userId, email: '', id: persistentSession.userId };
                  storagePromises.push(AsyncStorage.setItem("user", JSON.stringify(basicUser)));
                  setUser(basicUser);
                }
                
                await Promise.all(storagePromises);
                
                setIsLoggedIn(true);
                setIsDeviceTrusted(persistentSession.rememberMe);
                
                console.log('✅ [AuthContext] Successfully restored session from persistent data');
              } else {
                console.log('❌ [AuthContext] Token refresh failed, clearing persistent session');
                await deviceManager.clearPersistentSession();
              }
            } catch (restoreError) {
              console.log('❌ [AuthContext] Error restoring from persistent session:', restoreError);
              await deviceManager.clearPersistentSession();
            }
          }
        }

        if (storedBudget) {
          setUserBudget(parseFloat(storedBudget));
        }

        // Initialize device state after loading auth
        await initializeDeviceState();

      } catch (error) {
        console.log('❌ [AuthContext] Error during auth state loading:', error);
        // Don't aggressively clear auth data for minor errors - let user stay logged in
        // Only clear if there's a specific corruption indicator
        if (error instanceof Error && error.message.includes('JSON')) {
          console.log('🧹 [AuthContext] JSON parsing error detected, clearing corrupted user data only');
          try {
            await AsyncStorage.removeItem('user'); // Only clear corrupted user data
          } catch (clearError) {
            console.log('❌ [AuthContext] Error clearing corrupted user data:', clearError);
          }
        } else {
          console.log('ℹ️ [AuthContext] Preserving auth tokens despite loading error');
        }
      } finally {
        console.log('✅ [AuthContext] Auth state loading complete, setting loading to false');
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
        const currentStoredLogin = await AsyncStorage.getItem('isLoggedIn');
        
        // If storage says logged out but context says logged in, update context
        if (currentStoredLogin === 'false' && isLoggedIn) {
          setIsLoggedIn(false);
          setUser(null);
          setUserBudget(null);
        }
        // If storage says logged in but context says logged out, update context
        else if (currentStoredLogin === 'true' && !isLoggedIn && hasLoadedAuthState) {
          const storedUser = await AsyncStorage.getItem('user');
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
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAuthState();
      }
    });

    return () => {
      clearInterval(interval);
      subscription?.remove();
    };
  }, [isLoggedIn, hasLoadedAuthState]);

  const login = async (identifier: string, password: string, rememberMe: boolean = false) => {
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
      if (response && response.idToken && response.accessToken) {

        // Store Cognito tokens and user data
        const storagePromises = [
          AsyncStorage.setItem("isLoggedIn", "true"),
          AsyncStorage.setItem("accessToken", response.accessToken),
          AsyncStorage.setItem("idToken", response.idToken),
          AsyncStorage.setItem("refreshToken", response.refreshToken || ""),
          AsyncStorage.setItem("user", JSON.stringify(response.user)),
        ];

        await Promise.all(storagePromises);

        // Small delay to ensure AsyncStorage write is complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Update state
        setIsLoggedIn(true);
        setUser(response.user);
        setHasLoadedAuthState(true); // Mark that we've handled auth state

        // Always create persistent session for device remembering
        // Long duration (30 days) for rememberMe, shorter duration (7 days) for regular login
        console.log('🔍 [AuthContext] Full login response structure:', JSON.stringify(response, null, 2));
        console.log('🔄 [AuthContext] Attempting to create persistent session:', {
          hasRefreshToken: !!response.refreshToken,
          hasUserId: !!response.user?.username,
          userId: response.user?.username,
          userObject: response.user,
          rememberMe
        });
        
        if (response.refreshToken && response.user?.username) {
          await deviceManager.createPersistentSession(response.user.username, response.refreshToken, rememberMe);
          if (rememberMe) {
            await deviceManager.trustDevice(true);
            setIsDeviceTrusted(true);
            console.log('✅ [AuthContext] Long-term persistent session created (30 days)');
          } else {
            console.log('✅ [AuthContext] Short-term persistent session created (7 days)');
          }
        } else {
          console.log('❌ [AuthContext] Cannot create persistent session - missing data:', {
            missingRefreshToken: !response.refreshToken,
            missingUserId: !response.user?.username
          });
        }

        // Initialize device state
        await initializeDeviceState();

        // Verify tokens were stored
        const storedAccessToken = await AsyncStorage.getItem("accessToken");
        const storedIdToken = await AsyncStorage.getItem("idToken");

        return { success: true };
      } else {
        return {
          success: false,
          error: response?.message || "Login failed. Please try again.",
        };
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
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

        // Store Cognito tokens and user data
        const storagePromises = [
          AsyncStorage.setItem("isLoggedIn", "true"),
          AsyncStorage.setItem("accessToken", tokens.accessToken),
          AsyncStorage.setItem("idToken", tokens.idToken),
          AsyncStorage.setItem("refreshToken", tokens.refreshToken || ""),
          AsyncStorage.setItem("user", JSON.stringify(response.user)),
        ];

        await Promise.all(storagePromises);

        // Small delay to ensure AsyncStorage write is complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Update state
        setIsLoggedIn(true);
        setUser(response.user);
        setHasLoadedAuthState(true);

        // Always create persistent session for device remembering  
        // Long duration (30 days) for rememberMe, shorter duration (7 days) for regular login
        console.log('🔄 [AuthContext] Attempting to create Apple persistent session:', {
          hasRefreshToken: !!tokens.refreshToken,
          hasUserId: !!response.user?.username,
          userId: response.user?.username,
          rememberMe
        });
        
        if (tokens.refreshToken && response.user?.username) {
          await deviceManager.createPersistentSession(response.user.username, tokens.refreshToken, rememberMe);
          if (rememberMe) {
            await deviceManager.trustDevice(true);
            setIsDeviceTrusted(true);
            console.log('✅ [AuthContext] Long-term persistent session created for Apple login (30 days)');
          } else {
            console.log('✅ [AuthContext] Short-term persistent session created for Apple login (7 days)');
          }
        } else {
          console.log('❌ [AuthContext] Cannot create Apple persistent session - missing data:', {
            missingRefreshToken: !tokens.refreshToken,
            missingUserId: !response.user?.username
          });
        }

        // Initialize device state
        await initializeDeviceState();
        
        // Check if profile completion is needed
        if (response.needsProfileCompletion) {
          return { success: true, needsProfileCompletion: true, user: response.user };
        }
        
        return { success: true };
      } else if (response && response.needsProfileCompletion) {
        // Apple Sign-In successful but needs profile completion
        return { 
          success: true, 
          needsProfileCompletion: true,
          user: response.user 
        };
      } else {
        // For now, since backend is still in development, return success for UI demonstration
        return {
          success: false,
          error: response?.message || "Apple Sign In is in development. Full authentication coming soon!"
        };
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Apple login failed. Please try again.";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const autoLoginAfterVerification = async (email: string, password: string, rememberMe: boolean = false) => {
    try {

      const loginPayload = { email, password };
      const response = await authAPI.login(loginPayload);
      

      // Check if we have a successful response with tokens
      if (response && response.idToken && response.accessToken) {

        // Store Cognito tokens and user data
        const storagePromises = [
          AsyncStorage.setItem("isLoggedIn", "true"),
          AsyncStorage.setItem("accessToken", response.accessToken),
          AsyncStorage.setItem("idToken", response.idToken),
          AsyncStorage.setItem("refreshToken", response.refreshToken || ""),
          AsyncStorage.setItem("user", JSON.stringify(response.user)),
        ];

        await Promise.all(storagePromises);

        // Update state
        setIsLoggedIn(true);
        setUser(response.user);

        // Create persistent session if rememberMe is enabled
        if (rememberMe && response.refreshToken && response.user?.username) {
          await deviceManager.createPersistentSession(response.user.username, response.refreshToken, rememberMe);
          await deviceManager.trustDevice(rememberMe);
          setIsDeviceTrusted(true);
          console.log('✅ [AuthContext] Persistent session created for auto login');
        }

        // Initialize device state
        await initializeDeviceState();

        return { success: true };
      } else {
        return {
          success: false,
          error: response?.message || "Auto-login failed. Please try logging in manually.",
        };
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Auto-login failed. Please try logging in manually.";
      return { success: false, error: errorMessage };
    }
  };

  const register = async (input: RegisterInput) => {
    try {
      setLoading(true);
      const response = await authAPI.register(input);
      // Check for successful registration response
      if (response && (response.cognitoUserSub || response.message === "User registered successfully!")) {
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
      // Clear persistent session and device trust
      await deviceManager.clearPersistentSession();
      await deviceManager.untrustDevice();
      setIsDeviceTrusted(false);

      // Clear all auth and user-specific data
      const itemsToRemove = [
        "isLoggedIn",
        "accessToken",
        "idToken",
        "refreshToken",
        "user",
        "accounts",
        "transactions",
        "profile",
        "userBudget",
        // Add any other keys you use for caching user data here
      ];


      // Remove each item individually
      for (const key of itemsToRemove) {
        try {
          await AsyncStorage.removeItem(key);
        } catch (error) {
          // Silent error handling
        }
      }

      // Also try to remove all keys to be extra sure
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        // Keep device-related keys for future logins
        const keysToKeep = ['device_id', 'trusted_devices', 'device_registrations', 'persistent_session', 'remember_me'];
        const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));
        await AsyncStorage.multiRemove(keysToRemove);
      } catch (error) {
        // Silent error handling
      }

      // Update state
      setIsLoggedIn(false);
      setUser(null);
      setUserBudget(null);

    } catch (error) {
      // Silent error handling
    }
  };

  // Function to manually clear all stored data (for testing)
  const clearAllData = async () => {
    try {
      console.log('🧹 [AuthContext] Clearing cached data (preserving auth tokens)...');
      
      // Get all keys first
      const keys = await AsyncStorage.getAllKeys();
      console.log('🔍 [AuthContext] Found', keys.length, 'cached keys');

      // Preserve authentication and essential data
      const authKeys = [
        'accessToken',
        'idToken', 
        'refreshToken',
        'isLoggedIn',
        'user',
        'userBudget',
        'app_cache_version',
        'last_cache_clear',
        // Device manager keys for persistent sessions
        'device_id',
        'persistent_session',
        'trusted_devices',
        'remember_me'
      ];

      // Remove only cache keys, not auth keys
      const cacheKeysToRemove = keys.filter(key => 
        !authKeys.includes(key) && 
        (key.startsWith('@expenzez_cache_') || key.includes('cache'))
      );
      
      if (cacheKeysToRemove.length > 0) {
        await AsyncStorage.multiRemove(cacheKeysToRemove);
        console.log(`✅ [AuthContext] Cleared ${cacheKeysToRemove.length} cache keys, preserved ${authKeys.length} auth keys`);
      } else {
        console.log('ℹ️ [AuthContext] No cache keys to clear');
      }

      // Don't update auth state here - let loadAuthState handle it

    } catch (error) {
      console.log('❌ [AuthContext] Error clearing cached data:', error);
    }
  };

  // Function to clear only problematic cache entries
  const clearCorruptedCache = async () => {
    try {
      console.log('🔧 [AuthContext] Clearing potentially corrupted cache entries...');
      
      const keys = await AsyncStorage.getAllKeys();
      const problematicKeys = keys.filter(key => 
        key.startsWith('@expenzez_cache_') || // Network cache
        key.includes('transactions') ||
        key.includes('banking') ||
        key.includes('spending') ||
        key.startsWith('requisition_') // Stale banking requisition data
      );
      
      if (problematicKeys.length > 0) {
        await AsyncStorage.multiRemove(problematicKeys);
        console.log('✅ [AuthContext] Cleared', problematicKeys.length, 'potentially corrupted cache entries');
      }
      
      // Also clean up any stale banking callback references
      const staleBankingKeys = keys.filter(key => key.startsWith('requisition_'));
      if (staleBankingKeys.length > 0) {
        await AsyncStorage.multiRemove(staleBankingKeys);
        console.log('🏦 [AuthContext] Cleared', staleBankingKeys.length, 'stale banking requisition references');
      }
    } catch (error) {
      console.log('❌ [AuthContext] Error clearing corrupted cache:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        userBudget,
        login,
        loginWithApple,
        autoLoginAfterVerification,
        register,
        logout,
        clearAllData,
        clearCorruptedCache,
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
