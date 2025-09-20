// Enhanced API service for manual input mode
import { transactionAPI } from './api/transactionAPI';
import { expenseAPI, budgetAPI, profileAPI } from './api';

// 📱 MANUAL INPUT MODE: Simplified API service without banking dependencies

export const enhancedApi = {
  // Get manual transactions with caching
  getTransactions: async (options: { limit?: number; useCache?: boolean } = {}) => {
    try {
      const { limit = 100 } = options;
      const response = await transactionAPI.getTransactions({ limit });
      return {
        success: true,
        data: response.transactions || [],
        source: 'manual_transactions'
      };
    } catch (error) {
      console.error('Enhanced API: Error fetching manual transactions:', error);
      return {
        success: false,
        data: [],
        error: 'Failed to fetch transactions'
      };
    }
  },

  // Get financial overview from manual data
  getFinancialOverview: async () => {
    try {
      const transactionsResponse = await transactionAPI.getTransactions({ limit: 1000 });
      const transactions = transactionsResponse.transactions || [];

      // Calculate balance from transactions
      const totalBalance = transactions.reduce((sum: number, tx: any) => {
        const amount = parseFloat(tx.amount) || 0;
        return sum + amount;
      }, 0);

      // Calculate monthly spending
      const currentMonth = new Date().toISOString().substring(0, 7);
      const monthlySpending = transactions
        .filter((tx: any) => tx.date?.startsWith(currentMonth) && (tx.type === 'debit' || tx.amount < 0))
        .reduce((sum: number, tx: any) => sum + Math.abs(parseFloat(tx.amount) || 0), 0);

      return {
        success: true,
        overview: {
          totalBalance,
          monthlySpending,
          transactionCount: transactions.length,
          accountType: 'Manual Entry'
        }
      };
    } catch (error) {
      console.error('Enhanced API: Error getting financial overview:', error);
      return {
        success: false,
        overview: {
          totalBalance: 0,
          monthlySpending: 0,
          transactionCount: 0,
          accountType: 'Manual Entry'
        }
      };
    }
  },

  // Expense tracking functions remain the same
  getExpenses: async (options: { limit?: number } = {}) => {
    try {
      const { limit = 100 } = options;
      const response = await expenseAPI.getExpenses({ limit });
      return {
        success: true,
        data: response.expenses || []
      };
    } catch (error) {
      console.error('Enhanced API: Error fetching expenses:', error);
      return {
        success: false,
        data: [],
        error: 'Failed to fetch expenses'
      };
    }
  },

  // Budget functions remain the same
  getBudgets: async () => {
    try {
      const response = await budgetAPI.getBudgets();
      return {
        success: true,
        data: response.budgets || []
      };
    } catch (error) {
      console.error('Enhanced API: Error fetching budgets:', error);
      return {
        success: false,
        data: [],
        error: 'Failed to fetch budgets'
      };
    }
  },

  // Profile functions remain the same
  getProfile: async () => {
    try {
      const response = await profileAPI.getProfile();
      return {
        success: true,
        data: response.profile || {}
      };
    } catch (error) {
      console.error('Enhanced API: Error fetching profile:', error);
      return {
        success: false,
        data: {},
        error: 'Failed to fetch profile'
      };
    }
  }
};

export default enhancedApi;