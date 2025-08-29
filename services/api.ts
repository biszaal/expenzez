import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CURRENT_API_CONFIG } from "../config/api";
import { getTrueLayerRedirectURL, logEnvironmentInfo } from "../config/environment";

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

// Create separate axios instance for AI endpoints (with user name functionality)
const aiAPI = axios.create({
  baseURL: API_BASE_URL, // Use same API base URL
  timeout: CURRENT_API_CONFIG.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    // Import tokenManager dynamically to avoid circular dependency
    const { tokenManager } = await import('./tokenManager');
    const token = await tokenManager.getValidAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Request interceptor for AI API
aiAPI.interceptors.request.use(
  async (config) => {
    // Import tokenManager dynamically to avoid circular dependency
    const { tokenManager } = await import('./tokenManager');
    const token = await tokenManager.getValidAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for AI API (same as main API)
aiAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Import tokenManager dynamically to avoid circular dependency
        const { tokenManager } = await import('./tokenManager');
        
        // Try to refresh the token using token manager
        const newToken = await tokenManager.refreshTokenIfNeeded();

        if (newToken) {
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return aiAPI(originalRequest);
        } else {
          // Token refresh failed, clear all data
          await tokenManager.clearAllTokens();
          // Clear sensitive cache data on logout
          apiCache.clear();
        }
      } catch (refreshError) {
        console.error("❌ AI API token refresh failed:", refreshError);
        // Import tokenManager and clear all tokens
        const { tokenManager } = await import('./tokenManager');
        await tokenManager.clearAllTokens();
        apiCache.clear();
      }
    }

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
        // Import tokenManager dynamically to avoid circular dependency
        const { tokenManager } = await import('./tokenManager');
        
        // Try to refresh the token using token manager
        const newToken = await tokenManager.refreshTokenIfNeeded();

        if (newToken) {
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          // Token refresh failed, clear all data
          await tokenManager.clearAllTokens();
          // Clear sensitive cache data on logout
          apiCache.clear();
        }
      } catch (refreshError) {
        console.error("❌ Token refresh in interceptor failed:", refreshError);
        // Import tokenManager and clear all tokens
        const { tokenManager } = await import('./tokenManager');
        await tokenManager.clearAllTokens();
        apiCache.clear();
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Check if username already exists using the existing checkUserStatus endpoint
  checkUsernameExists: async (username: string): Promise<{ exists: boolean; error?: string }> => {
    try {
      // First try the main API Gateway
      const response = await api.post("/auth/check-user-status", { username });
      // If we get status 200, the user exists and we have their details
      if (response.status === 200 && response.data.username) {
        return { exists: true };
      }
      return { exists: false };
    } catch (error: any) {
      // Handle network errors first (no response)
      if (!error.response) {
        console.error("Username check network error:", error.message);
        // For network errors, assume username is available but show warning
        return { exists: false, error: "Network error. Username availability unknown." };
      }

      // If main API returns 404, try the fallback auth API Gateway
      if (error.response?.status === 404) {
        try {
          const fallbackResponse = await axios.post(
            "https://a95uq2n8k7.execute-api.eu-west-2.amazonaws.com/auth/check-user-status",
            { username },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          // If we get a successful response, user exists
          if (fallbackResponse.status === 200 && fallbackResponse.data.username) {
            return { exists: true };
          }
          return { exists: false };
        } catch (fallbackError: any) {
          // Handle network errors in fallback
          if (!fallbackError.response) {
            console.error("Username check fallback network error:", fallbackError.message);
            return { exists: false, error: "Network error. Username availability unknown." };
          }

          // Handle specific error status codes from the checkUserStatus Lambda
          if (fallbackError.response?.data?.error === "UserNotFoundException") {
            // User not found - username is available
            return { exists: false };
          } else if (fallbackError.response?.status === 400 && fallbackError.response?.data?.message?.includes("username")) {
            // Missing or invalid username parameter
            return { exists: false, error: "Invalid username format" };
          } else if (fallbackError.response?.status >= 500) {
            // Server error
            return { exists: false, error: "Server error. Please try again." };
          }
          
          console.error("Username check fallback error:", fallbackError);
          return { exists: false, error: "Unable to verify username availability" };
        }
      } else if (error.response?.data?.error === "UserNotFoundException") {
        // User not found - username is available
        return { exists: false };
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes("username")) {
        // Missing or invalid username parameter
        return { exists: false, error: "Invalid username format" };
      } else if (error.response?.status >= 500) {
        // Server error
        return { exists: false, error: "Server error. Please try again." };
      }
      
      console.error("Username check error:", error);
      return { exists: false, error: "Unable to verify username availability" };
    }
  },

  // Check if email already exists - disabled due to AWS Cognito security measures
  checkEmailExists: async (email: string): Promise<{ exists: boolean; error?: string }> => {
    // AWS Cognito is configured to prevent email enumeration attacks by returning
    // the same error message for both existing and non-existing emails.
    // This is good security practice but prevents reliable client-side validation.
    
    // The proper approach is to:
    // 1. Allow users to proceed through registration
    // 2. Handle email existence errors on the server side during registration
    // 3. Show appropriate error messages if registration fails due to existing email
    
    // For now, we'll just validate email format and let server-side handle existence
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { exists: false, error: "Invalid email format" };
    }
    
    // Return as available - server will validate during registration
    return { exists: false };
  },

  // Check if phone number already exists - temporarily disabled
  checkPhoneExists: async (phoneNumber: string): Promise<{ exists: boolean; error?: string }> => {
    // For now, return unavailable until we implement proper phone validation  
    return { exists: false, error: "Phone validation temporarily unavailable" };
  },

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

    try {
      const response = await api.post("/auth/login", credentials);
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
  resendVerification: async (data: { email?: string; username?: string }) => {
    const response = await api.post("/auth/resend-verification", data);
    return response.data;
  },

  forgotPassword: async (data: { username: string }) => {
    try {
      // Use the working Cognito endpoint first
      const authResponse = await axios.post(
        "https://u5f7pmlt88.execute-api.eu-west-2.amazonaws.com/auth/forgot-password",
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return authResponse.data;
    } catch (error: any) {
      // Fallback to main API if needed
      const response = await api.post("/auth/forgot-password", data);
      return response.data;
    }
  },

  forgotUsername: async (data: { email: string }) => {
    try {
      const response = await api.post("/auth/forgot-username", data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        try {
          // Use dedicated auth API Gateway for forgot username functionality
          const authResponse = await axios.post(
            "https://u5f7pmlt88.execute-api.eu-west-2.amazonaws.com/auth/forgot-username",
            data,
            {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 10000, // 10 second timeout
            }
          );
          return authResponse.data;
        } catch (fallbackError: any) {
          // Re-throw the original 404 error so the UI can handle it appropriately
          throw error;
        }
      }
      throw error;
    }
  },

  confirmForgotPassword: async (data: { 
    username: string; 
    confirmationCode: string; 
    newPassword: string; 
  }) => {
    try {
      const response = await api.post("/auth/confirm-forgot-password", data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Use dedicated auth API Gateway for forgot password functionality
        const authResponse = await axios.post(
          "https://u5f7pmlt88.execute-api.eu-west-2.amazonaws.com/auth/confirm-forgot-password",
          data,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        return authResponse.data;
      }
      throw error;
    }
  },

  loginWithApple: async (credentials: {
    identityToken: string;
    authorizationCode: string;
    user?: string;
    email?: string | null;
    fullName?: { givenName?: string | null; familyName?: string | null } | null;
  }) => {
    const response = await api.post("/auth/apple-login", credentials);
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

const clearCachedData = (key: string): void => {
  apiCache.delete(key);
};

// Banking API functions
export const bankingAPI = {
  // Connect a bank account using TrueLayer
  connectBank: async (data?: { redirectUrl?: string }) => {
    const token = await AsyncStorage.getItem("accessToken");
    
    // Use environment-specific redirect URL if not provided
    const redirectUrl = data?.redirectUrl || getTrueLayerRedirectURL();
    
    console.log('🏦 Connecting bank with redirect URL:', redirectUrl);
    logEnvironmentInfo(); // Log environment info for debugging
    
    const response = await api.post("/banking/connect", {
      ...data,
      redirectUrl
    });
    return response.data;
  },

  // Connect to specific bank directly (skip provider selection)
  connectBankDirect: async (providerId: string, accountId?: string) => {
    const token = await AsyncStorage.getItem("accessToken");
    const redirectUrl = getTrueLayerRedirectURL();
    
    try {
      const response = await api.post("/banking/connect-direct", { 
        providerId,
        redirectUrl,
        ...(accountId && { accountId }) // Include accountId for reconnection
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 401) {
        // Fallback to regular connect bank - user will select bank on TrueLayer page
        // This still provides a decent user experience
        const fallbackResponse = await api.post("/banking/connect", {
          redirectUrl
        });
        return fallbackResponse.data;
      }
      throw error;
    }
  },

  // Get connected banks for the authenticated user
  getConnectedBanks: async () => {
    const token = await AsyncStorage.getItem("accessToken");
    const response = await api.get("/banking/connected");
    return response.data;
  },

  // Reconnect expired bank connection
  reconnectBank: async (accountId: string, code: string) => {
    const token = await AsyncStorage.getItem("accessToken");
    
    try {
      const response = await api.post("/banking/reconnect", {
        accountId,
        code
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Use the newly deployed banking functions endpoint
        const newApiResponse = await axios.post(
          `https://djq0zgtbdd.execute-api.eu-west-2.amazonaws.com/banking/reconnect`,
          {
            accountId,
            code
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        return newApiResponse.data;
      }
      throw error;
    }
  },

  // Remove bank connection and all associated data
  removeBank: async (accountId: string) => {
    const token = await AsyncStorage.getItem("accessToken");
    
    try {
      const response = await api.delete(`/banking/remove/${accountId}`);
      return response.data;
    } catch (error: any) {
      console.error("[API] removeBank failed:", error);
      // For now, we'll show a message to the user that the bank cannot be removed automatically
      // but the connection is already expired/invalid, so it's functionally removed
      throw new Error("Bank connection expired - please contact support to fully remove this connection.");
    }
  },

  // Get connected accounts (legacy) with caching
  getAccounts: async () => {
    const cacheKey = 'user_accounts';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    const token = await AsyncStorage.getItem("accessToken");
    // Use the existing connected banks endpoint and transform the data
    const response = await api.get("/banking/connected");
    
    // Transform connected banks to accounts format for backward compatibility
    const accountsData = {
      accounts: (response.data.banks || []).map((bank: any) => ({
        id: bank.accountId,
        name: bank.bankName || 'Unknown Bank',
        institutionId: bank.provider?.provider_id || 'unknown',
        currency: bank.currency || 'GBP',
        type: bank.accountType || 'current',
        status: bank.status || 'connected',
        iban: `****${bank.accountNumber?.slice(-4) || '****'}`,
        createdAt: bank.connectedAt
      }))
    };
    
    // Cache for 2 minutes since account data changes frequently
    setCachedData(cacheKey, accountsData, 2);
    return accountsData;
  },

  // Get all user transactions with caching
  getAllTransactions: async (limit?: number, startKey?: any) => {
    const cacheKey = `all_transactions_${limit || 'all'}_${JSON.stringify(startKey || {})}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    const token = await AsyncStorage.getItem("accessToken");
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
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/banking/account/${accountId}/transactions${params}`);
    return response.data;
  },

  // Get account balance
  getBalance: async (accountId: string) => {
    const token = await AsyncStorage.getItem("accessToken");
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
    } catch {
    }

    const response = await api.post("/banking/callback", {
      code,
      userId, // Include userId as fallback
    });
    return response.data;
  },

  // Get available institutions (banks/providers)
  getInstitutions: async () => {
    const token = await AsyncStorage.getItem("accessToken");
    const response = await api.get("/banking/institutions");
    return response.data;
  },

  // Refresh transactions manually (trigger sync from TrueLayer)
  refreshTransactions: async () => {
    const token = await AsyncStorage.getItem("accessToken");
    const response = await api.post("/banking/transactions/refresh", {});
    return response.data;
  },

  // Get cached bank connections and balances when TrueLayer token is expired
  getCachedBankData: async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const response = await api.get("/banking/cached-data");
      return response.data;
    } catch (error: any) {
      console.error("[API] Failed to get cached bank data:", error);
      throw error;
    }
  },

  // Refresh account balances (placeholder function for compatibility)
  refreshBalances: async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      // For now, just return success - in a real app this would trigger balance refresh
      return { message: "Balance refresh initiated", success: true };
    } catch (error: any) {
      console.error("[API] Failed to refresh balances:", error);
      throw error;
    }
  },

  // Check if bank connections need to be refreshed (expired tokens)
  checkBankConnectionStatus: async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
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
      const response = await aiAPI.post("/ai/insight", { message });
      return response.data;
    } catch (error: any) {
      console.error("[AI API] Failed to get AI insight:", error);
      
      // Enhanced fallback for TestFlight/Production when AI endpoints might not be available
      if (error.response?.status === 404 || error.response?.status === 502 || error.response?.status === 503) {
        console.log("🤖 AI endpoint not available, using fallback response");
        
        // Generate contextual fallback responses based on message content
        const lowerMessage = message.toLowerCase();
        let fallbackResponse = "I'm here to help with your finances! ";
        
        if (lowerMessage.includes('spending') || lowerMessage.includes('spend')) {
          fallbackResponse += "Your spending patterns show you've made several transactions recently. Try to categorize them to better track where your money goes.";
        } else if (lowerMessage.includes('budget') || lowerMessage.includes('money')) {
          fallbackResponse += "A good budget typically follows the 50/30/20 rule - 50% needs, 30% wants, 20% savings. Review your monthly expenses to see how you're tracking.";
        } else if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
          fallbackResponse += "Start with small, automated savings. Even £50 per month can add up over time. Look for subscriptions or expenses you can reduce.";
        } else if (lowerMessage.includes('transaction') || lowerMessage.includes('payment')) {
          fallbackResponse += "I can see your recent transactions in your connected accounts. Check the transactions tab to review and categorize them.";
        } else {
          fallbackResponse += "I can help you understand your spending, set budgets, and give financial advice. What specific area of your finances would you like help with?";
        }
        
        return { 
          answer: fallbackResponse,
          fallback: true,
          error: "AI service temporarily unavailable"
        };
      }
      
      // For other errors, provide a generic helpful response
      return { 
        answer: "I'm experiencing some technical difficulties right now. In the meantime, you can check your transactions and budgets in the other tabs of the app. Is there something specific about your finances you'd like help with?",
        fallback: true,
        error: error.message
      };
    }
  },

  getAIChatHistory: async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const response = await aiAPI.get("/ai/chat-history");
      return response.data;
    } catch (error: any) {
      console.error("[AI API] Failed to get AI chat history:", error);
      
      // Provide fallback for missing AI endpoints
      if (error.response?.status === 404 || error.response?.status === 502 || error.response?.status === 503) {
        console.log("🤖 AI chat history endpoint not available, starting fresh");
        return { 
          history: [],
          fallback: true,
          message: "AI chat history service temporarily unavailable"
        };
      }
      
      // Return empty history for other errors instead of throwing
      return { 
        history: [],
        fallback: true,
        error: error.message
      };
    }
  },

  saveAIChatMessage: async (role: "user" | "assistant", content: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const response = await aiAPI.post("/ai/chat-message", { role, content });
      return response.data;
    } catch (error: any) {
      console.error("[AI API] Failed to save AI chat message:", error);
      
      // Don't throw error for missing endpoints - just log and continue
      if (error.response?.status === 404 || error.response?.status === 502 || error.response?.status === 503) {
        console.log("🤖 AI chat save endpoint not available, message not saved");
        return { 
          success: false,
          fallback: true,
          message: "Chat message saving temporarily unavailable"
        };
      }
      
      // For other errors, don't block the chat flow
      console.warn("AI chat message not saved:", error.message);
      return { 
        success: false,
        fallback: true,
        error: error.message
      };
    }
  },

  clearAIChatHistory: async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const response = await aiAPI.delete("/ai/chat-history");
      return response.data;
    } catch (error: any) {
      console.error("[AI API] Failed to clear AI chat history:", error);
      
      // Don't throw error for missing endpoints
      if (error.response?.status === 404 || error.response?.status === 502 || error.response?.status === 503) {
        console.log("🤖 AI clear history endpoint not available, local clear only");
        return { 
          success: false,
          fallback: true,
          message: "Chat history clearing temporarily unavailable"
        };
      }
      
      // For other errors, don't block the UI
      console.warn("AI chat history not cleared:", error.message);
      return { 
        success: false,
        fallback: true,
        error: error.message
      };
    }
  },

  // Process TrueLayer callback with authorization code
  processCallback: async (data: {
    code: string;
    environment: string;
    isTestFlight: boolean;
  }) => {
    const token = await AsyncStorage.getItem("accessToken");
    const redirectUrl = getTrueLayerRedirectURL();
    
    console.log('🔄 Processing banking callback:', {
      environment: data.environment,
      isTestFlight: data.isTestFlight,
      redirectUrl,
      hasCode: !!data.code
    });
    
    const response = await api.post("/banking/callback", {
      code: data.code,
      redirectUrl,
      environment: data.environment,
      isTestFlight: data.isTestFlight
    });
    
    return response.data;
  },
};

// Expense API functions
export const expenseAPI = {
  // Create a new expense
  createExpense: async (expenseData: {
    amount: number;
    category: string;
    description?: string;
    date: string;
    receipt?: {
      url?: string;
      filename?: string;
    };
    tags?: string[];
    isRecurring?: boolean;
    recurringPattern?: {
      frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
      interval?: number;
      endDate?: string;
    };
  }) => {
    const response = await api.post("/expenses", expenseData);
    
    // Clear related cache
    clearCachedData('user_expenses');
    clearCachedData('expense_categories');
    return response.data;
  },

  // Get user expenses with filtering
  getExpenses: async (params?: {
    limit?: number;
    startKey?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const cacheKey = `user_expenses_${JSON.stringify(params || {})}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.startKey) queryParams.append('startKey', params.startKey);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get(`/expenses?${queryParams.toString()}`);
    
    // Cache for 3 minutes
    setCachedData(cacheKey, response.data, 3);
    return response.data;
  },

  // Update an expense
  updateExpense: async (expenseId: string, updates: any) => {
    const response = await api.put(`/expenses/${expenseId}`, updates);
    
    // Clear cache after updating
    clearCachedData('user_expenses');
    clearCachedData('expense_categories');
    return response.data;
  },

  // Delete an expense
  deleteExpense: async (expenseId: string) => {
    const response = await api.delete(`/expenses/${expenseId}`);
    
    // Clear cache after deleting
    clearCachedData('user_expenses');
    clearCachedData('expense_categories');
    return response.data;
  },

  // Get a specific expense by ID
  getExpenseById: async (expenseId: string) => {
    const response = await api.get(`/expenses/${expenseId}`);
    return response.data;
  },

  // Get expense categories with statistics
  getExpenseCategories: async () => {
    const cacheKey = 'expense_categories';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await api.get("/expenses/categories");
    
    // Cache for 5 minutes
    setCachedData(cacheKey, response.data, 5);
    return response.data;
  },
};

// Budget API functions
export const budgetAPI = {
  // Create a new budget
  createBudget: async (budgetData: {
    name: string;
    category: string;
    amount: number;
    period: 'weekly' | 'monthly' | 'yearly';
    startDate: string;
    endDate?: string;
    alertThreshold?: number;
    isActive?: boolean;
  }) => {
    const response = await api.post("/budgets", budgetData);
    
    // Clear related cache
    clearCachedData('user_budgets');
    clearCachedData('budget_alerts');
    return response.data;
  },

  // Get user budgets
  getBudgets: async (activeOnly = true) => {
    const cacheKey = `user_budgets_${activeOnly}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    const params = new URLSearchParams();
    if (activeOnly) params.append('active', 'true');

    const response = await api.get(`/budgets?${params.toString()}`);
    
    // Cache for 5 minutes
    setCachedData(cacheKey, response.data, 5);
    return response.data;
  },

  // Update a budget
  updateBudget: async (budgetId: string, updates: any) => {
    const response = await api.put(`/budgets/${budgetId}`, updates);
    
    // Clear cache after updating
    clearCachedData('user_budgets');
    clearCachedData('budget_alerts');
    return response.data;
  },

  // Delete a budget
  deleteBudget: async (budgetId: string) => {
    const response = await api.delete(`/budgets/${budgetId}`);
    
    // Clear cache after deleting
    clearCachedData('user_budgets');
    clearCachedData('budget_alerts');
    return response.data;
  },

  // Get budget alerts
  getBudgetAlerts: async () => {
    const cacheKey = 'budget_alerts';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await api.get("/budgets/alerts");
    
    // Cache for 2 minutes (alerts should be fresh)
    setCachedData(cacheKey, response.data, 2);
    return response.data;
  },
};

// Profile API functions
export const profileAPI = {
  // Get user profile with caching
  getProfile: async () => {
    const cacheKey = 'user_profile';
    const cached = getCachedData(cacheKey);
    if (cached) {
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
      return cached;
    }

    const response = await api.get("/goals");
    
    // Cache for 5 minutes since goals might be updated moderately
    setCachedData(cacheKey, response.data, 5);
    return response.data;
  },

  // Create a new savings goal
  createGoal: async (goalData: {
    title: string;
    description?: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    category: string;
  }) => {
    const response = await api.post("/goals", goalData);
    
    // Clear cache after creating
    clearCachedData('user_goals');
    return response.data;
  },

  // Update a savings goal
  updateGoal: async (goalId: string, updates: any) => {
    const response = await api.put(`/goals/${goalId}`, updates);
    
    // Clear cache after updating
    clearCachedData('user_goals');
    return response.data;
  },

  // Delete a savings goal
  deleteGoal: async (goalId: string) => {
    const response = await api.delete(`/goals/${goalId}`);
    
    // Clear cache after deleting
    clearCachedData('user_goals');
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
  // Get notification history from DynamoDB
  getHistory: async (limit?: number) => {
    try {
      const response = await api.get('/notifications/history', {
        params: { limit: limit || 50 },
        timeout: 45000, // 45 seconds timeout for notifications
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('Notification history request timed out');
        // Return empty result instead of throwing
        return { success: false, notifications: [], count: 0 };
      }
      console.error('Error fetching notification history:', error);
      throw error;
    }
  },

  // Monthly AI Reports
  getMonthlyReport: async (reportMonth: string = 'latest') => {
    try {
      const response = await api.get(`/ai/monthly-report/${reportMonth}`, {
        timeout: 30000, // 30 seconds timeout
      });
      return response.data;
    } catch (error: any) {
      // Don't log 404 errors - this feature is optional
      if (error.response?.status === 404) {
        return { hasReports: false, message: 'Monthly reports feature not available' };
      }
      console.error('Error fetching monthly report:', error);
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
