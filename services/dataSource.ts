// Centralized data source for manual input mode
import { profileAPI } from "./api";

// Helper function to extract merchant name from transaction description
function extractMerchantFromDescription(description: string): string {
  // Remove common prefixes and clean up merchant names
  return description
    .replace(/^(CARD PAYMENT TO |FASTER PAYMENT TO |DIRECT DEBIT FROM |STANDING ORDER TO )/i, '')
    .replace(/\s+\d{2}\/\d{2}\/\d{4}.*$/i, '') // Remove dates
    .replace(/\s+REF:.*$/i, '') // Remove reference numbers
    .replace(/\s+\*\d+.*$/i, '') // Remove card numbers
    .trim()
    .substring(0, 50); // Limit length
}

// Helper function to categorize transactions based on description
function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase();

  if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('tesco') || desc.includes('asda') || desc.includes('sainsbury')) {
    return 'groceries';
  } else if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('pizza') || desc.includes('mcdonald') || desc.includes('kfc')) {
    return 'dining';
  } else if (desc.includes('fuel') || desc.includes('petrol') || desc.includes('shell') || desc.includes('bp')) {
    return 'transport';
  } else if (desc.includes('shopping') || desc.includes('amazon') || desc.includes('ebay')) {
    return 'shopping';
  } else if (desc.includes('salary') || desc.includes('wage') || desc.includes('payroll')) {
    return 'income';
  } else if (desc.includes('rent') || desc.includes('mortgage') || desc.includes('utilities') || desc.includes('electric') || desc.includes('gas')) {
    return 'bills';
  } else {
    return 'other';
  }
}

// 📱 MANUAL INPUT MODE: All banking functions return empty/default data

export const getInstitutions = async (...args: any[]) => {
  console.log("📱 [DataSource] Manual input mode: No institutions available");
  return { institutions: [] };
};

export const getAccountDetails = async (accountId: string) => {
  console.log("📱 [DataSource] Manual input mode: No account details available");
  return {
    id: accountId,
    name: "Manual Account",
    iban: "****MANUAL",
    balance: 0,
    currency: "GBP",
    status: "manual",
    institution: {
      id: "manual",
      name: "Manual Entry",
      logo: "",
    },
    type: "Manual Account",
    createdAt: new Date().toISOString(),
  };
};

export const getAccountBalance = async (accountId: string) => {
  console.log("📱 [DataSource] Manual input mode: No account balance available");
  return {
    balanceAmount: {
      amount: 0,
      currency: "GBP",
    },
    balanceType: "manual",
    referenceDate: new Date().toISOString(),
  };
};

export const getAccountTransactions = async (accountId: string) => {
  console.log("📱 [DataSource] Manual input mode: No account transactions available");
  return {
    transactions: [],
  };
};

export const getAllAccountIds = async () => {
  try {
    // 📱 MANUAL INPUT MODE: Return empty array since we're not using bank connections
    console.log("📱 [DataSource] Manual input mode: Skipping bank account fetch");
    return [];
  } catch (error: any) {
    console.error("Error loading accounts:", error);
    return [];
  }
};

export const refreshAccountBalances = async () => {
  console.log("📱 [DataSource] Manual input mode: No account balances to refresh");
  return { success: true, message: "Manual mode - no balances to refresh" };
};

// Non-banking functionality that can remain

export const getSpendingCategories = async () => {
  try {
    // Return default categories for manual input mode
    return [
      { id: "food", name: "Food & Dining", icon: "restaurant", defaultBudget: 300, spent: 0, color: "#3B82F6" },
      { id: "transport", name: "Transportation", icon: "car", defaultBudget: 150, spent: 0, color: "#10B981" },
      { id: "entertainment", name: "Entertainment", icon: "game-controller", defaultBudget: 100, spent: 0, color: "#8B5CF6" },
      { id: "shopping", name: "Shopping", icon: "bag", defaultBudget: 200, spent: 0, color: "#F59E0B" },
      { id: "bills", name: "Bills & Utilities", icon: "flash", defaultBudget: 150, spent: 0, color: "#EF4444" },
      { id: "health", name: "Health & Fitness", icon: "fitness", defaultBudget: 100, spent: 0, color: "#06B6D4" },
      { id: "other", name: "Other", icon: "card", defaultBudget: 100, spent: 0, color: "#84CC16" },
    ];
  } catch (error) {
    console.error("Error loading spending categories:", error);
    return [];
  }
};

export const getPaymentMethods = async () => {
  console.log("📱 [DataSource] Manual input mode: No payment methods available");
  return [];
};

export const getFAQ = async () => {
  console.log("📱 [DataSource] Manual input mode: No FAQ available");
  return [];
};

export const getLegalSections = async () => {
  console.log("📱 [DataSource] Manual input mode: No legal sections available");
  return [];
};

export const getNotificationSettings = async () => {
  try {
    // Check if app is locked first - prevent API calls that cause session expiry
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    const isSecurityEnabled = await AsyncStorage.getItem('@expenzez_security_enabled');

    if (isSecurityEnabled === 'true') {
      const lastUnlockTime = await AsyncStorage.getItem('@expenzez_last_unlock');
      const sessionTimeout = 15 * 60 * 1000; // 15 minutes (matches security system)
      const now = Date.now();
      const hasValidSession = lastUnlockTime && (now - parseInt(lastUnlockTime)) < sessionTimeout;

      if (!hasValidSession) {
        console.log("🔒 [DataSource] App is locked, skipping notification preferences fetch to prevent session expiry");
        return getDefaultNotificationSettings(); // Return defaults instead of making API call
      }
    }

    // Try to get real notification preferences from API
    const { notificationAPI } = await import("./api");
    const response = await notificationAPI.getPreferences();
    return response.preferences || getDefaultNotificationSettings();
  } catch (error) {
    console.error("Error loading notification settings:", error);
    return getDefaultNotificationSettings();
  }
};

const getDefaultNotificationSettings = () => ({
  pushEnabled: true,
  emailEnabled: false,
  smsEnabled: false,
  transactionAlerts: true,
  budgetAlerts: true,
  accountAlerts: true,
  securityAlerts: true,
  insightAlerts: true,
  minimumTransactionAmount: 50.0,
  budgetThresholds: [75, 85, 95, 100],
  quietHours: {
    enabled: true,
    startTime: "22:00",
    endTime: "07:00",
  },
});

export const getRecentNotifications = async () => {
  try {
    // Check if app is locked first - prevent API calls that cause session expiry
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    const isSecurityEnabled = await AsyncStorage.getItem('@expenzez_security_enabled');

    if (isSecurityEnabled === 'true') {
      const lastUnlockTime = await AsyncStorage.getItem('@expenzez_last_unlock');
      const sessionTimeout = 15 * 60 * 1000; // 15 minutes (matches security system)
      const now = Date.now();
      const hasValidSession = lastUnlockTime && (now - parseInt(lastUnlockTime)) < sessionTimeout;

      if (!hasValidSession) {
        console.log("🔒 [DataSource] App is locked, skipping notification history fetch to prevent session expiry");
        return []; // Return empty array instead of making API call
      }
    }

    // Fetch real notifications from backend API
    const { notificationAPI } = await import("./api");
    const response = await notificationAPI.getHistory(20);

    // Transform backend data to match frontend interface
    return (response.notifications || []).map((notification: any) => ({
      id: notification.id || notification.notificationId,
      title: notification.title,
      message: notification.message,
      timestamp: new Date(notification.createdAt || notification.timestamp).getTime(),
      type: notification.type || 'account',
      isRead: notification.read || false,
      ...notification.data
    }));
  } catch (error) {
    console.error("Error loading real notifications:", error);

    // Handle timeout errors gracefully
    if ((error as any).code === 'ECONNABORTED' || (error as any).message?.includes('timeout')) {
      console.warn("Notification request timed out, returning empty list");
      return [];
    }

    // API not available, return empty array
    if ((error as any).response?.status === 404) {
      console.log('Notifications API not available');
      return [];
    }

    // Return empty array for other errors
    return [];
  }
};

export const getProfile = async () => {
  try {
    const response = await profileAPI.getProfile();
    return response.profile;
  } catch (error) {
    console.error("Error loading profile:", error);
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      avatar: null,
    };
  }
};

export const getCreditScore = async () => {
  try {
    const response = await profileAPI.getCreditScore();
    return response.creditScore;
  } catch (error) {
    console.error("Error loading credit score:", error);
    return {
      score: null,
      lastUpdated: null,
      status: "not_available",
    };
  }
};

export const getGoals = async () => {
  try {
    const response = await profileAPI.getGoals();
    return response.goals || {
      completed: 0,
      total: 0,
      items: [],
    };
  } catch (error) {
    console.error("Error loading goals:", error);
    return {
      completed: 0,
      total: 0,
      items: [],
    };
  }
};

export const getSavingsGoals = async () => {
  try {
    const response = await profileAPI.getGoals();
    return response.savingsGoals || [];
  } catch (error) {
    console.error("Error loading savings goals:", error);
    return [];
  }
};

export const createSavingsGoal = async (goalData: {
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
}) => {
  try {
    const response = await profileAPI.createGoal(goalData);
    return response;
  } catch (error) {
    console.error("Error creating savings goal:", error);
    throw error;
  }
};

export const updateSavingsGoal = async (goalId: string, updates: any) => {
  try {
    const response = await profileAPI.updateGoal(goalId, updates);
    return response;
  } catch (error) {
    console.error("Error updating savings goal:", error);
    throw error;
  }
};

export const deleteSavingsGoal = async (goalId: string) => {
  try {
    const response = await profileAPI.deleteGoal(goalId);
    return response;
  } catch (error) {
    console.error("Error deleting savings goal:", error);
    throw error;
  }
};

export const getMonths = async () => {
  try {
    // Generate last 12 months
    const months = [];
    const currentDate = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      months.push({
        id: date.toISOString().slice(0, 7), // YYYY-MM format
        name: date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        value: date.toISOString().slice(0, 7),
      });
    }

    return months;
  } catch (error) {
    console.error("Error generating months:", error);
    return [];
  }
};

// 📱 MANUAL INPUT MODE: Use transactionAPI instead of banking APIs
export const getTransactions = async () => {
  try {
    console.log("[DataSource] getTransactions called - using manual transaction API");

    const { transactionAPI } = await import("./api/transactionAPI");
    const response = await transactionAPI.getTransactions({ limit: 2000 });

    console.log("[DataSource] Manual transaction API response:", response);

    if (!response || !response.transactions) {
      console.log("[DataSource] No transactions in response");
      return [];
    }

    console.log("[DataSource] Found transactions:", response.transactions.length);

    // Return the transactions with proper formatting
    const formattedTransactions = response.transactions.map((tx: any, index: number) => ({
      // Keep all original fields from API
      ...tx,
      // Add UI-expected fields
      id: tx.id || `tx_${index}`,
      transaction_id: tx.id,
      account_id: tx.accountId || 'manual',
      merchant_name: tx.merchant || tx.description || 'Manual Entry',
      transaction_type: tx.type || (parseFloat(tx.amount || '0') < 0 ? 'debit' : 'credit'),
      bank_name: tx.bankName || 'Manual Entry',
    }));

    console.log("[DataSource] Returning formatted transactions:", formattedTransactions.length);
    return formattedTransactions;

  } catch (error: any) {
    console.error("[DataSource] Error with transaction API call:", error);
    return [];
  }
};