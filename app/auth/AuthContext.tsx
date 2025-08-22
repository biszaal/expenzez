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

  // Function to validate if stored tokens are still valid
  const validateStoredTokens = async (accessToken: string, idToken: string) => {
    try {
      console.log("Validating stored tokens...");

      // First check if tokens are not empty
      if (
        !accessToken ||
        !idToken ||
        accessToken.trim() === "" ||
        idToken.trim() === ""
      ) {
        console.log("Tokens are empty, validation failed");
        return false;
      }

      // Check if tokens are not "null" strings
      if (accessToken === "null" || idToken === "null") {
        console.log("Tokens are 'null' strings, validation failed");
        return false;
      }

      // Use centralized API base URL - use profile endpoint for token validation
      const profileUrl = `${CURRENT_API_CONFIG.baseURL.replace(/\/$/, "")}/profile`;
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(profileUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const isValid = response.ok;
        console.log("Token validation result:", {
          isValid,
          status: response.status,
        });
        return isValid;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.log("Token validation timed out");
        } else {
          console.log("Token validation fetch error:", fetchError);
        }
        return false;
      }
    } catch (error) {
      console.log("Token validation failed:", error);
      return false;
    }
  };

  const loadAuthState = async () => {
      // Add overall timeout for the entire auth loading process
      const authTimeout = setTimeout(() => {
        console.log("Auth loading timed out, setting loading to false");
        setLoading(false);
      }, 15000); // 15 second overall timeout

      // Uncomment the next line to force clear all data on app start (for testing)
      // TEMPORARY: Clear auth data if stuck on login screen
      // await clearAllData();
      
      console.log("[AuthContext] Starting auth state loading...");
      try {
        const [
          storedLogin,
          storedUser,
          accessToken,
          idToken,
          refreshToken,
          storedBudget,
        ] = await Promise.all([
          AsyncStorage.getItem("isLoggedIn"),
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("accessToken"),
          AsyncStorage.getItem("idToken"),
          AsyncStorage.getItem("refreshToken"),
          AsyncStorage.getItem("userBudget"),
        ]);

        console.log("[AuthContext] Loaded auth data:", {
          storedLogin,
          hasUser: !!storedUser,
          hasAccessToken: !!accessToken,
          hasIdToken: !!idToken,
          hasRefreshToken: !!refreshToken,
          accessTokenValid: accessToken !== "null" && accessToken?.trim() !== "",
          idTokenValid: idToken !== "null" && idToken?.trim() !== ""
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
            // Try to validate tokens with backend, but don't block on failure
            let tokensValid = false;
            try {
              tokensValid = await validateStoredTokens(accessToken, idToken);
            } catch (validationError) {
              console.log("Token validation failed, will attempt auto-login anyway:", validationError);
              // If validation fails due to network issues, optimistically try auto-login
              tokensValid = false;
            }
            
            if (tokensValid) {
              setIsLoggedIn(true);
              setUser(JSON.parse(storedUser));
              console.log("Auto-login successful with valid tokens");
            } else if (
              refreshToken &&
              refreshToken !== "null" &&
              refreshToken.trim() !== ""
            ) {
              // Try to refresh tokens with timeout
              try {
                console.log(
                  "Access token invalid, attempting refresh with refresh token..."
                );
                
                // Add timeout for refresh token request
                const refreshPromise = authAPI.refreshToken(refreshToken);
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Refresh timeout')), 10000)
                );
                
                const refreshResponse = await Promise.race([refreshPromise, timeoutPromise]);
                
                if (
                  refreshResponse &&
                  refreshResponse.accessToken &&
                  refreshResponse.idToken
                ) {
                  await AsyncStorage.setItem(
                    "accessToken",
                    refreshResponse.accessToken
                  );
                  await AsyncStorage.setItem(
                    "idToken",
                    refreshResponse.idToken
                  );
                  if (refreshResponse.refreshToken) {
                    await AsyncStorage.setItem(
                      "refreshToken",
                      refreshResponse.refreshToken
                    );
                  }
                  setIsLoggedIn(true);
                  setUser(JSON.parse(storedUser));
                  console.log("Auto-login successful after token refresh");
                } else {
                  console.log("Token refresh failed, logging out");
                  await Promise.all([
                    AsyncStorage.removeItem("isLoggedIn"),
                    AsyncStorage.removeItem("accessToken"),
                    AsyncStorage.removeItem("idToken"),
                    AsyncStorage.removeItem("refreshToken"),
                    AsyncStorage.removeItem("user"),
                  ]);
                }
              } catch (refreshError) {
                console.log("Token refresh error, logging out", refreshError);
                await Promise.all([
                  AsyncStorage.removeItem("isLoggedIn"),
                  AsyncStorage.removeItem("accessToken"),
                  AsyncStorage.removeItem("idToken"),
                  AsyncStorage.removeItem("refreshToken"),
                  AsyncStorage.removeItem("user"),
                ]);
              }
            } else {
              console.log(
                "Tokens may be invalid and no refresh token available, but attempting optimistic login"
              );
              // Optimistic login - let the app handle token refresh on first API call
              setIsLoggedIn(true);
              setUser(JSON.parse(storedUser));
              console.log("Optimistic auto-login attempted - app will handle token refresh if needed");
            }
          } else {
            console.log("Auto-login failed: tokens are empty");
            await Promise.all([
              AsyncStorage.removeItem("isLoggedIn"),
              AsyncStorage.removeItem("accessToken"),
              AsyncStorage.removeItem("idToken"),
              AsyncStorage.removeItem("refreshToken"),
              AsyncStorage.removeItem("user"),
            ]);
          }
        } else {
          console.log("Auto-login failed: missing required data", {
            storedLogin,
            hasUser: !!storedUser,
            hasAccessToken: !!accessToken,
            hasIdToken: !!idToken,
          });
        }

        if (storedBudget) {
          setUserBudget(parseFloat(storedBudget));
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
      } finally {
        clearTimeout(authTimeout);
        setLoading(false);
        setHasLoadedAuthState(true);
      }
    };

  useEffect(() => {
    // Only load auth state on mount if we haven't loaded it yet and we're not already logged in
    if (!hasLoadedAuthState && !isLoggedIn) {
      console.log("[AuthContext] Loading auth state on mount...");
      loadAuthState();
    } else if (hasLoadedAuthState) {
      console.log("[AuthContext] Auth state already loaded, skipping...");
    } else if (isLoggedIn) {
      console.log("[AuthContext] Already logged in, skipping auth state loading...");
      setLoading(false);
    }
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      setLoading(true);
      console.log("=== LOGIN STARTED ===");
      console.log("Login attempt for:", identifier);

      // Determine if identifier is email or username
      let loginPayload: { email?: string; username?: string; password: string };
      if (identifier.includes("@")) {
        loginPayload = { email: identifier, password };
      } else {
        loginPayload = { username: identifier, password };
      }

      const response = await authAPI.login(loginPayload);
      console.log("Login response:", {
        hasResponse: !!response,
        hasIdToken: !!response?.idToken,
        hasAccessToken: !!response?.accessToken,
        hasUser: !!response?.user,
        message: response?.message,
      });
      console.log("Full login response:", JSON.stringify(response, null, 2));

      // Check if we have a successful response with tokens
      if (response && response.idToken && response.accessToken) {
        console.log("Login successful, storing tokens...");

        // Store Cognito tokens and user data
        const storagePromises = [
          AsyncStorage.setItem("isLoggedIn", "true"),
          AsyncStorage.setItem("accessToken", response.accessToken),
          AsyncStorage.setItem("idToken", response.idToken),
          AsyncStorage.setItem("refreshToken", response.refreshToken || ""),
          AsyncStorage.setItem("user", JSON.stringify(response.user)),
        ];

        await Promise.all(storagePromises);
        console.log("Tokens stored successfully");

        // Small delay to ensure AsyncStorage write is complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Update state
        setIsLoggedIn(true);
        setUser(response.user);
        setHasLoadedAuthState(true); // Mark that we've handled auth state

        console.log("Logged in user:", response.user);
        if (response.user) {
          console.log("User address:", response.user.address);
          console.log(
            "User date of birth:",
            response.user.birthdate || response.user.dob
          );
        }

        // Verify tokens were stored
        const storedAccessToken = await AsyncStorage.getItem("accessToken");
        const storedIdToken = await AsyncStorage.getItem("idToken");
        console.log("Stored tokens verification:", {
          accessToken: storedAccessToken
            ? `${storedAccessToken.substring(0, 20)}...`
            : "null",
          idToken: storedIdToken
            ? `${storedIdToken.substring(0, 20)}...`
            : "null",
        });

        console.log("=== LOGIN COMPLETED SUCCESSFULLY ===");
        return { success: true };
      } else {
        console.log("Login failed: missing tokens", {
          hasIdToken: !!response?.idToken,
          hasAccessToken: !!response?.accessToken,
          message: response?.message,
        });
        return {
          success: false,
          error: response?.message || "Login failed. Please try again.",
        };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const autoLoginAfterVerification = async (email: string, password: string) => {
    try {
      console.log("=== AUTO-LOGIN AFTER VERIFICATION STARTED ===");
      console.log("Auto-login attempt for:", email);

      const loginPayload = { email, password };
      const response = await authAPI.login(loginPayload);
      
      console.log("Auto-login response:", {
        hasResponse: !!response,
        hasIdToken: !!response?.idToken,
        hasAccessToken: !!response?.accessToken,
        hasUser: !!response?.user,
        message: response?.message,
      });

      // Check if we have a successful response with tokens
      if (response && response.idToken && response.accessToken) {
        console.log("Auto-login successful, storing tokens...");

        // Store Cognito tokens and user data
        const storagePromises = [
          AsyncStorage.setItem("isLoggedIn", "true"),
          AsyncStorage.setItem("accessToken", response.accessToken),
          AsyncStorage.setItem("idToken", response.idToken),
          AsyncStorage.setItem("refreshToken", response.refreshToken || ""),
          AsyncStorage.setItem("user", JSON.stringify(response.user)),
        ];

        await Promise.all(storagePromises);
        console.log("Auto-login tokens stored successfully");

        // Update state
        setIsLoggedIn(true);
        setUser(response.user);

        console.log("=== AUTO-LOGIN AFTER VERIFICATION COMPLETED SUCCESSFULLY ===");
        return { success: true };
      } else {
        console.log("Auto-login failed: missing tokens");
        return {
          success: false,
          error: response?.message || "Auto-login failed. Please try logging in manually.",
        };
      }
    } catch (error: any) {
      console.error("Auto-login error:", error);
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
      console.error("Registration error:", error);
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
      console.log("=== LOGOUT STARTED ===");

      // First, let's see what's currently stored
      const keys = await AsyncStorage.getAllKeys();
      console.log("Current stored keys:", keys);

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

      console.log("Removing items:", itemsToRemove);

      // Remove each item individually and log the result
      for (const key of itemsToRemove) {
        try {
          await AsyncStorage.removeItem(key);
          console.log(`Removed: ${key}`);
        } catch (error) {
          console.log(`Failed to remove ${key}:`, error);
        }
      }

      // Also try to remove all keys to be extra sure
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        await AsyncStorage.multiRemove(allKeys);
        console.log("Removed all keys:", allKeys);
      } catch (error) {
        console.log("Failed to remove all keys:", error);
      }

      // Update state
      setIsLoggedIn(false);
      setUser(null);
      setUserBudget(null);

      // Verify data is cleared
      const remainingKeys = await AsyncStorage.getAllKeys();
      console.log("Remaining keys after logout:", remainingKeys);
      console.log("=== LOGOUT COMPLETED ===");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Function to manually clear all stored data (for testing)
  const clearAllData = async () => {
    try {
      console.log("=== CLEAR ALL DATA STARTED ===");

      // Get all keys first
      const keys = await AsyncStorage.getAllKeys();
      console.log("Keys to remove:", keys);

      // Remove all keys
      await AsyncStorage.multiRemove(keys);
      console.log("Removed all keys");

      // Update state
      setIsLoggedIn(false);
      setUser(null);
      setUserBudget(null);

      // Verify data is cleared
      const remainingKeys = await AsyncStorage.getAllKeys();
      console.log("Remaining keys after clear:", remainingKeys);
      console.log("=== CLEAR ALL DATA COMPLETED ===");
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        userBudget,
        login,
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
