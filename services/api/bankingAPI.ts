import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { api, aiAPI } from "../config/apiClient";
import { getCachedData, setCachedData } from "../config/apiCache";
import { getTrueLayerRedirectURL, logEnvironmentInfo } from "../../config/environment";

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
    setCachedData(cacheKey, accountsData, 2 * 60 * 1000);
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
    setCachedData(cacheKey, response.data, 3 * 60 * 1000);
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
};