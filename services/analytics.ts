import analytics from "@react-native-firebase/analytics";

/**
 * Analytics service for tracking user events and screen views
 * Uses Firebase Analytics (Google Analytics 4)
 */
class AnalyticsService {
  private enabled: boolean = true;

  /**
   * Enable/disable analytics (for user opt-out)
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    analytics().setAnalyticsCollectionEnabled(enabled);
  }

  /**
   * Set user ID for cross-device tracking
   */
  async setUserId(userId: string | null) {
    if (!this.enabled) return;
    await analytics().setUserId(userId);
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: Record<string, string | null>) {
    if (!this.enabled) return;
    for (const [key, value] of Object.entries(properties)) {
      await analytics().setUserProperty(key, value);
    }
  }

  /**
   * Log screen view
   */
  async logScreenView(screenName: string, screenClass?: string) {
    if (!this.enabled) return;
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  }

  /**
   * Log custom event
   */
  async logEvent(eventName: string, params?: Record<string, any>) {
    if (!this.enabled) return;
    await analytics().logEvent(eventName, params);
  }

  // ============ App Events ============

  async logAppOpen() {
    await this.logEvent("app_open");
  }

  async logLogin(method: string) {
    await analytics().logLogin({ method });
  }

  async logSignUp(method: string) {
    await analytics().logSignUp({ method });
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
    await analytics().logSearch({ search_term: searchTerm });
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
