import { api } from '../config/apiClient';

export interface BudgetPreferences {
  monthlyBudget: number;
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
  getBudgetPreferences: async (): Promise<BudgetPreferences> => {
    const response = await api.get('/profile/budget-preferences');
    return response.data.budgetPreferences;
  },

  updateBudgetPreferences: async (preferences: Partial<BudgetPreferences>): Promise<BudgetPreferences> => {
    const response = await api.put('/profile/budget-preferences', preferences);
    return response.data.budgetPreferences;
  },
};