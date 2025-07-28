import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Linking } from "react-native";
import { CURRENT_API_CONFIG } from "../config/api";

// API Configuration
const API_BASE_URL = CURRENT_API_CONFIG.baseURL;

console.log("🔧 API Configuration:", {
  baseURL: API_BASE_URL,
  timeout: CURRENT_API_CONFIG.timeout,
  environment: CURRENT_API_CONFIG,
});

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: CURRENT_API_CONFIG.timeout, // Use configured timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await authAPI.refreshToken(refreshToken);

          if (response.accessToken) {
            // Store new tokens
            await AsyncStorage.setItem("accessToken", response.accessToken);
            if (response.idToken) {
              await AsyncStorage.setItem("idToken", response.idToken);
            }

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Clear all auth data and redirect to login
        await AsyncStorage.multiRemove([
          "accessToken",
          "idToken",
          "refreshToken",
          "isLoggedIn",
          "user",
        ]);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  register: async (userData: {
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
  }) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  login: async (credentials: {
    email?: string;
    username?: string;
    password: string;
  }) => {
    console.log("🔐 Login attempt:", {
      url: `${API_BASE_URL}/auth/login`,
      credentials: { ...credentials, password: "***" },
    });

    try {
      const response = await api.post("/auth/login", credentials);
      console.log("✅ Login response received:", {
        status: response.status,
        hasData: !!response.data,
        message: response.data?.message,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Login request failed:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      throw error;
    }
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post("/auth/refresh", { refreshToken });
    return response.data;
  },

  confirmSignUp: async (data: { username: string; code: string }) => {
    const response = await api.post("/auth/confirm-signup", data);
    return response.data;
  },
  resendVerification: async (data: { email: string }) => {
    const response = await api.post("/auth/resend-verification", data);
    return response.data;
  },
};

// Banking API functions
export const bankingAPI = {
  // Connect a bank account using TrueLayer
  connectBank: async (data?: { redirectUrl?: string }) => {
    const token = await AsyncStorage.getItem("accessToken");
    console.log("[API] connectBank", { token, data });
    const response = await api.post("/banking/connect", data || {});
    return response.data;
  },

  // Get connected banks for the authenticated user
  getConnectedBanks: async () => {
    const token = await AsyncStorage.getItem("accessToken");
    console.log("[API] getConnectedBanks", { token });
    const response = await api.get("/banking/connected-banks");
    return response.data;
  },

  // Get connected accounts (legacy)
  getAccounts: async () => {
    const token = await AsyncStorage.getItem("accessToken");
    console.log("[API] getAccounts", { token });
    const response = await api.post("/banking/accounts", {});
    return response.data;
  },

  // Get all user transactions
  getAllTransactions: async (limit?: number, startKey?: any) => {
    const token = await AsyncStorage.getItem("accessToken");
    console.log("[API] getAllTransactions", { token, limit, startKey });
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (startKey) params.append('startKey', JSON.stringify(startKey));
    const response = await api.get(`/banking/transactions?${params.toString()}`);
    return response.data;
  },

  // Get account transactions
  getTransactions: async (accountId: string, limit?: number) => {
    const token = await AsyncStorage.getItem("accessToken");
    console.log("[API] getTransactions", { accountId, token, limit });
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/banking/account/${accountId}/transactions${params}`);
    return response.data;
  },

  // Get account balance
  getBalance: async (accountId: string) => {
    const token = await AsyncStorage.getItem("accessToken");
    console.log("[API] getBalance", { accountId, token });
    const response = await api.post("/banking/account/balance", {
      accountId,
    });
    return response.data;
  },

  // Handle bank callback after user consent (exchange code for token)
  handleCallback: async (code: string) => {
    const token = await AsyncStorage.getItem("accessToken");
    const user = await AsyncStorage.getItem("user");
    let userId = null;

    try {
      if (user) {
        const userData = JSON.parse(user);
        userId = userData.sub || userData.userId;
      }
    } catch (e) {
      console.log("[API] Could not parse user data");
    }

    console.log("[API] handleCallback", { code, token, userId });
    const response = await api.post("/banking/callback", {
      code,
      userId, // Include userId as fallback
    });
    return response.data;
  },

  // Get available institutions (banks/providers)
  getInstitutions: async () => {
    const token = await AsyncStorage.getItem("accessToken");
    console.log("[API] getInstitutions", { token });
    const response = await api.get("/banking/institutions");
    return response.data;
  },

  // Refresh transactions manually (trigger sync from TrueLayer)
  refreshTransactions: async () => {
    const token = await AsyncStorage.getItem("accessToken");
    console.log("[API] refreshTransactions", { token });
    const response = await api.post("/banking/transactions/refresh", {});
    return response.data;
  },
};

// Profile API functions
export const profileAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get("/profile");
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
  }) => {
    const response = await api.put("/profile", profileData);
    return response.data;
  },

  // Get credit score
  getCreditScore: async () => {
    const response = await api.get("/credit-score");
    return response.data;
  },

  // Get goals
  getGoals: async () => {
    const response = await api.get("/goals");
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  const response = await api.get("/health");
  return response.data;
};

export default api;
