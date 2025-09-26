// Constants for the application
import { Platform } from "react-native";

// Platform-specific values
export const IS_IOS = Platform.OS === "ios";
export const IS_ANDROID = Platform.OS === "android";

// App configuration
export const APP_CONFIG = {
  name: "Expenzez",
  version: "1.0.0",
  buildNumber: "1",
  bundleId: "com.expenzez.app",
} as const;

// API configuration - now uses production API
export const API_CONFIG = {
  baseUrl: "https://g77tomv0vk.execute-api.eu-west-2.amazonaws.com",
  timeout: 30000,
  retryAttempts: 3,
} as const;

// Navigation constants - updated for manual input mode
export const NAVIGATION = {
  auth: {
    login: "/auth/Login",
    register: "/auth/Register",
    verifyEmail: "/auth/VerifyEmail",
  },
  main: {
    home: "/(tabs)",
    spending: "/(tabs)/spending",
    accounts: "/(tabs)/account",
    credit: "/(tabs)/credit",
    addExpense: "/add-expense",
    importCsv: "/import-csv",
    transactions: "/transactions",
  },
} as const;

// Feature flags - updated for manual input mode
export const FEATURES = {
  aiAssistant: true,
  manualEntry: true,
  csvImport: true,
  notifications: true,
  darkMode: true,
  biometricAuth: true,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  network: "Network error. Please check your connection.",
  auth: "Authentication failed. Please try again.",
  server: "Server error. Please try again later.",
  unknown: "An unexpected error occurred.",
  rateLimit: "Rate limit exceeded. Please try again later.",
  csvImport: "Failed to import CSV file. Please check the format.",
  transactionSave: "Failed to save transaction. Please try again.",
} as const;

// Success messages - updated for manual input mode
export const SUCCESS_MESSAGES = {
  login: "Login successful!",
  register: "Registration successful!",
  expenseAdded: "Expense added successfully!",
  incomeAdded: "Income added successfully!",
  csvImported: "CSV data imported successfully!",
  profileUpdated: "Profile updated successfully!",
  settingsSaved: "Settings saved successfully!",
} as const;

// Validation rules
export const VALIDATION = {
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
  username: {
    minLength: 3,
    maxLength: 20,
    allowedChars: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone: {
    pattern: /^\+?[\d\s\-\(\)]+$/,
  },
  amount: {
    min: 0.01,
    max: 999999.99,
    pattern: /^\d+(\.\d{1,2})?$/,
  },
} as const;

// Currency configuration
export const CURRENCY = {
  default: "GBP",
  supported: ["GBP", "USD", "EUR"],
  symbols: {
    GBP: "£",
    USD: "$",
    EUR: "€",
  },
} as const;

// Transaction categories for manual input
export const TRANSACTION_CATEGORIES = {
  expenses: [
    { id: "food", name: "Food & Dining", icon: "restaurant", color: "#FF6B6B" },
    { id: "transport", name: "Transportation", icon: "car", color: "#4ECDC4" },
    { id: "shopping", name: "Shopping", icon: "bag", color: "#45B7D1" },
    { id: "bills", name: "Bills & Utilities", icon: "flash", color: "#96CEB4" },
    { id: "entertainment", name: "Entertainment", icon: "game-controller", color: "#FECA57" },
    { id: "health", name: "Health & Fitness", icon: "fitness", color: "#FF9FF3" },
    { id: "education", name: "Education", icon: "school", color: "#54A0FF" },
    { id: "travel", name: "Travel", icon: "airplane", color: "#5F27CD" },
    { id: "other", name: "Other", icon: "card", color: "#00D2D3" },
  ],
  income: [
    { id: "salary", name: "Salary", icon: "briefcase", color: "#2ED573" },
    { id: "freelance", name: "Freelance", icon: "laptop", color: "#3742FA" },
    { id: "investment", name: "Investment", icon: "trending-up", color: "#FF6348" },
    { id: "rental", name: "Rental Income", icon: "home", color: "#2F3542" },
    { id: "business", name: "Business", icon: "storefront", color: "#FF4757" },
    { id: "gift", name: "Gift/Bonus", icon: "gift", color: "#5352ED" },
    { id: "refund", name: "Refund", icon: "refresh", color: "#FF9F43" },
    { id: "other_income", name: "Other Income", icon: "cash", color: "#10AC84" },
  ],
} as const;

// CSV import configuration
export const CSV_CONFIG = {
  supportedFormats: [".csv", ".txt"],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  requiredColumns: ["date", "description", "amount"],
  optionalColumns: ["category", "type", "merchant"],
  dateFormats: [
    "DD/MM/YYYY",
    "MM/DD/YYYY",
    "YYYY-MM-DD",
    "DD-MM-YYYY",
    "MM-DD-YYYY",
  ],
} as const;

// Quick action configurations for manual input mode
export const QUICK_ACTIONS = [
  {
    id: "add-expense",
    title: "Add Expense",
    subtitle: "Manual entry",
    icon: "add-circle-outline",
    color: "#3B82F6",
    route: "/add-expense",
  },
  {
    id: "add-income",
    title: "Add Income",
    subtitle: "Record income",
    icon: "arrow-up-circle-outline",
    color: "#10B981",
    route: "/add-transaction",
  },
  {
    id: "import-csv",
    title: "Import CSV",
    subtitle: "Upload data",
    icon: "document-text-outline",
    color: "#F59E0B",
    route: "/import-csv",
  },
  {
    id: "ai-insights",
    title: "AI Insights",
    subtitle: "Smart analysis",
    icon: "sparkles",
    color: "#8B5CF6",
    route: "/ai-assistant",
  },
] as const;

// Default budget categories
export const DEFAULT_BUDGETS = {
  "food": 300,
  "transport": 150,
  "shopping": 200,
  "bills": 150,
  "entertainment": 100,
  "health": 100,
  "other": 100,
} as const;