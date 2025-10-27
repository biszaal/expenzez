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
    const cached = await getCachedData(cacheKey);
    console.log(`🔍 [ProfileAPI] Cache check for ${cacheKey}:`, { cached: !!cached, userId });
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
    city?: string;
    postcode?: string;
    dateOfBirth?: string;
    gender?: string;
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

  // Get goals with caching - now uses goalsAPI for better fallback support
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

    try {
      console.log("[ProfileAPI] Fetching goals from API...");
      // Try the main /goals endpoint first
      const response = await api.get("/goals");

      if (response && response.data) {
        // Handle both new format (activeGoals/completedGoals) and old format (savingsGoals)
        let goalsData = response.data;

        // If we got the old format with savingsGoals, convert to new format
        if (goalsData.savingsGoals && !goalsData.activeGoals) {
          console.log("[ProfileAPI] Converting legacy savingsGoals format...");
          const allGoals = goalsData.savingsGoals || [];
          goalsData = {
            activeGoals: allGoals.filter((g: any) => !g.isCompleted),
            completedGoals: allGoals.filter((g: any) => g.isCompleted),
            goalProgress: allGoals.map((g: any) => ({
              goalId: g.id || g.goalId,
              progressPercentage: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
              amountRemaining: Math.max(g.targetAmount - g.currentAmount, 0),
              daysRemaining: g.targetDate ? Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
              isOnTrack: true
            })),
            totalSavedTowardsGoals: allGoals.reduce((sum: number, g: any) => sum + (g.currentAmount || 0), 0),
            totalGoalAmount: allGoals.reduce((sum: number, g: any) => sum + (g.targetAmount || 0), 0),
            averageMonthlyProgress: 0,
            recommendations: [],
            motivationalMessage: "Great progress! Keep building towards your financial goals!",
            lastUpdated: new Date().toISOString()
          };
        }

        console.log("[ProfileAPI] Successfully fetched goals:", {
          activeGoals: goalsData.activeGoals?.length || 0,
          completedGoals: goalsData.completedGoals?.length || 0
        });

        // Cache for 5 minutes
        setCachedData(cacheKey, goalsData, 5 * 60 * 1000);
        return goalsData;
      } else {
        console.warn("[ProfileAPI] Goals API returned empty response, using fallback");
        return { activeGoals: [], completedGoals: [], goalProgress: [] };
      }
    } catch (error: any) {
      console.error("[ProfileAPI] Error fetching goals:", error);

      // Fallback data structure for when API fails
      const fallbackData = {
        activeGoals: [],
        completedGoals: [],
        goalProgress: [],
        totalSavedTowardsGoals: 0,
        totalGoalAmount: 0,
        averageMonthlyProgress: 0,
        recommendations: [],
        motivationalMessage: "Start setting financial goals to track your savings journey!",
        lastUpdated: new Date().toISOString()
      };

      setCachedData(cacheKey, fallbackData, 5 * 60 * 1000);
      return fallbackData;
    }
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
