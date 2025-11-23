import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChartInsightResponse } from './api/chartInsightsAPI';

const INSIGHT_PREFIX = 'ai_insight_';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface PersistedInsight {
  data: ChartInsightResponse;
  fetchedAt: number;
  expiresAt: number;
}

export type InsightType =
  | 'home_balance'
  | 'spending_chart'
  | 'spending_budget'
  | 'trends'
  | 'categories'
  | `budget_${string}`; // For individual budgets with ID

/**
 * AI Insight Persistence Service
 * Manages 24-hour caching and rate limiting of AI insights
 */
export class AIInsightPersistenceService {
  /**
   * Get storage key for a specific insight type
   */
  private getKey(userId: string, insightType: InsightType): string {
    return `${INSIGHT_PREFIX}${userId}_${insightType}`;
  }

  /**
   * Save an AI insight with 24-hour expiration
   */
  async saveInsight(
    userId: string,
    insightType: InsightType,
    insight: ChartInsightResponse
  ): Promise<void> {
    try {
      const now = Date.now();
      const persisted: PersistedInsight = {
        data: insight,
        fetchedAt: now,
        expiresAt: now + TWENTY_FOUR_HOURS,
      };

      const key = this.getKey(userId, insightType);
      await AsyncStorage.setItem(key, JSON.stringify(persisted));

      console.log(`[AIInsight] Saved ${insightType} insight, expires in 24h`);
    } catch (error) {
      console.error('[AIInsight] Error saving insight:', error);
    }
  }

  /**
   * Get a cached AI insight if it exists and hasn't expired
   */
  async getInsight(
    userId: string,
    insightType: InsightType
  ): Promise<PersistedInsight | null> {
    try {
      const key = this.getKey(userId, insightType);
      const stored = await AsyncStorage.getItem(key);

      if (!stored) {
        return null;
      }

      const persisted: PersistedInsight = JSON.parse(stored);
      const now = Date.now();

      // Check if expired
      if (now > persisted.expiresAt) {
        console.log(`[AIInsight] ${insightType} insight expired, removing`);
        await this.clearInsight(userId, insightType);
        return null;
      }

      const hoursRemaining = Math.round((persisted.expiresAt - now) / (1000 * 60 * 60));
      console.log(`[AIInsight] ${insightType} insight still valid, ${hoursRemaining}h remaining`);

      return persisted;
    } catch (error) {
      console.error('[AIInsight] Error getting insight:', error);
      return null;
    }
  }

  /**
   * Check if user can request a new insight (24h has passed)
   */
  async canRequestInsight(
    userId: string,
    insightType: InsightType
  ): Promise<boolean> {
    const cached = await this.getInsight(userId, insightType);
    return cached === null; // Can request if no valid cached insight exists
  }

  /**
   * Get time remaining until user can request again (in milliseconds)
   */
  async getTimeUntilAvailable(
    userId: string,
    insightType: InsightType
  ): Promise<number> {
    const cached = await this.getInsight(userId, insightType);
    if (!cached) {
      return 0; // Available now
    }

    const now = Date.now();
    const remaining = cached.expiresAt - now;
    return Math.max(0, remaining);
  }

  /**
   * Clear a specific insight
   */
  async clearInsight(userId: string, insightType: InsightType): Promise<void> {
    try {
      const key = this.getKey(userId, insightType);
      await AsyncStorage.removeItem(key);
      console.log(`[AIInsight] Cleared ${insightType} insight`);
    } catch (error) {
      console.error('[AIInsight] Error clearing insight:', error);
    }
  }

  /**
   * Clear all insights for a user (useful for logout)
   */
  async clearAllInsights(userId: string): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userInsightKeys = allKeys.filter(key =>
        key.startsWith(`${INSIGHT_PREFIX}${userId}_`)
      );

      await AsyncStorage.multiRemove(userInsightKeys);
      console.log(`[AIInsight] Cleared all insights for user ${userId}`);
    } catch (error) {
      console.error('[AIInsight] Error clearing all insights:', error);
    }
  }

  /**
   * Format time remaining as human-readable string
   */
  formatTimeRemaining(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

// Export singleton instance
export const aiInsightPersistence = new AIInsightPersistenceService();
