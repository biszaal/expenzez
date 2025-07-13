// app/auth/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../../services/api";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load login state and user data from AsyncStorage
    const loadAuthState = async () => {
      try {
        const [storedLogin, storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem("isLoggedIn"),
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("authToken"),
        ]);

        if (storedLogin === "true" && storedUser && storedToken) {
          setIsLoggedIn(true);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });

      // Store auth data
      await Promise.all([
        AsyncStorage.setItem("isLoggedIn", "true"),
        AsyncStorage.setItem("authToken", response.token),
        AsyncStorage.setItem("user", JSON.stringify(response.user)),
      ]);

      setIsLoggedIn(true);
      setUser(response.user);

      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.register({ name, email, password });

      // Store auth data
      await Promise.all([
        AsyncStorage.setItem("isLoggedIn", "true"),
        AsyncStorage.setItem("authToken", response.token),
        AsyncStorage.setItem("user", JSON.stringify(response.user)),
      ]);

      setIsLoggedIn(true);
      setUser(response.user);

      return { success: true };
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
      // Clear all auth data
      await Promise.all([
        AsyncStorage.removeItem("isLoggedIn"),
        AsyncStorage.removeItem("authToken"),
        AsyncStorage.removeItem("user"),
      ]);

      setIsLoggedIn(false);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        register,
        logout,
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
