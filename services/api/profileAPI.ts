import { api } from "../config/apiClient";
import {
  getCachedData,
  setCachedData,
  clearCachedData,
} from "../config/apiCache";

export const profileAPI = {
  // Get user profile with caching
  getProfile: async () => {
    // 🚨 CRITICAL: Get user ID from AsyncStorage to create user-specific cache key
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId =
      user?.sub || user?.id || user?.email || user?.username || "default";

    const cacheKey = `user_profile_${userId}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`✅ [ProfileAPI] Using cached profile for user: ${userId}`);
      return cached;
    }

    console.log(`📥 [ProfileAPI] Fetching fresh profile for user: ${userId}`);
    try {
      const response = await api.get("/profile");
      console.log(`📥 [ProfileAPI] API response status: ${response.status}`);
      console.log(
        `📥 [ProfileAPI] API response data:`,
        JSON.stringify(response.data, null, 2)
      );

      // Cache for 5 minutes since profile data changes infrequently
      setCachedData(cacheKey, response.data, 5 * 60 * 1000);
      return response.data;
    } catch (error) {
      console.error(`❌ [ProfileAPI] Error fetching profile:`, error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    occupation?: string;
    company?: string;
  }) => {
    const response = await api.put("/profile", profileData);
    return response.data;
  },

  // Get credit score with caching
  getCreditScore: async () => {
    // 🚨 CRITICAL: User-specific cache key
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId =
      user?.sub || user?.id || user?.email || user?.username || "default";

    const cacheKey = `user_credit_score_${userId}`;
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
    // 🚨 CRITICAL: User-specific cache key
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId =
      user?.sub || user?.id || user?.email || user?.username || "default";

    const cacheKey = `user_goals_${userId}`;
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

    // Clear cache after creating (clear for current user)
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId =
      user?.sub || user?.id || user?.email || user?.username || "default";
    clearCachedData(`user_goals_${userId}`);
    return response.data;
  },

  // Update a savings goal
  updateGoal: async (goalId: string, updates: any) => {
    const response = await api.put(`/goals/${goalId}`, updates);

    // Clear cache after updating (clear for current user)
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId =
      user?.sub || user?.id || user?.email || user?.username || "default";
    clearCachedData(`user_goals_${userId}`);
    return response.data;
  },

  // Delete a savings goal
  deleteGoal: async (goalId: string) => {
    const response = await api.delete(`/goals/${goalId}`);

    // Clear cache after deleting (clear for current user)
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId =
      user?.sub || user?.id || user?.email || user?.username || "default";
    clearCachedData(`user_goals_${userId}`);
    return response.data;
  },
};
