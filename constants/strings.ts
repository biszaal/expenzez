/**
 * App text strings - centralized to avoid hardcoding
 */

export const APP_STRINGS = {
  // App name
  APP_NAME: "Expenzez",
  
  // Time-based greetings
  GREETING_MORNING: "morning",
  GREETING_AFTERNOON: "afternoon", 
  GREETING_EVENING: "evening",
  
  // Home page
  HOME: {
    WELCOME_BACK: "Welcome back to your finances",
    TOTAL_BALANCE: "Total Balance",
    TREND_TEXT: "+2.4% this month",
    LOADING_FINANCIAL: "Loading your financial overview...",
    LOADING_SUBTEXT: "This may take a few moments",
    LOGIN_WARNING: "Please log in to view your financial data",
  },
  
  // Quick actions
  QUICK_ACTIONS: {
    ADD_EXPENSE: "Add Expense",
    TRACK_SPENDING: "Track spending",
    AI_INSIGHTS: "AI Insights",
    GET_ADVICE: "Get advice",
    IMPORT_CSV: "Import CSV",
    UPLOAD_DATA: "Upload data",
    ADD_INCOME: "Add Income",
    RECORD_INCOME: "Record income",
  },
  
  // Monthly overview
  MONTHLY: {
    THIS_MONTH: "This Month",
    SPENT: "Spent",
    BUDGET: "Budget",
  },
  
  // Transactions
  TRANSACTIONS: {
    RECENT_TRANSACTIONS: "Recent Transactions",
    REFRESH: "Refresh",
    SYNCING: "Syncing...",
    SEE_ALL: "See All",
    ADD_MANUALLY: "📝 Add expenses manually or import CSV data",
  },

  // Manual Data Entry
  MANUAL: {
    NO_TRANSACTIONS: "No transactions yet",
    ADD_EXPENSE_TO_START: "Add expenses manually or import CSV to get started",
    IMPORT_CSV_HINT: "Import your bank statements or add transactions one by one",
  },
  
  // Common
  COMMON: {
    GBP: "GBP",
    TRANSACTION: "Transaction", 
    OTHER: "Other",
    TRUE: "true",
  },
  
  // Note: URLs moved to config.ts for proper environment handling
};

export default APP_STRINGS;