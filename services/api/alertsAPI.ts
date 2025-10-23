/**
 * Proactive Alerts API - Phase 2B
 *
 * API methods for managing proactive alerts and preferences
 */

import { api } from "../config/apiClient";

export type AlertType =
  | "BUDGET_WARNING_80"
  | "BUDGET_WARNING_90"
  | "BUDGET_EXCEEDED"
  | "GOAL_MILESTONE_25"
  | "GOAL_MILESTONE_50"
  | "GOAL_MILESTONE_75"
  | "GOAL_ACHIEVED"
  | "SUBSCRIPTION_RENEWAL"
  | "SPENDING_ANOMALY"
  | "SAVINGS_OPPORTUNITY";

export type AlertPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ProactiveAlert {
  alertId: string;
  userId: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  actionable: boolean;
  actionText?: string;
  actionRoute?: string;
  metadata?: {
    budgetId?: string;
    goalId?: string;
    transactionId?: string;
    subscriptionId?: string;
    percentage?: number;
    amount?: number;
    remaining?: number;
  };
  status: "PENDING" | "ACKNOWLEDGED" | "DISMISSED";
  createdAt: string;
  expiresAt: number;
}

export interface AlertPreferences {
  userId: string;
  enableBudgetAlerts: boolean;
  enableGoalAlerts: boolean;
  enableSubscriptionAlerts: boolean;
  enableSpendingAnomalyAlerts: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "08:00"
  maxAlertsPerDay: number;
  updatedAt: string;
}

export interface PendingAlertsResponse {
  alerts: ProactiveAlert[];
  totalCount: number;
  unacknowledgedCount: number;
}

export const alertsAPI = {
  /**
   * Get pending alerts for the current user
   */
  async getPendingAlerts(): Promise<PendingAlertsResponse> {
    try {
      console.log("📢 [AlertsAPI] Fetching pending alerts");

      const response = await api.get("/alerts/pending");

      console.log("✅ [AlertsAPI] Successfully fetched alerts:", {
        totalCount: response.data.totalCount,
        unacknowledgedCount: response.data.unacknowledgedCount,
      });

      return response.data;
    } catch (error: any) {
      // Return empty state if no alerts exist (404 is expected)
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        console.log("📢 [AlertsAPI] No pending alerts found (this is normal)");
        return {
          alerts: [],
          totalCount: 0,
          unacknowledgedCount: 0,
        };
      }

      console.error("❌ [AlertsAPI] Error fetching pending alerts:", error);

      // Return empty state on other errors
      return {
        alerts: [],
        totalCount: 0,
        unacknowledgedCount: 0,
      };
    }
  },

  /**
   * Acknowledge an alert (mark as viewed)
   */
  async acknowledgeAlert(alertId: string): Promise<ProactiveAlert> {
    try {
      console.log(`📢 [AlertsAPI] Acknowledging alert: ${alertId}`);

      const response = await api.post(`/alerts/${alertId}/acknowledge`);

      console.log("✅ [AlertsAPI] Alert acknowledged successfully");

      return response.data.alert;
    } catch (error: any) {
      console.error("❌ [AlertsAPI] Error acknowledging alert:", error);
      throw error;
    }
  },

  /**
   * Dismiss an alert (remove from view)
   */
  async dismissAlert(alertId: string): Promise<void> {
    try {
      console.log(`📢 [AlertsAPI] Dismissing alert: ${alertId}`);

      await api.post(`/alerts/${alertId}/dismiss`);

      console.log("✅ [AlertsAPI] Alert dismissed successfully");
    } catch (error: any) {
      console.error("❌ [AlertsAPI] Error dismissing alert:", error);
      throw error;
    }
  },

  /**
   * Get user's alert preferences
   */
  async getAlertPreferences(): Promise<AlertPreferences> {
    try {
      console.log("📢 [AlertsAPI] Fetching alert preferences");

      const response = await api.get("/alerts/preferences");

      console.log("✅ [AlertsAPI] Successfully fetched alert preferences");

      return response.data;
    } catch (error: any) {
      console.error("❌ [AlertsAPI] Error fetching alert preferences:", error);

      // Return default preferences on error
      return {
        userId: "",
        enableBudgetAlerts: true,
        enableGoalAlerts: true,
        enableSubscriptionAlerts: true,
        enableSpendingAnomalyAlerts: true,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        maxAlertsPerDay: 5,
        updatedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Update user's alert preferences
   */
  async updateAlertPreferences(
    preferences: Partial<AlertPreferences>
  ): Promise<AlertPreferences> {
    try {
      console.log("📢 [AlertsAPI] Updating alert preferences:", preferences);

      const response = await api.put("/alerts/preferences", preferences);

      console.log("✅ [AlertsAPI] Alert preferences updated successfully");

      return response.data;
    } catch (error: any) {
      console.error("❌ [AlertsAPI] Error updating alert preferences:", error);
      throw error;
    }
  },

  /**
   * Get alert icon based on type
   */
  getAlertIcon(type: AlertType): string {
    switch (type) {
      case "BUDGET_EXCEEDED":
        return "🚨";
      case "BUDGET_WARNING_90":
        return "⚠️";
      case "BUDGET_WARNING_80":
        return "📊";
      case "GOAL_ACHIEVED":
        return "🎉";
      case "GOAL_MILESTONE_75":
      case "GOAL_MILESTONE_50":
      case "GOAL_MILESTONE_25":
        return "🎯";
      case "SUBSCRIPTION_RENEWAL":
        return "💳";
      case "SPENDING_ANOMALY":
        return "🔍";
      case "SAVINGS_OPPORTUNITY":
        return "💰";
      default:
        return "📢";
    }
  },

  /**
   * Get alert color based on priority
   */
  getAlertColor(priority: AlertPriority): string {
    switch (priority) {
      case "URGENT":
        return "#EF4444"; // Red
      case "HIGH":
        return "#F59E0B"; // Amber
      case "MEDIUM":
        return "#3B82F6"; // Blue
      case "LOW":
        return "#10B981"; // Green
      default:
        return "#6B7280"; // Gray
    }
  },

  /**
   * Get alert priority label
   */
  getAlertPriorityLabel(priority: AlertPriority): string {
    switch (priority) {
      case "URGENT":
        return "Urgent";
      case "HIGH":
        return "High Priority";
      case "MEDIUM":
        return "Medium Priority";
      case "LOW":
        return "Low Priority";
      default:
        return "Info";
    }
  },
};
