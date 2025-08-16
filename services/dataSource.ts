// Centralized data source for real API calls
import { bankingAPI, profileAPI } from "./api";

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

// Real API-backed implementations
export const getInstitutions = async (...args: any[]) => {
  try {
    const res = await bankingAPI.getInstitutions();
    return res;
  } catch (error: any) {
    console.error("Error loading institutions:", error);

    // Handle rate limit errors gracefully
    if (error.response?.status === 429) {
      throw new Error("Rate limit exceeded. Please try again tomorrow.");
    }

    throw error;
  }
};

export const getAccountDetails = async (accountId: string) => {
  try {
    const accountsRes = await bankingAPI.getAccounts();
    const institutions = await getInstitutions();
    const account = (accountsRes.accounts || []).find(
      (a: any) => a.id === accountId
    );

    if (!account) {
      throw new Error("Account not found");
    }

    // Try to fetch balance for this account
    let balance = 0;
    try {
      const balanceRes = await bankingAPI.getBalance(accountId);
      balance = balanceRes.balance?.[0]?.balanceAmount?.amount || 0;
    } catch (balanceError) {
      console.error(
        `Error fetching balance for account ${accountId}:`,
        balanceError
      );
      // Use default balance of 0 if balance fetch fails
    }

    // Try to find institution logo
    const institution =
      institutions.find((inst: any) => inst.id === account.institutionId) || {};

    return {
      id: account.id,
      name: account.name || `Account ${accountId.slice(-4)}`,
      iban: account.iban || `****${accountId.slice(-4)}`,
      balance: balance,
      currency: account.currency || "GBP",
      status: account.status || "connected",
      institution: {
        id: account.institutionId,
        name: institution.name || "Bank",
        logo: institution.logo || "",
      },
      type: account.type || "Current Account",
      createdAt: account.createdAt,
    };
  } catch (error) {
    console.error(`Error fetching account details for ${accountId}:`, error);
    throw error;
  }
};

export const getAccountBalance = async (accountId: string) => {
  try {
    const balanceRes = await bankingAPI.getBalance(accountId);
    const balance = balanceRes.balance?.[0]?.balanceAmount || {
      amount: 0,
      currency: "GBP",
    };

    return {
      balanceAmount: {
        amount: parseFloat(balance.amount) || 0,
        currency: balance.currency || "GBP",
      },
      balanceType: balanceRes.balance?.[0]?.balanceType || "interimAvailable",
      referenceDate:
        balanceRes.balance?.[0]?.referenceDate || new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching balance for account ${accountId}:`, error);
    // Return default balance if fetch fails
    return {
      balanceAmount: {
        amount: 0,
        currency: "GBP",
      },
      balanceType: "interimAvailable",
      referenceDate: new Date().toISOString(),
    };
  }
};

export const getAccountTransactions = async (accountId: string) => {
  try {
    const transactionsRes = await bankingAPI.getTransactions(accountId);
    const transactions =
      transactionsRes.transactions?.booked ||
      transactionsRes.transactions ||
      [];

    return {
      transactions: transactions.map((tx: any) => ({
        id: tx.transactionId || tx.id || `tx_${Date.now()}`,
        amount: parseFloat(tx.transactionAmount?.amount || tx.amount || "0"),
        currency: tx.transactionAmount?.currency || tx.currency || "GBP",
        description:
          tx.remittanceInformationUnstructured ||
          tx.description ||
          "Transaction",
        date: tx.bookingDate || tx.date || new Date().toISOString(),
        category: tx.category || "Other",
        accountId: accountId,
        // Additional fields that might be useful
        creditorName: tx.creditorName || "",
        debtorName: tx.debtorName || "",
        transactionType: tx.transactionType || "debit",
        status: tx.status || "booked",
      })),
    };
  } catch (error) {
    console.error(
      `Error fetching transactions for account ${accountId}:`,
      error
    );
    // Return empty transactions if fetch fails
    return {
      transactions: [],
    };
  }
};

export const getAllAccountIds = async () => {
  try {
    const accountsRes = await bankingAPI.getAccounts();
    return (accountsRes.accounts || []).map((a: any) => a.id);
  } catch (error: any) {
    console.error("Error loading accounts:", error);

    // Handle rate limit errors gracefully
    if (error.response?.status === 429) {
      throw new Error("Rate limit exceeded. Please try again tomorrow.");
    }

    throw error;
  }
};

export const refreshAccountBalances = async () => {
  try {
    const response = await bankingAPI.refreshBalances();
    return response;
  } catch (error: any) {
    console.error("Error refreshing account balances:", error);
    throw error;
  }
};

// Real API implementations for previously mock-only endpoints
export const getSpendingCategories = async () => {
  try {
    // This would typically come from a backend API
    // For now, we'll return a dynamic list based on user's actual spending
    const accountIds = await getAllAccountIds();
    const categories = new Set();

    // Collect categories from actual transactions
    for (const accountId of accountIds) {
      try {
        const transactions = await getAccountTransactions(accountId);
        transactions.transactions?.forEach((tx: any) => {
          if (tx.category) {
            categories.add(tx.category);
          }
        });
      } catch (error) {
        console.error(
          `Error fetching transactions for account ${accountId}:`,
          error
        );
      }
    }

    // Return dynamic categories based on actual spending
    return Array.from(categories).map((category, index) => ({
      id: category.toLowerCase().replace(/\s+/g, "-"),
      name: category,
      icon: getCategoryIcon(category as string),
      defaultBudget: 0, // Will be set by user
      spent: 0, // Will be calculated from transactions
      color: getCategoryColor(index),
    }));
  } catch (error) {
    console.error("Error loading spending categories:", error);
    // Return empty array if no transactions or API fails
    return [];
  }
};

export const getPaymentMethods = async () => {
  try {
    // This would typically come from a backend API
    // For now, return empty array - payment methods would be managed by user
    return [];
  } catch (error) {
    console.error("Error loading payment methods:", error);
    return [];
  }
};

export const getFAQ = async () => {
  try {
    // This would typically come from a backend API
    // For now, return empty array
    return [];
  } catch (error) {
    console.error("Error loading FAQ:", error);
    return [];
  }
};

export const getLegalSections = async () => {
  try {
    // This would typically come from a backend API
    return [];
  } catch (error) {
    console.error("Error loading legal sections:", error);
    return [];
  }
};

export const getNotificationSettings = async () => {
  try {
    // Hardcoded notification preferences for production demo
    return {
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
    };
  } catch (error) {
    console.error("Error loading notification settings:", error);
    return {
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
        enabled: false,
        startTime: "22:00",
        endTime: "07:00",
      },
    };
  }
};

export const getRecentNotifications = async () => {
  try {
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
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.warn("Notification request timed out, returning empty list");
      return [];
    }
    
    // Temporary fallback: Return sample notifications until backend is deployed
    if (error.response?.status === 404) {
      return [
        {
          id: "temp-1",
          title: "Welcome to Expenzez!",
          message: "Your notification system is being set up. You'll receive real-time alerts once your bank accounts sync.",
          timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
          type: "account",
          isRead: false,
        },
        {
          id: "temp-2", 
          title: "Notification System Ready",
          message: "Once deployed, you'll receive alerts for transactions, budget limits, security events, and AI insights.",
          timestamp: Date.now() - 60 * 60 * 1000, // 1 hour ago
          type: "insight",
          isRead: true,
        }
      ];
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

// Helper functions
const getCategoryIcon = (category: string): string => {
  const iconMap: { [key: string]: string } = {
    groceries: "food-apple-outline",
    transport: "bus-clock",
    entertainment: "game-controller-outline",
    utilities: "flash-outline",
    shopping: "bag-outline",
    health: "fitness-outline",
    coffee: "cafe",
    restaurant: "restaurant",
    gas: "car",
    parking: "car",
    uber: "car",
    lyft: "car",
    amazon: "basket",
    netflix: "tv",
    spotify: "musical-notes",
    gym: "fitness",
    pharmacy: "medical",
    doctor: "medical",
    dentist: "medical",
    salary: "cash",
    income: "cash",
    refund: "card",
    default: "card",
  };

  return iconMap[category.toLowerCase()] || iconMap.default;
};

const getCategoryColor = (index: number): string => {
  const colors = [
    "#3B82F6", // blue
    "#10B981", // green
    "#8B5CF6", // purple
    "#F59E0B", // amber
    "#EF4444", // red
    "#06B6D4", // cyan
    "#84CC16", // lime
    "#F97316", // orange
    "#EC4899", // pink
    "#6366F1", // indigo
  ];

  return colors[index % colors.length];
};

export const getTransactions = async () => {
  try {
    
    // Use the EXACT same call as the homepage - direct API call without transformation
    const response = await bankingAPI.getAllTransactions(100);
    

    if (!response || !response.transactions) {
      return [];
    }

    
    // Return the transactions exactly as they come from the API (same as homepage)
    // Just add the fields that the UI expects
    return response.transactions.map((tx: any, index: number) => ({
      // Keep all original fields from DynamoDB
      ...tx,
      // Add UI-expected fields
      id: tx.transactionId || tx.id || `tx_${index}`,
      transaction_id: tx.transactionId || tx.id,
      account_id: tx.accountId,
      merchant_name: tx.merchant || tx.description || 'Unknown Merchant',
      transaction_type: tx.type || (parseFloat(tx.amount || '0') < 0 ? 'debit' : 'credit'),
      bank_name: tx.bankName || 'Unknown Bank',
    }));
    
  } catch (error: any) {
    console.error("[DataSource] Error with direct API call:", error);
    console.error("[DataSource] Error details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return [];
  }
};
