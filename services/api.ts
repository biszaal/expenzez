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

console.log("🔧 Full API_BASE_URL:", API_BASE_URL);
console.log("🔧 CURRENT_API_CONFIG:", CURRENT_API_CONFIG);

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

// Simple in-memory cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCachedData = (key: string): any | null => {
  const cached = apiCache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    apiCache.delete(key);
    return null;
  }
  
  return cached.data;
};

const setCachedData = (key: string, data: any, ttlMinutes: number = 5): void => {
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMinutes * 60 * 1000, // Convert minutes to milliseconds
  });
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

  // Get connected accounts (legacy) with caching
  getAccounts: async () => {
    const cacheKey = 'user_accounts';
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log("[API] 🚀 Using cached accounts data");
      return cached;
    }

    const token = await AsyncStorage.getItem("accessToken");
    console.log("[API] getAccounts", { token });
    const response = await api.post("/banking/accounts", {});
    
    // Cache for 2 minutes since account data changes frequently
    setCachedData(cacheKey, response.data, 2);
    return response.data;
  },

  // Get all user transactions with caching
  getAllTransactions: async (limit?: number, startKey?: any) => {
    const cacheKey = `all_transactions_${limit || 'all'}_${JSON.stringify(startKey || {})}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log("[API] 🚀 Using cached transactions data");
      return cached;
    }

    const token = await AsyncStorage.getItem("accessToken");
    console.log("[API] getAllTransactions", { token, limit, startKey });
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (startKey) params.append('startKey', JSON.stringify(startKey));
    const response = await api.get(`/banking/transactions?${params.toString()}`);
    
    // Cache for 3 minutes since transaction data changes less frequently
    setCachedData(cacheKey, response.data, 3);
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

  // Get cached bank connections and balances when TrueLayer token is expired
  getCachedBankData: async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      console.log("[API] getCachedBankData", { token });
      const response = await api.get("/banking/cached-data");
      return response.data;
    } catch (error: any) {
      console.error("[API] Failed to get cached bank data:", error);
      throw error;
    }
  },

  // Check if bank connections need to be refreshed (expired tokens)
  checkBankConnectionStatus: async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      console.log("[API] checkBankConnectionStatus", { token });
      const response = await api.get("/banking/connection-status");
      return response.data;
    } catch (error: any) {
      console.error("[API] Failed to check bank connection status:", error);
      throw error;
    }
  },

  // AI Assistant functionality
  getAIInsight: async (message: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      console.log("[API] getAIInsight", { token, message });
      const response = await api.post("/ai/insight", { message });
      return response.data;
    } catch (error: any) {
      console.error("[API] Failed to get AI insight:", error);
      throw error;
    }
  },

  getAIChatHistory: async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      console.log("[API] getAIChatHistory", { token });
      const response = await api.get("/ai/chat-history");
      return response.data;
    } catch (error: any) {
      console.error("[API] Failed to get AI chat history:", error);
      throw error;
    }
  },

  saveAIChatMessage: async (role: "user" | "assistant", content: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      console.log("[API] saveAIChatMessage", { token, role, content });
      const response = await api.post("/ai/chat-message", { role, content });
      return response.data;
    } catch (error: any) {
      console.error("[API] Failed to save AI chat message:", error);
      throw error;
    }
  },

  clearAIChatHistory: async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      console.log("[API] clearAIChatHistory", { token });
      const response = await api.delete("/ai/chat-history");
      return response.data;
    } catch (error: any) {
      console.error("[API] Failed to clear AI chat history:", error);
      throw error;
    }
  },
};

// Profile API functions
export const profileAPI = {
  // Get user profile with caching
  getProfile: async () => {
    const cacheKey = 'user_profile';
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log("[API] 🚀 Using cached profile data");
      return cached;
    }

    const response = await api.get("/profile");
    
    // Cache for 5 minutes since profile data changes infrequently
    setCachedData(cacheKey, response.data, 5);
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

  // Get credit score with caching
  getCreditScore: async () => {
    const cacheKey = 'user_credit_score';
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log("[API] 🚀 Using cached credit score data");
      return cached;
    }

    const response = await api.get("/credit-score");
    
    // Cache for 10 minutes since credit score changes rarely
    setCachedData(cacheKey, response.data, 10);
    return response.data;
  },

  // Get goals with caching
  getGoals: async () => {
    const cacheKey = 'user_goals';
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log("[API] 🚀 Using cached goals data");
      return cached;
    }

    const response = await api.get("/goals");
    
    // Cache for 5 minutes since goals might be updated moderately
    setCachedData(cacheKey, response.data, 5);
    return response.data;
  },
};

// Notification API
export const notificationAPI = {
  // Device token management
  registerToken: async (tokenData: {
    token: string;
    platform: 'ios' | 'android' | 'web';
    deviceInfo?: {
      deviceName?: string;
      osVersion?: string;
      appVersion?: string;
    };
  }) => {
    try {
      const response = await api.post('/notifications/tokens', tokenData);
      return response.data;
    } catch (error: any) {
      console.error('Error registering notification token:', error);
      throw error;
    }
  },

  deactivateToken: async (tokenId?: string, token?: string) => {
    try {
      const response = await api.delete('/notifications/tokens', {
        data: { tokenId, token },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deactivating notification token:', error);
      throw error;
    }
  },

  getTokens: async () => {
    try {
      const response = await api.get('/notifications/tokens');
      return response.data;
    } catch (error: any) {
      console.error('Error getting notification tokens:', error);
      throw error;
    }
  },

  // Preferences management
  getPreferences: async () => {
    try {
      const response = await api.get('/notifications/preferences');
      return response.data;
    } catch (error: any) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  },

  updatePreferences: async (preferences: any) => {
    try {
      const response = await api.put('/notifications/preferences', preferences);
      return response.data;
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  },

  // Send notification (for testing)
  sendNotification: async (notificationData: {
    type: 'transaction' | 'budget' | 'account' | 'security' | 'insight';
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: 'low' | 'normal' | 'high';
  }) => {
    try {
      console.log('🔔 [API] Sending notification with config:', {
        baseURL: API_BASE_URL,
        fullURL: `${API_BASE_URL}/notifications/send`,
        data: notificationData,
      });
      
      const response = await api.post('/notifications/send', notificationData);
      return response.data;
    } catch (error: any) {
      console.error('Error sending notification:', error);
      console.error('🔔 [API] Request details:', {
        baseURL: API_BASE_URL,
        url: error.config?.url,
        method: error.config?.method,
        fullRequestURL: error.config?.baseURL + error.config?.url,
      });
      throw error;
    }
  },
};

// Health check
export const healthCheck = async () => {
  const response = await api.get("/health");
  return response.data;
};

export default api;
