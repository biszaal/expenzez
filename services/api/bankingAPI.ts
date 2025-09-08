import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../config/apiClient";
import { getCachedData, setCachedData } from "../config/apiCache";
import { nordigenAPI } from "./nordigenAPI";

export const bankingAPI = {
  // Connect a bank account using Nordigen
  connectBank: async (institutionId?: string) => {
    console.log('🏦 Connecting bank with Nordigen institution:', institutionId);
    
    if (institutionId) {
      // Direct connection to specific institution
      return await nordigenAPI.createRequisition(institutionId);
    } else {
      // Get institutions first
      const institutions = await nordigenAPI.getInstitutions('GB');
      return institutions;
    }
  },

  // Connect to specific bank directly
  connectBankDirect: async (institutionId: string) => {
    console.log('🏦 Connecting directly to institution:', institutionId);
    return await nordigenAPI.createRequisition(institutionId, `expenzez_${Date.now()}`);
  },

  // Reconnect bank (same as connect)
  reconnectBank: async (institutionId: string) => {
    console.log('🏦 Reconnecting bank with institution:', institutionId);
    return await nordigenAPI.createRequisition(institutionId, `expenzez_reconnect_${Date.now()}`);
  },

  // Get connected banks for the authenticated user
  getConnectedBanks: async () => {
    console.log('🏦 Getting connected banks via Nordigen');
    return await nordigenAPI.getAccounts();
  },

  // Handle bank callback after user consent
  handleCallback: async (requisitionId: string) => {
    console.log('🏦 Handling Nordigen callback for requisition:', requisitionId);
    return await nordigenAPI.handleCallback(requisitionId);
  },

  // Get available institutions (banks/providers)
  getInstitutions: async (country: string = 'GB') => {
    console.log('🏦 Getting institutions for country:', country);
    return await nordigenAPI.getInstitutions(country);
  },

  // Get connected accounts (unified method)
  getAccounts: async () => {
    const cacheKey = 'nordigen_accounts';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await nordigenAPI.getAccounts();
    
    if (response.success) {
      // Transform to legacy format for backward compatibility
      const accountsData = {
        accounts: response.data.accounts.map((account: any) => ({
          id: account.account_id,
          name: account.name || account.official_name,
          institutionId: 'nordigen',
          currency: account.balances.iso_currency_code || 'EUR',
          type: account.type || 'current',
          status: account.status || 'connected',
          iban: account.mask || '****',
          createdAt: account.connectedAt
        }))
      };
      
      // Cache for 2 minutes
      setCachedData(cacheKey, accountsData, 2 * 60 * 1000);
      return accountsData;
    }
    
    return { accounts: [] };
  },

  // Get all user transactions
  getAllTransactions: async (limit?: number, startKey?: any) => {
    const cacheKey = `nordigen_transactions_${limit || 'all'}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await nordigenAPI.getTransactions({ limit });
    
    if (response.success) {
      // Cache for 3 minutes
      setCachedData(cacheKey, response.data, 3 * 60 * 1000);
      return response.data;
    }
    
    return { transactions: [] };
  },

  // Get account transactions
  getTransactions: async (accountId: string, limit?: number) => {
    console.log('🏦 Getting transactions for account:', accountId);
    const response = await nordigenAPI.getTransactions({ 
      account_id: accountId, 
      limit 
    });
    return response.data;
  },

  // Get account balance (from account data)
  getBalance: async (accountId: string) => {
    const accounts = await nordigenAPI.getAccounts();
    if (accounts.success) {
      const account = accounts.data.accounts.find((acc: any) => acc.account_id === accountId);
      if (account) {
        return {
          balance: account.balances.current,
          currency: account.balances.iso_currency_code
        };
      }
    }
    return { balance: 0, currency: 'EUR' };
  },

  // Refresh transactions manually
  refreshTransactions: async () => {
    console.log('🏦 Refreshing Nordigen transactions');
    return await nordigenAPI.syncTransactions();
  },

  // Get cached bank data (fallback)
  getCachedBankData: async () => {
    try {
      // Just return connected banks as cached data
      return await nordigenAPI.getAccounts();
    } catch (error: any) {
      console.error("[API] Failed to get cached bank data:", error);
      return { success: false, data: { accounts: [] } };
    }
  },

  // Refresh account balances
  refreshBalances: async () => {
    try {
      // Trigger a fresh fetch of accounts which includes balances
      const response = await nordigenAPI.getAccounts();
      return { 
        message: "Balance refresh completed", 
        success: response.success,
        data: response.data 
      };
    } catch (error: any) {
      console.error("[API] Failed to refresh balances:", error);
      throw error;
    }
  },

  // Check if bank connections need to be refreshed
  checkBankConnectionStatus: async () => {
    try {
      const response = await nordigenAPI.getAccounts();
      return {
        success: response.success,
        connectionsStatus: response.success ? 'active' : 'needs_refresh',
        data: response.data
      };
    } catch (error: any) {
      console.error("[API] Failed to check bank connection status:", error);
      return {
        success: false,
        connectionsStatus: 'error',
        error: error.message
      };
    }
  },

  // Remove bank connection (placeholder - Nordigen handles this differently)
  removeBank: async (accountId: string) => {
    console.log("[API] Note: Nordigen bank removal should be done through their interface");
    throw new Error("Bank removal should be done through the Nordigen/GoCardless interface. Please contact support.");
  },

  // Unified method to get accounts (Nordigen with fallback)
  getAccountsUnified: async () => {
    try {
      console.log("🏦 [Banking] Trying Nordigen accounts...");
      const response = await nordigenAPI.getAccounts();
      
      if (response.success && response.data.accounts.length > 0) {
        console.log("✅ [Banking] Using Nordigen accounts:", response.data.accounts.length);
        return {
          success: true,
          banks: response.data.accounts.map(account => ({
            accountId: account.account_id,
            bankName: account.official_name || account.name,
            accountType: account.type,
            accountNumber: account.account_id,
            balance: account.balances.current || 0,
            currency: account.balances.iso_currency_code || 'EUR',
            connectedAt: account.connectedAt || Date.now(),
            lastSyncAt: account.lastSyncAt || Date.now(),
            isActive: true,
            status: account.status || 'connected',
            provider: 'nordigen'
          }))
        };
      }
    } catch (error) {
      console.warn("⚠️ [Banking] Nordigen failed, falling back to existing banking endpoints:", error);
    }
    
    // Fallback to existing banking endpoint
    try {
      console.log("🏦 [Banking] Falling back to existing banking endpoint...");
      const fallbackResponse = await api.get("/banking/connected");
      
      if (fallbackResponse.data.success && fallbackResponse.data.banks?.length > 0) {
        console.log("✅ [Banking] Using fallback banking data:", fallbackResponse.data.banks.length);
        return {
          success: true,
          banks: fallbackResponse.data.banks
        };
      }
    } catch (fallbackError) {
      console.error("❌ [Banking] Fallback also failed:", fallbackError);
    }
    
    return {
      success: false,
      banks: []
    };
  },

  // Unified method to get transactions (Nordigen with fallback)
  getTransactionsUnified: async (params?: {
    start_date?: string;
    end_date?: string;
    account_id?: string;
    limit?: number;
  }) => {
    try {
      console.log("🏦 [Banking] Trying Nordigen transactions...");
      const response = await nordigenAPI.getTransactions(params);
      
      if (response.success && response.data.transactions.length > 0) {
        console.log("✅ [Banking] Using Nordigen transactions:", response.data.transactions.length);
        return {
          success: true,
          transactions: response.data.transactions.map(tx => ({
            transactionId: tx.transaction_id,
            accountId: tx.account_id,
            amount: Math.abs(tx.amount),
            currency: tx.iso_currency_code,
            description: tx.name,
            category: tx.category?.[0] || 'Other',
            date: tx.date,
            type: tx.amount > 0 ? 'credit' : 'debit',
            merchant: tx.merchant_name,
            provider: 'nordigen'
          }))
        };
      }
    } catch (error) {
      console.warn("⚠️ [Banking] Nordigen transactions failed, falling back to existing endpoint:", error);
    }
    
    // Fallback to existing transactions endpoint
    try {
      console.log("🏦 [Banking] Falling back to existing transactions endpoint...");
      const fallbackParams = new URLSearchParams();
      if (params?.limit) fallbackParams.append('limit', params.limit.toString());
      
      const fallbackResponse = await api.get(`/banking/transactions?${fallbackParams.toString()}`);
      
      if (fallbackResponse.data.transactions?.length > 0) {
        console.log("✅ [Banking] Using fallback transaction data:", fallbackResponse.data.transactions.length);
        return {
          success: true,
          transactions: fallbackResponse.data.transactions
        };
      }
    } catch (fallbackError) {
      console.error("❌ [Banking] Transaction fallback also failed:", fallbackError);
    }
    
    return {
      success: false,
      transactions: []
    };
  }
};