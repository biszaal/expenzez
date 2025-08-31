import { api } from "../config/apiClient";
import { getCachedData, setCachedData, clearCachedData } from "../config/apiCache";

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
    setCachedData(cacheKey, response.data, 3 * 60 * 1000);
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
    setCachedData(cacheKey, response.data, 5 * 60 * 1000);
    return response.data;
  },
};