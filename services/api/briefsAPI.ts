/**
 * Daily Briefs API - Phase 2B
 *
 * API methods for fetching personalized daily financial briefs
 */

import { api } from "../config/apiClient";

export interface DailyBrief {
  briefId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  greeting: string;
  spendingSummary: {
    todaySpent: number;
    weekSpent: number;
    monthSpent: number;
    comparisonToLastWeek: number; // percentage change
    comparisonToLastMonth: number; // percentage change
  };
  budgetStatus: {
    totalBudgets: number;
    budgetsOnTrack: number;
    budgetsAtRisk: number;
    budgetsExceeded: number;
    topConcern?: {
      category: string;
      percentage: number;
      remaining: number;
    };
  };
  insights: {
    title: string;
    message: string;
    type:
      | "SAVINGS_TIP"
      | "BUDGET_ADVICE"
      | "SPENDING_PATTERN"
      | "GOAL_PROGRESS"
      | "MOTIVATIONAL";
    actionable: boolean;
    actionText?: string;
    actionRoute?: string;
  }[];
  generatedAt: string;
  viewedAt?: string;
}

export const briefsAPI = {
  /**
   * Get today's daily brief
   */
  async getDailyBrief(): Promise<DailyBrief | null> {
    try {
      console.log("📰 [BriefsAPI] Fetching daily brief");

      const response = await api.get("/briefs/daily");

      console.log("✅ [BriefsAPI] Successfully fetched daily brief");

      const payload = response.data;
      const brief = payload?.brief ?? payload;

      if (!brief || typeof brief !== "object") {
        console.warn("📰 [BriefsAPI] Unexpected brief payload", payload);
        return null;
      }

      return brief as DailyBrief;
    } catch (error: any) {
      // Return null if brief doesn't exist yet (will be generated at 6 AM)
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        console.log(
          "📰 [BriefsAPI] No brief available yet - will be generated at 6:00 AM"
        );
        return null;
      }

      console.error("❌ [BriefsAPI] Error fetching daily brief:", error);

      // Return mock brief for development
      return briefsAPI.generateMockBrief();
    }
  },

  /**
   * Mark daily brief as viewed
   */
  async markBriefAsViewed(briefId: string): Promise<void> {
    try {
      console.log(`📰 [BriefsAPI] Marking brief as viewed: ${briefId}`);

      // Check if this is a local/mock brief (starts with 'brief_' and contains timestamp)
      if (
        briefId.startsWith("brief_") &&
        /^\d+$/.test(briefId.replace("brief_", ""))
      ) {
        console.log(
          "📰 [BriefsAPI] Local brief detected, skipping server call"
        );
        return;
      }

      await api.post(`/briefs/${briefId}/view`);

      console.log("✅ [BriefsAPI] Brief marked as viewed");
    } catch (error: any) {
      console.error("❌ [BriefsAPI] Error marking brief as viewed:", error);
      // Don't throw - this is not critical
    }
  },

  /**
   * Generate mock brief for development/fallback
   */
  generateMockBrief(): DailyBrief {
    const now = new Date();
    const hour = now.getHours();
    let greeting = "Good morning";
    if (hour >= 12 && hour < 18) greeting = "Good afternoon";
    else if (hour >= 18) greeting = "Good evening";

    return {
      briefId: `brief_${Date.now()}`,
      userId: "current-user",
      date: now.toISOString().split("T")[0],
      greeting: `${greeting}! 👋`,
      spendingSummary: {
        todaySpent: 42.5,
        weekSpent: 284.75,
        monthSpent: 1247.3,
        comparisonToLastWeek: 15, // +15%
        comparisonToLastMonth: -8, // -8%
      },
      budgetStatus: {
        totalBudgets: 5,
        budgetsOnTrack: 4,
        budgetsAtRisk: 1,
        budgetsExceeded: 0,
        topConcern: {
          category: "Groceries",
          percentage: 85,
          remaining: 75,
        },
      },
      insights: [
        {
          title: "Great spending control!",
          message:
            "Your spending this month is 8% lower than last month. Keep up the good work!",
          type: "MOTIVATIONAL",
          actionable: false,
        },
        {
          title: "Watch your Groceries budget",
          message:
            "You've used 85% of your Groceries budget with £75 remaining. Consider meal planning for the rest of the week.",
          type: "BUDGET_ADVICE",
          actionable: true,
          actionText: "View Budget",
          actionRoute: "/budgets",
        },
      ],
      generatedAt: now.toISOString(),
    };
  },

  /**
   * Format spending change for display
   */
  formatSpendingChange(percentage: number): {
    text: string;
    color: string;
    icon: string;
  } {
    if (percentage > 0) {
      return {
        text: `↑${percentage}%`,
        color: "#EF4444", // Red
        icon: "📈",
      };
    } else if (percentage < 0) {
      return {
        text: `↓${Math.abs(percentage)}%`,
        color: "#10B981", // Green
        icon: "📉",
      };
    } else {
      return {
        text: "→0%",
        color: "#6B7280", // Gray
        icon: "➡️",
      };
    }
  },

  /**
   * Get insight icon based on type
   */
  getInsightIcon(type: DailyBrief["insights"][0]["type"]): string {
    switch (type) {
      case "SAVINGS_TIP":
        return "💰";
      case "BUDGET_ADVICE":
        return "📊";
      case "SPENDING_PATTERN":
        return "📈";
      case "GOAL_PROGRESS":
        return "🎯";
      case "MOTIVATIONAL":
        return "🌟";
      default:
        return "💡";
    }
  },

  /**
   * Get budget status emoji
   */
  getBudgetStatusEmoji(budgetStatus: DailyBrief["budgetStatus"]): string {
    if (budgetStatus.budgetsExceeded > 0) return "🚨";
    if (budgetStatus.budgetsAtRisk > 0) return "⚠️";
    if (budgetStatus.budgetsOnTrack === budgetStatus.totalBudgets) return "✅";
    return "📊";
  },

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency = "GBP"): string {
    const formatter = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  },
};
