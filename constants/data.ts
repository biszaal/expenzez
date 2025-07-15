/**
 * Shared constants and data used across the app
 */

/**
 * Common notification settings with their default values
 */
export const NOTIFICATION_SETTINGS = [
  {
    id: "push",
    title: "Push Notifications",
    subtitle: "Receive instant alerts on your device",
    enabled: true,
    icon: "notifications",
  },
  {
    id: "email",
    title: "Email Notifications",
    subtitle: "Get updates via email",
    enabled: true,
    icon: "mail",
  },
  {
    id: "sms",
    title: "SMS Notifications",
    subtitle: "Receive text message alerts",
    enabled: false,
    icon: "chatbubble",
  },
  {
    id: "spending",
    title: "Spending Alerts",
    subtitle: "Get notified about unusual spending",
    enabled: true,
    icon: "card",
  },
  {
    id: "budget",
    title: "Budget Reminders",
    subtitle: "Stay on track with your budget",
    enabled: true,
    icon: "trending-up",
  },
  {
    id: "credit",
    title: "Credit Score Updates",
    subtitle: "Monitor your credit score changes",
    enabled: false,
    icon: "analytics",
  },
  {
    id: "security",
    title: "Security Alerts",
    subtitle: "Important security notifications",
    enabled: true,
    icon: "shield",
  },
  {
    id: "promotions",
    title: "Promotional Offers",
    subtitle: "Receive special offers and deals",
    enabled: false,
    icon: "gift",
  },
] as const;

/**
 * Common FAQ data
 */
export const FAQ_DATA = [
  {
    id: "1",
    question: "How do I connect my bank account?",
    answer:
      "Go to the Banks section and tap 'Add Bank Account'. Follow the secure connection process using our partner Nordigen.",
    category: "Banking",
  },
  {
    id: "2",
    question: "Is my financial data secure?",
    answer:
      "Yes, we use bank-level encryption and never store your banking credentials. All data is encrypted and secure.",
    category: "Security",
  },
  {
    id: "3",
    question: "How do I update my budget?",
    answer:
      "Navigate to the Spending tab and tap on any category to modify your budget limits and goals.",
    category: "Budgeting",
  },
  {
    id: "4",
    question: "Can I export my transaction data?",
    answer:
      "Yes, go to Profile > Personal Information > Export Data to download your financial data.",
    category: "Data",
  },
  {
    id: "5",
    question: "How do I reset my password?",
    answer:
      "On the login screen, tap 'Forgot password?' and follow the email instructions to reset your password.",
    category: "Account",
  },
  {
    id: "6",
    question: "What payment methods are supported?",
    answer:
      "We support all major credit cards, debit cards, and bank account connections through our secure platform.",
    category: "Payments",
  },
] as const;

/**
 * Common help options
 */
export const HELP_OPTIONS = [
  {
    id: "1",
    title: "Contact Support",
    subtitle: "Get help from our team",
    icon: "chatbubble-ellipses",
  },
  {
    id: "2",
    title: "Live Chat",
    subtitle: "Chat with us in real-time",
    icon: "chatbubbles",
  },
  {
    id: "3",
    title: "Video Tutorials",
    subtitle: "Learn how to use the app",
    icon: "play-circle",
  },
  {
    id: "4",
    title: "User Guide",
    subtitle: "Complete app documentation",
    icon: "document-text",
  },
] as const;

/**
 * Common legal sections
 */
export const LEGAL_SECTIONS = [
  {
    id: "1",
    title: "Terms of Service",
    type: "terms" as const,
  },
  {
    id: "2",
    title: "Privacy Policy",
    type: "privacy" as const,
  },
  {
    id: "3",
    title: "Data Protection",
    type: "privacy" as const,
  },
  {
    id: "4",
    title: "Acceptable Use",
    type: "terms" as const,
  },
] as const;

/**
 * Common months for date pickers
 */
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * Common spending categories with their default budgets
 */
export const SPENDING_CATEGORIES = [
  {
    id: "transport",
    name: "Transport",
    icon: "bus-clock",
    defaultBudget: 350,
    color: "#3B82F6",
  },
  {
    id: "groceries",
    name: "Groceries",
    icon: "food-apple-outline",
    defaultBudget: 200,
    color: "#10B981",
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "game-controller-outline",
    defaultBudget: 150,
    color: "#8B5CF6",
  },
  {
    id: "utilities",
    name: "Utilities",
    icon: "flash-outline",
    defaultBudget: 100,
    color: "#F59E0B",
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "bag-outline",
    defaultBudget: 100,
    color: "#EF4444",
  },
  {
    id: "health",
    name: "Health & Fitness",
    icon: "fitness-outline",
    defaultBudget: 80,
    color: "#06B6D4",
  },
] as const;

/**
 * Common bank logos and colors with actual image URLs
 * Only includes the most commonly supported banks by Nordigen/GoCardless
 */
export const BANK_LOGOS = {
  // Major UK Banks (Most Commonly Supported)
  Barclays: {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Barclays_Bank_logo.svg/1200px-Barclays_Bank_logo.svg.png",
    color: "#1E40AF",
    type: "traditional",
    description: "Traditional banking",
  },
  HSBC: {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/HSBC_logo_%282019%29.svg/1200px-HSBC_logo_%282019%29.svg.png",
    color: "#1D4ED8",
    type: "traditional",
    description: "Traditional banking",
  },
  "Lloyds Bank": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Lloyds_Bank_logo.svg/1200px-Lloyds_Bank_logo.svg.png",
    color: "#059669",
    type: "traditional",
    description: "Traditional banking",
  },
  NatWest: {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/NatWest_logo.svg/1200px-NatWest_logo.svg.png",
    color: "#D97706",
    type: "traditional",
    description: "Traditional banking",
  },
  Santander: {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Santander_Bank_logo.svg/1200px-Santander_Bank_logo.svg.png",
    color: "#DC2626",
    type: "traditional",
    description: "Traditional banking",
  },
  TSB: {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/TSB_Bank_logo.svg/1200px-TSB_Bank_logo.svg.png",
    color: "#059669",
    type: "traditional",
    description: "Traditional banking",
  },
  Nationwide: {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Nationwide_logo.svg/1200px-Nationwide_logo.svg.png",
    color: "#7C3AED",
    type: "building-society",
    description: "Building society",
  },
  "Metro Bank": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Metro_Bank_logo.svg/1200px-Metro_Bank_logo.svg.png",
    color: "#DC2626",
    type: "traditional",
    description: "Traditional banking",
  },
  "Co-operative Bank": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Co-operative_Bank_logo.svg/1200px-Co-operative_Bank_logo.svg.png",
    color: "#059669",
    type: "ethical",
    description: "Ethical banking",
  },
  "First Direct": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/First_Direct_logo.svg/1200px-First_Direct_logo.svg.png",
    color: "#1E40AF",
    type: "digital",
    description: "Digital banking",
  },

  // Digital Banks (Most Popular)
  Revolut: {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Revolut_logo.svg/1200px-Revolut_logo.svg.png",
    color: "#7C3AED",
    type: "digital",
    description: "Digital banking",
  },
  Monzo: {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Monzo_logo.svg/1200px-Monzo_logo.svg.png",
    color: "#F97316",
    type: "digital",
    description: "Digital banking",
  },
  "Starling Bank": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Starling_Bank_logo.svg/1200px-Starling_Bank_logo.svg.png",
    color: "#F59E0B",
    type: "digital",
    description: "Digital banking",
  },
  Chase: {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Chase_logo.svg/1200px-Chase_logo.svg.png",
    color: "#1D4ED8",
    type: "digital",
    description: "Digital banking",
  },
  Wise: {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Wise_logo.svg/1200px-Wise_logo.svg.png",
    color: "#10B981",
    type: "digital",
    description: "International banking",
  },

  // Building Societies (Most Popular)
  "Yorkshire Building Society": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Yorkshire_Building_Society_logo.svg/1200px-Yorkshire_Building_Society_logo.svg.png",
    color: "#059669",
    type: "building-society",
    description: "Building society",
  },
  "Coventry Building Society": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Coventry_Building_Society_logo.svg/1200px-Coventry_Building_Society_logo.svg.png",
    color: "#7C3AED",
    type: "building-society",
    description: "Building society",
  },
  "Skipton Building Society": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Skipton_Building_Society_logo.svg/1200px-Skipton_Building_Society_logo.svg.png",
    color: "#1E40AF",
    type: "building-society",
    description: "Building society",
  },

  // Other Popular Banks
  Halifax: {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Halifax_logo.svg/1200px-Halifax_logo.svg.png",
    color: "#1E40AF",
    type: "traditional",
    description: "Traditional banking",
  },
  "Bank of Scotland": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Bank_of_Scotland_logo.svg/1200px-Bank_of_Scotland_logo.svg.png",
    color: "#1D4ED8",
    type: "traditional",
    description: "Traditional banking",
  },
  "Virgin Money": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Virgin_Money_logo.svg/1200px-Virgin_Money_logo.svg.png",
    color: "#7C3AED",
    type: "traditional",
    description: "Traditional banking",
  },
  "Tesco Bank": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Tesco_Bank_logo.svg/1200px-Tesco_Bank_logo.svg.png",
    color: "#10B981",
    type: "retail",
    description: "Retail banking",
  },
  "M&S Bank": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/M%26S_Bank_logo.svg/1200px-M%26S_Bank_logo.svg.png",
    color: "#DC2626",
    type: "retail",
    description: "Retail banking",
  },
  "Sainsbury's Bank": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Sainsburys_Bank_logo.svg/1200px-Sainsburys_Bank_logo.svg.png",
    color: "#F59E0B",
    type: "retail",
    description: "Retail banking",
  },
  "Post Office Money": {
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Post_Office_logo.svg/1200px-Post_Office_logo.svg.png",
    color: "#1E40AF",
    type: "retail",
    description: "Retail banking",
  },
} as const;

/**
 * Bank categories for filtering
 */
export const BANK_CATEGORIES = {
  traditional: {
    name: "Traditional Banks",
    description: "Established high street banks",
    icon: "🏦",
    color: "#1E40AF",
  },
  digital: {
    name: "Digital Banks",
    description: "Modern app-based banking",
    icon: "📱",
    color: "#7C3AED",
  },
  "building-society": {
    name: "Building Societies",
    description: "Member-owned financial institutions",
    icon: "🏘️",
    color: "#059669",
  },
  retail: {
    name: "Retail Banks",
    description: "Banks operated by retail companies",
    icon: "🛒",
    color: "#F59E0B",
  },
  ethical: {
    name: "Ethical Banks",
    description: "Banks with ethical policies",
    icon: "🤝",
    color: "#10B981",
  },
  specialist: {
    name: "Specialist Banks",
    description: "Specialized financial services",
    icon: "🏦",
    color: "#DC2626",
  },
} as const;
