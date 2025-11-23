import { api } from "../config/apiClient";
import {
  getCachedData,
  setCachedData,
  clearCachedData,
} from "../config/apiCache";

type CreditBureau = 'TransUnion' | 'Experian' | 'Equifax';

export interface CreditScoreEntry {
  bureau: CreditBureau;
  score: number;
  date: string;
  monthYear: string;
  rating?: string;
  change?: number | null;
  previousScore?: number | null;
}

export interface BureauHistory {
  bureau: CreditBureau;
  scores: CreditScoreEntry[];
  latestScore?: CreditScoreEntry;
}

export interface CreditCard {
  cardId: string;
  userId: string;
  cardName: string;
  lastFourDigits?: string;
  currentBalance: number;
  creditLimit: number;
  utilizationPercentage: number;
  interestRate?: number;
  dueDate?: number;
  minimumPayment?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  debtId: string;
  userId: string;
  debtName: string;
  debtType: 'Personal Loan' | 'Student Loan' | 'Mortgage' | 'Car Loan' | 'Other';
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  paymentProgress: number;
  dueDate?: number;
  lenderName?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditHealthSummary {
  healthScore: number;
  healthStatus: string;
  creditScores: BureauHistory[];
  creditUtilization: {
    percentage: number;
    totalBalance: number;
    totalLimit: number;
    cardsCount: number;
  };
  debt: {
    totalAmount: number;
    monthlyPayments: number;
    debtsCount: number;
  };
  recommendations: string[];
}

export interface CreditInsightResponse {
  insight: string;
  expandedInsight?: string;
  priority: "high" | "medium" | "low";
  recommendations: string[];
  factors: {
    name: string;
    status: "good" | "fair" | "poor";
    impact: string;
  }[];
  cached?: boolean;
}

export const creditAPI = {
  // ==================== Credit Scores ====================

  /**
   * Get credit score history for all bureaus
   */
  getCreditScores: async (): Promise<{ bureaus: BureauHistory[] }> => {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.sub || user?.id || "default";

    const cacheKey = `credit_scores_${userId}`;
    const cached = await getCachedData(cacheKey);

    if (cached) {
      console.log(`✅ [CreditAPI] Using cached credit scores for user: ${userId}`);
      return cached;
    }

    console.log(`📥 [CreditAPI] Fetching credit scores for user: ${userId}`);
    try {
      const response = await api.get("/profile/credit-score");
      console.log(`✅ [CreditAPI] Credit scores fetched successfully`);

      // Cache for 1 hour
      setCachedData(cacheKey, response.data, 60 * 60 * 1000);
      return response.data;
    } catch (error) {
      console.error(`❌ [CreditAPI] Error fetching credit scores:`, error);
      throw error;
    }
  },

  /**
   * Save credit scores (one or multiple)
   */
  saveCreditScores: async (scores: CreditScoreEntry[]): Promise<{ scores: CreditScoreEntry[] }> => {
    console.log(`📤 [CreditAPI] Saving ${scores.length} credit score(s)`);
    try {
      const response = await api.put("/profile/credit-score", { scores });
      console.log(`✅ [CreditAPI] Credit scores saved successfully`);

      // Clear cache to force refresh
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const userStr = await AsyncStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.sub || user?.id || "default";
      await clearCachedData(`credit_scores_${userId}`);

      return response.data;
    } catch (error) {
      console.error(`❌ [CreditAPI] Error saving credit scores:`, error);
      throw error;
    }
  },

  // ==================== Credit Cards ====================

  /**
   * Get all credit cards with utilization summary
   */
  getCreditCards: async (): Promise<{ cards: CreditCard[]; summary: any }> => {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.sub || user?.id || "default";

    const cacheKey = `credit_cards_${userId}`;
    const cached = await getCachedData(cacheKey);

    if (cached) {
      console.log(`✅ [CreditAPI] Using cached credit cards for user: ${userId}`);
      return cached;
    }

    console.log(`📥 [CreditAPI] Fetching credit cards for user: ${userId}`);
    try {
      const response = await api.get("/credit/cards");
      console.log(`✅ [CreditAPI] Credit cards fetched successfully`);

      // Cache for 30 minutes
      setCachedData(cacheKey, response.data, 30 * 60 * 1000);
      return response.data;
    } catch (error) {
      console.error(`❌ [CreditAPI] Error fetching credit cards:`, error);
      throw error;
    }
  },

  /**
   * Add or update a credit card
   */
  saveCreditCard: async (card: {
    cardId?: string;
    cardName: string;
    lastFourDigits?: string;
    currentBalance: number;
    creditLimit: number;
    interestRate?: number;
    dueDate?: number;
    minimumPayment?: number;
  }): Promise<{ card: CreditCard }> => {
    console.log(`📤 [CreditAPI] Saving credit card: ${card.cardName}`);
    try {
      const response = await api.post("/credit/card", card);
      console.log(`✅ [CreditAPI] Credit card saved successfully`);

      // Clear cache
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const userStr = await AsyncStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.sub || user?.id || "default";
      await clearCachedData(`credit_cards_${userId}`);
      await clearCachedData(`credit_health_${userId}`);

      return response.data;
    } catch (error) {
      console.error(`❌ [CreditAPI] Error saving credit card:`, error);
      throw error;
    }
  },

  // ==================== Debts ====================

  /**
   * Get all debts with payment summary
   */
  getDebts: async (): Promise<{ debts: Debt[]; summary: any }> => {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.sub || user?.id || "default";

    const cacheKey = `debts_${userId}`;
    const cached = await getCachedData(cacheKey);

    if (cached) {
      console.log(`✅ [CreditAPI] Using cached debts for user: ${userId}`);
      return cached;
    }

    console.log(`📥 [CreditAPI] Fetching debts for user: ${userId}`);
    try {
      const response = await api.get("/credit/debts");
      console.log(`✅ [CreditAPI] Debts fetched successfully`);

      // Cache for 30 minutes
      setCachedData(cacheKey, response.data, 30 * 60 * 1000);
      return response.data;
    } catch (error) {
      console.error(`❌ [CreditAPI] Error fetching debts:`, error);
      throw error;
    }
  },

  /**
   * Add or update a debt
   */
  saveDebt: async (debt: {
    debtId?: string;
    debtName: string;
    debtType: 'Personal Loan' | 'Student Loan' | 'Mortgage' | 'Car Loan' | 'Other';
    totalAmount: number;
    remainingAmount: number;
    interestRate: number;
    monthlyPayment: number;
    dueDate?: number;
    lenderName?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ debt: Debt }> => {
    console.log(`📤 [CreditAPI] Saving debt: ${debt.debtName}`);
    try {
      const response = await api.post("/credit/debt", debt);
      console.log(`✅ [CreditAPI] Debt saved successfully`);

      // Clear cache
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const userStr = await AsyncStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.sub || user?.id || "default";
      await clearCachedData(`debts_${userId}`);
      await clearCachedData(`credit_health_${userId}`);

      return response.data;
    } catch (error) {
      console.error(`❌ [CreditAPI] Error saving debt:`, error);
      throw error;
    }
  },

  // ==================== Credit Health ====================

  /**
   * Get comprehensive credit health summary
   */
  getCreditHealthSummary: async (): Promise<{ summary: CreditHealthSummary }> => {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.sub || user?.id || "default";

    const cacheKey = `credit_health_${userId}`;
    const cached = await getCachedData(cacheKey);

    if (cached) {
      console.log(`✅ [CreditAPI] Using cached credit health for user: ${userId}`);
      return cached;
    }

    console.log(`📥 [CreditAPI] Fetching credit health summary for user: ${userId}`);
    try {
      const response = await api.get("/credit/health");
      console.log(`✅ [CreditAPI] Credit health summary fetched successfully`);

      // Cache for 1 hour
      setCachedData(cacheKey, response.data, 60 * 60 * 1000);
      return response.data;
    } catch (error) {
      console.error(`❌ [CreditAPI] Error fetching credit health summary:`, error);
      throw error;
    }
  },

  // ==================== AI Credit Insights ====================

  /**
   * Get AI-powered credit insights and recommendations
   */
  getCreditInsight: async (): Promise<CreditInsightResponse> => {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.sub || user?.id || "default";

    const cacheKey = `credit_insight_${userId}`;
    const cached = await getCachedData(cacheKey);

    if (cached) {
      console.log(`✅ [CreditAPI] Using cached credit insight for user: ${userId}`);
      return { ...cached, cached: true };
    }

    console.log(`📥 [CreditAPI] Requesting AI credit insight for user: ${userId}`);
    try {
      const response = await api.post("/ai/credit-insight", {});
      console.log(`✅ [CreditAPI] AI credit insight generated successfully`);

      // Cache for 24 hours
      setCachedData(cacheKey, response.data, 24 * 60 * 60 * 1000);
      return response.data;
    } catch (error) {
      console.error(`❌ [CreditAPI] Error getting credit insight:`, error);
      throw error;
    }
  },

  /**
   * Clear all credit-related caches
   */
  clearAllCreditCache: async () => {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const userStr = await AsyncStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.sub || user?.id || "default";

    await Promise.all([
      clearCachedData(`credit_scores_${userId}`),
      clearCachedData(`credit_cards_${userId}`),
      clearCachedData(`debts_${userId}`),
      clearCachedData(`credit_health_${userId}`),
      clearCachedData(`credit_insight_${userId}`),
    ]);

    console.log(`🗑️ [CreditAPI] All credit cache cleared for user: ${userId}`);
  },
};
