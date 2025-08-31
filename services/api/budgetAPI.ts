import { api } from "../config/apiClient";
import { getCachedData, setCachedData, clearCachedData } from "../config/apiCache";

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
    setCachedData(cacheKey, response.data, 5 * 60 * 1000);
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
    setCachedData(cacheKey, response.data, 2 * 60 * 1000);
    return response.data;
  },
};