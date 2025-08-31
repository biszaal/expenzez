import { api } from "../config/apiClient";
import { getCachedData, setCachedData, clearCachedData } from "../config/apiCache";

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
    setCachedData(cacheKey, response.data, 5 * 60 * 1000);
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
    setCachedData(cacheKey, response.data, 10 * 60 * 1000);
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
    setCachedData(cacheKey, response.data, 5 * 60 * 1000);
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