/**
 * Analytics service for tracking user events and screen views
 * Uses Firebase Analytics (Google Analytics 4)
 *
 * Note: Firebase Analytics requires native modules which are not available
 * in Expo Go. This service gracefully handles missing modules and will
 * work in production builds.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

let analytics: any = null;
let isFirebaseAvailable = false;

// Try to import Firebase Analytics - will fail in Expo Go
try {
  analytics = require("@react-native-firebase/analytics").default;
  isFirebaseAvailable = true;
  console.log("✅ [Analytics] Firebase Analytics available");
} catch (error) {
  console.log("⚠️ [Analytics] Firebase not available (expected in Expo Go)");
  isFirebaseAvailable = false;
}

export type AnalyticsConsent = "granted" | "denied";

// Persisted consent decision. Native auto-collection is disabled by default
// (see firebase.json), so nothing is collected until the user opts in.
const CONSENT_KEY = "analytics_consent";

class AnalyticsService {
  // Off until the user explicitly consents (privacy by default / PECR).
  private enabled: boolean = false;

  /**
   * Check if analytics is available
   */
  isAvailable(): boolean {
    return isFirebaseAvailable && this.enabled;
  }

  /**
   * Enable/disable analytics collection. Toggles native collection regardless
   * of the current flag so opting out always takes effect.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (isFirebaseAvailable && analytics) {
      try {
        analytics().setAnalyticsCollectionEnabled(enabled);
      } catch (e) {
        console.log("[Analytics] setAnalyticsCollectionEnabled error:", e);
      }
    }
  }

  /**
   * Reads the stored consent decision. Returns null if the user hasn't decided.
   */
  async getConsent(): Promise<AnalyticsConsent | null> {
    try {
      const value = await AsyncStorage.getItem(CONSENT_KEY);
      return value === "granted" || value === "denied" ? value : null;
    } catch {
      return null;
    }
  }

  /**
   * Applies the stored consent decision on startup. With no stored decision,
   * analytics stays disabled (no tracking without consent).
   */
  async loadConsent(): Promise<AnalyticsConsent | null> {
    const consent = await this.getConsent();
    this.setEnabled(consent === "granted");
    return consent;
  }

  /**
   * Records the user's consent decision and applies it immediately.
   */
  async setConsent(consent: AnalyticsConsent) {
    try {
      await AsyncStorage.setItem(CONSENT_KEY, consent);
    } catch (e) {
      console.log("[Analytics] setConsent persist error:", e);
    }
    this.setEnabled(consent === "granted");
  }

  /**
   * Set user ID for cross-device tracking
   */
  async setUserId(userId: string | null) {
    if (!this.isAvailable()) return;
    try {
      await analytics().setUserId(userId);
    } catch (e) {
      console.log("[Analytics] setUserId error:", e);
    }
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: Record<string, string | null>) {
    if (!this.isAvailable()) return;
    try {
      for (const [key, value] of Object.entries(properties)) {
        await analytics().setUserProperty(key, value);
      }
    } catch (e) {
      console.log("[Analytics] setUserProperties error:", e);
    }
  }

  /**
   * Log screen view
   */
  async logScreenView(screenName: string, screenClass?: string) {
    if (!this.isAvailable()) return;
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (e) {
      console.log("[Analytics] logScreenView error:", e);
    }
  }

  /**
   * Log custom event
   */
  async logEvent(eventName: string, params?: Record<string, any>) {
    if (!this.isAvailable()) return;
    try {
      await analytics().logEvent(eventName, params);
    } catch (e) {
      console.log("[Analytics] logEvent error:", e);
    }
  }

  // ============ App Events ============

  async logAppOpen() {
    await this.logEvent("app_open");
  }

  async logLogin(method: string) {
    if (!this.isAvailable()) return;
    try {
      await analytics().logLogin({ method });
    } catch (e) {
      console.log("[Analytics] logLogin error:", e);
    }
  }

  async logSignUp(method: string) {
    if (!this.isAvailable()) return;
    try {
      await analytics().logSignUp({ method });
    } catch (e) {
      console.log("[Analytics] logSignUp error:", e);
    }
  }

  // ============ Transaction Events ============

  async logAddTransaction(params: {
    amount: number;
    category: string;
    type: "debit" | "credit";
  }) {
    await this.logEvent("add_transaction", {
      amount: params.amount,
      category: params.category,
      transaction_type: params.type,
    });
  }

  async logEditTransaction(transactionId: string) {
    await this.logEvent("edit_transaction", { transaction_id: transactionId });
  }

  async logDeleteTransaction(transactionId: string) {
    await this.logEvent("delete_transaction", {
      transaction_id: transactionId,
    });
  }

  async logCsvImport(count: number) {
    await this.logEvent("csv_import", { transaction_count: count });
  }

  // ============ Budget Events ============

  async logCreateBudget(params: { category: string; amount: number }) {
    await this.logEvent("create_budget", params);
  }

  async logBudgetAlert(params: { category: string; percentUsed: number }) {
    await this.logEvent("budget_alert", params);
  }

  // ============ AI Events ============

  async logAiChat(queryLength: number) {
    await this.logEvent("ai_chat", { query_length: queryLength });
  }

  async logAiInsight(insightType: string) {
    await this.logEvent("ai_insight_viewed", { insight_type: insightType });
  }

  // ============ Subscription Events ============

  async logSubscriptionView() {
    await this.logEvent("subscription_view");
  }

  async logSubscriptionStart(plan: string) {
    await this.logEvent("subscription_start", { plan });
  }

  // ============ Feature Usage ============

  async logFeatureUsed(featureName: string) {
    await this.logEvent("feature_used", { feature: featureName });
  }

  async logSearch(searchTerm: string) {
    if (!this.isAvailable()) return;
    try {
      await analytics().logSearch({ search_term: searchTerm });
    } catch (e) {
      console.log("[Analytics] logSearch error:", e);
    }
  }

  // ============ Error Tracking ============

  async logError(errorType: string, errorMessage: string) {
    await this.logEvent("app_error", {
      error_type: errorType,
      error_message: errorMessage.substring(0, 100),
    });
  }
}

export const analyticsService = new AnalyticsService();
