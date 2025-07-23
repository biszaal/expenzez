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

// API configuration
export const API_CONFIG = {
  baseUrl: "http://192.168.1.76:3001/api",
  timeout: 10000,
  retryAttempts: 3,
} as const;

// Navigation constants
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
  },
  banking: {
    connect: "/banks/connect",
    select: "/banks/select",
    callback: "/banks/callback",
  },
} as const;

// Feature flags
export const FEATURES = {
  aiAssistant: true,
  bankConnections: true,
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
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  login: "Login successful!",
  register: "Registration successful!",
  bankConnected: "Bank account connected successfully!",
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

// Date formats
export const DATE_FORMATS = {
  display: "MMM DD, YYYY",
  input: "YYYY-MM-DD",
  api: "YYYY-MM-DDTHH:mm:ss.SSSZ",
  short: "MMM DD",
  month: "MMMM YYYY",
} as const;

// Transaction types
export const TRANSACTION_TYPES = {
  debit: "debit",
  credit: "credit",
  transfer: "transfer",
} as const;

// Account types
export const ACCOUNT_TYPES = {
  current: "current",
  savings: "savings",
  credit: "credit",
  investment: "investment",
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  spending: "spending",
  budget: "budget",
  security: "security",
  system: "system",
} as const;

// Security levels
export const SECURITY_LEVELS = {
  low: "low",
  medium: "medium",
  high: "high",
} as const;

// Theme colors (will be replaced by dynamic theme system)
export const THEME_COLORS = {
  primary: "#3B82F6",
  secondary: "#6B7280",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#06B6D4",
} as const;

// Animation durations
export const ANIMATION = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

// Storage keys
export const STORAGE_KEYS = {
  auth: {
    isLoggedIn: "isLoggedIn",
    accessToken: "accessToken",
    idToken: "idToken",
    refreshToken: "refreshToken",
    user: "user",
  },
  settings: {
    theme: "theme",
    notifications: "notifications",
    biometric: "biometric",
    language: "language",
  },
  data: {
    accounts: "accounts",
    transactions: "transactions",
    profile: "profile",
    budgets: "budgets",
  },
} as const;

// Default values
export const DEFAULTS = {
  pageSize: 20,
  refreshInterval: 300000, // 5 minutes
  sessionTimeout: 3600000, // 1 hour
  maxRetries: 3,
} as const;

// Environment-specific configuration
export const ENV_CONFIG = {
  development: {
    apiUrl: "http://192.168.1.76:3001/api",
    logLevel: "debug",
  },
  production: {
    apiUrl: "https://api.expenzez.com",
    logLevel: "error",
  },
} as const;

// Bank categories for filtering
export const BANK_CATEGORIES = {
  retail: {
    name: "Retail Banks",
    description: "High street banks and building societies",
    icon: "🏦",
    color: "#3B82F6",
  },
  digital: {
    name: "Digital Banks",
    description: "Online-only banks and fintech",
    icon: "📱",
    color: "#10B981",
  },
  investment: {
    name: "Investment",
    description: "Investment and wealth management",
    icon: "📈",
    color: "#F59E0B",
  },
  credit: {
    name: "Credit Unions",
    description: "Credit unions and mutuals",
    icon: "🤝",
    color: "#8B5CF6",
  },
  international: {
    name: "International",
    description: "International and foreign banks",
    icon: "🌍",
    color: "#EF4444",
  },
} as const;

// Bank logos mapping - updated to match actual API bank names
export const BANK_LOGOS = {
  // Major UK banks (matching API names)
  "Barclays Personal": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/barclayspersonal.png",
    color: "#00A1DE",
    type: "traditional",
    description: "Personal Banking",
  },
  "Barclays Business": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/barclayscorporate.png",
    color: "#00A1DE",
    type: "business",
    description: "Business Banking",
  },
  "Barclays Corporate": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/barclayscorporate.png",
    color: "#00A1DE",
    type: "corporate",
    description: "Corporate Banking",
  },
  "HSBC Personal": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/hsbcpersonal.png",
    color: "#DB0011",
    type: "traditional",
    description: "Personal Banking",
  },
  "HSBC Business": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/hsbcpersonal.png",
    color: "#DB0011",
    type: "business",
    description: "Business Banking",
  },
  "HSBC Kinetic": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/hsbcpersonal.png",
    color: "#DB0011",
    type: "digital",
    description: "Digital Banking",
  },
  "Lloyds Bank Personal": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/lloyds.png",
    color: "#D81F2A",
    type: "traditional",
    description: "Personal Banking",
  },
  "Lloyds Bank Business": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/lloyds.png",
    color: "#D81F2A",
    type: "business",
    description: "Business Banking",
  },
  "Lloyds Bank Commercial": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/lloyds.png",
    color: "#D81F2A",
    type: "commercial",
    description: "Commercial Banking",
  },
  Natwest: {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/natwest.png",
    color: "#DA1710",
    type: "traditional",
    description: "Personal Banking",
  },
  "Natwest Bankline": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/natwestbankline.png",
    color: "#DA1710",
    type: "business",
    description: "Business Banking",
  },
  "Natwest ClearSpend": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/natwest.png",
    color: "#DA1710",
    type: "digital",
    description: "Digital Banking",
  },
  "Royal Bank of Scotland": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/rbs.png",
    color: "#0052CC",
    type: "traditional",
    description: "Personal Banking",
  },
  "Royal Bank of Scotland Bankline": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/rbsbankline.png",
    color: "#0052CC",
    type: "business",
    description: "Business Banking",
  },
  "Royal Bank of Scotland ClearSpend": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/rbs.png",
    color: "#0052CC",
    type: "digital",
    description: "Digital Banking",
  },
  Santander: {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/santander.png",
    color: "#EC0000",
    type: "traditional",
    description: "Personal Banking",
  },
  "TSB Bank": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/tsbbank.png",
    color: "#FF6600",
    type: "traditional",
    description: "Personal Banking",
  },
  "Nationwide Building Society": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/nationwide.png",
    color: "#00A3E0",
    type: "building society",
    description: "Building Society",
  },

  // Digital banks
  "Monzo Bank Limited": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/monzo.png",
    color: "#FF5F5F",
    type: "digital",
    description: "Digital Banking",
  },
  Revolut: {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/revolut.png",
    color: "#0075FF",
    type: "digital",
    description: "Digital Banking",
  },
  "Starling Bank": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/starling.png",
    color: "#00D4AA",
    type: "digital",
    description: "Digital Banking",
  },
  "Chase Bank": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/chasebank.png",
    color: "#117ACA",
    type: "digital",
    description: "Digital Banking",
  },
  "N26 Bank": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/DE/PNG/n26.png",
    color: "#000000",
    type: "digital",
    description: "Digital Banking",
  },

  // Other banks
  "Metro Bank": {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/metro.png",
    color: "#D81F2A",
    type: "traditional",
    description: "Personal Banking",
  },
  Mettle: {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/mettle.png",
    color: "#00A3E0",
    type: "digital",
    description: "Digital Banking",
  },
  Monese: {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/FR/PNG/monese.png",
    color: "#00A3E0",
    type: "digital",
    description: "Digital Banking",
  },
  Tide: {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/tide.png",
    color: "#00A3E0",
    type: "digital",
    description: "Digital Banking",
  },
  Wise: {
    logoUrl:
      "https://storage.googleapis.com/gc-prd-institution_icons-production/UK/PNG/wise.png",
    color: "#00B9FF",
    type: "digital",
    description: "Digital Banking",
  },

  // Default fallback
  default: {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Bank_logo_placeholder.svg/1200px-Bank_logo_placeholder.svg.png",
    color: "#6B7280",
    type: "traditional",
    description: "Bank",
  },
} as const;
