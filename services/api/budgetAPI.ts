import { api } from '../config/apiClient';
import { cachedApiCall, clearCachedData, getCacheUserId, CACHE_TTL } from '../config/apiCache';

export interface BudgetPreferences {
  monthlyBudget: number;
  monthlySpendingLimit: number;
  categoryBudgets: {
    [categoryName: string]: number;
  };
  alertThreshold: number;
  currency: string;
}

export interface BudgetPreferencesResponse {
  message: string;
  budgetPreferences: BudgetPreferences;
}

export const budgetAPI = {
  // Cached per-user (5 min) — refetched on every spending-tab load today, but it
  // only changes when the user edits their budget (which invalidates below).
  getBudgetPreferences: async (): Promise<BudgetPreferences> => {
    const userId = await getCacheUserId();
    return cachedApiCall(
      `budget_prefs_${userId}`,
      async () => {
        const response = await api.get('/profile/budget-preferences');
        return response.data.budgetPreferences;
      },
      CACHE_TTL.MEDIUM
    );
  },

  updateBudgetPreferences: async (preferences: Partial<BudgetPreferences>): Promise<BudgetPreferences> => {
    const response = await api.put('/profile/budget-preferences', preferences);
    // Drop the cached prefs so the new budget shows immediately.
    const userId = await getCacheUserId();
    await clearCachedData(`budget_prefs_${userId}`);
    return response.data.budgetPreferences;
  },

  // Get user budgets
  getBudgets: async (userId?: string): Promise<{ budgets: any[]; summary?: any }> => {
    try {
      const response = await api.get('/budgets');
      return {
        budgets: response.data.budgets || [],
        summary: response.data.summary || {}
      };
    } catch (error) {
      console.warn('getBudgets not implemented in backend, returning empty array');
      return { budgets: [] };
    }
  },

  // Get budget alerts
  getBudgetAlerts: async (userId?: string): Promise<{ alerts: any[] }> => {
    try {
      const response = await api.get('/budgets/alerts');
      return { alerts: response.data.alerts || [] };
    } catch (error) {
      console.warn('getBudgetAlerts not implemented in backend, returning empty array');
      return { alerts: [] };
    }
  },

  // Delete budget
  deleteBudget: async (budgetId: string): Promise<boolean> => {
    try {
      const response = await api.delete(`/budgets/${budgetId}`);
      return response.data.success || true;
    } catch (error) {
      console.warn('deleteBudget not implemented in backend, returning true');
      return true;
    }
  },
};