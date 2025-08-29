// app/auth/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../../services/api";
import { CURRENT_API_CONFIG } from "../../config/api";

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
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithApple: (
    identityToken: string,
    authorizationCode: string,
    user?: string,
    email?: string | null,
    fullName?: { givenName?: string | null; familyName?: string | null } | null
  ) => Promise<{ success: boolean; error?: string; needsProfileCompletion?: boolean; user?: any }>;
  autoLoginAfterVerification: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    input: RegisterInput
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearAllData: () => Promise<void>;
  loading: boolean;
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
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userBudget, setUserBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadedAuthState, setHasLoadedAuthState] = useState(false);

  // Removed aggressive token validation - let API interceptors handle token refresh

  const loadAuthState = async () => {
      console.log('🔄 [AuthContext] Starting auth state loading...');
      
      // Add overall timeout for the entire auth loading process
      const authTimeout = setTimeout(() => {
        console.log('⏰ [AuthContext] Auth loading timeout reached (5s), setting loading to false');
        setLoading(false);
      }, 5000); // Reduced to 5 second timeout for better UX

      // Uncomment the next line to force clear all data on app start (for testing)
      // TEMPORARY: Clear auth data if stuck on login screen
      // await clearAllData(); // DISABLED: Auth data clearing - issue resolved
      
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

        const [
          storedLogin,
          storedUser,
          accessToken,
          idToken,
          refreshToken,
          storedBudget,
        ] = await Promise.race([storagePromise, storageTimeout]);

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
        }

        if (storedBudget) {
          setUserBudget(parseFloat(storedBudget));
        }
      } catch (error) {
        console.log('❌ [AuthContext] Error during auth state loading:', error);
        // Clear any potentially corrupted data
        try {
          await AsyncStorage.multiRemove(['isLoggedIn', 'user', 'accessToken', 'idToken', 'refreshToken']);
        } catch (clearError) {
          console.log('❌ [AuthContext] Error clearing corrupted data:', clearError);
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

  const login = async (identifier: string, password: string) => {
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
    fullName?: { givenName?: string | null; familyName?: string | null } | null
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

  const autoLoginAfterVerification = async (email: string, password: string) => {
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
        await AsyncStorage.multiRemove(allKeys);
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
      // Get all keys first
      const keys = await AsyncStorage.getAllKeys();

      // Remove all keys
      await AsyncStorage.multiRemove(keys);

      // Update state
      setIsLoggedIn(false);
      setUser(null);
      setUserBudget(null);

    } catch (error) {
      // Silent error handling
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
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Default export to fix the warning
export default AuthProvider;
