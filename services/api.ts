import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Linking } from "react-native";
import { CURRENT_API_CONFIG } from "../config/api";

// API Configuration
const API_BASE_URL = CURRENT_API_CONFIG.baseURL;

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
    console.log("Access token being sent:", token);
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

  login: async (credentials: { identifier: string; password: string }) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
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
  // Connect a bank account using Nordigen
  connectBank: async (data: {
    institutionId: string;
    redirectUrl?: string;
  }) => {
    const response = await api.post("/banking/connect", data);
    return response.data;
  },

  // Test Nordigen connection
  testNordigen: async () => {
    const response = await api.get("/banking/test-nordigen");
    return response.data;
  },

  // Test transactions
  testTransactions: async () => {
    const response = await api.get("/banking/test-transactions");
    return response.data;
  },

  // Get available institutions
  getInstitutions: async (country?: string) => {
    const response = await api.get("/banking/institutions", {
      params: { country: country || "gb" },
    });
    return response.data;
  },

  // Get connected accounts
  getAccounts: async () => {
    const response = await api.get("/banking/accounts");
    return response.data;
  },

  // Get account transactions
  getTransactions: async (
    accountId: string,
    params?: { from?: string; to?: string }
  ) => {
    const response = await api.get(
      `/banking/accounts/${accountId}/transactions`,
      { params }
    );
    return response.data;
  },

  // Get account balance
  getBalance: async (accountId: string) => {
    const response = await api.get(`/banking/accounts/${accountId}/balance`);
    return response.data;
  },

  // Sync accounts (refresh data from bank)
  syncAccounts: async () => {
    const response = await api.post("/banking/sync");
    return response.data;
  },

  // Disconnect bank account
  disconnectAccount: async (accountId: string) => {
    const response = await api.delete(`/banking/accounts/${accountId}`);
    return response.data;
  },

  // Refresh account balances
  refreshBalances: async () => {
    const response = await api.post("/banking/accounts/refresh-balances");
    return response.data;
  },

  // Handle bank callback after user consent
  handleCallback: async (data: { requisitionId: string }) => {
    const response = await api.post("/banking/callback", data);
    return response.data;
  },

  // Get AI-powered finance insight
  getAIInsight: async (question: string) => {
    const response = await api.post("/banking/ai-insight", { question });
    return response.data;
  },

  // Save a chat message (user or assistant)
  saveAIChatMessage: async (role: "user" | "assistant", content: string) => {
    const response = await api.post("/banking/ai-chat", { role, content });
    return response.data;
  },

  // Get chat history for the user
  getAIChatHistory: async () => {
    const response = await api.get("/banking/ai-chat");
    return response.data;
  },

  // Clear chat history for the user
  clearAIChatHistory: async () => {
    const response = await api.delete("/banking/ai-chat");
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
