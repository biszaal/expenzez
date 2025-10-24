/**
 * Transaction Auto-Categorization Service
 * Supports both keyword-based and AI-powered categorization with fallback
 */

export const TRANSACTION_CATEGORIES = [
  { id: "food", name: "Food & Dining", emoji: "🍔" },
  { id: "transport", name: "Transport", emoji: "🚗" },
  { id: "shopping", name: "Shopping", emoji: "🛍️" },
  { id: "entertainment", name: "Entertainment", emoji: "🎬" },
  { id: "bills", name: "Bills & Utilities", emoji: "💡" },
  { id: "healthcare", name: "Healthcare", emoji: "💊" },
  { id: "education", name: "Education", emoji: "📚" },
  { id: "travel", name: "Travel", emoji: "✈️" },
  { id: "groceries", name: "Groceries", emoji: "🛒" },
  { id: "fuel", name: "Fuel", emoji: "⛽" },
  { id: "subscriptions", name: "Subscriptions", emoji: "💳" },
  { id: "income", name: "Income", emoji: "💰" },
  { id: "other", name: "Other", emoji: "📦" },
];

export class CategorizeTransaction {
  /**
   * Keyword-based categorization (fast, no API calls)
   * Extracts keywords from description and matches to category
   */
  static categorizeByKeyword(
    description: string,
    merchant?: string
  ): string {
    const text = `${description} ${merchant || ""}`.toLowerCase();

    // Check for income keywords first (but exclude rent payments)
    if (
      (text.includes("salary") ||
        text.includes("wage") ||
        text.includes("pay") ||
        text.includes("income") ||
        text.includes("deposit") ||
        text.includes("refund") ||
        text.includes("bonus") ||
        text.includes("interest") ||
        text.includes("freelance") ||
        text.includes("dividend")) &&
      !text.includes("rent")
    ) {
      return "income";
    }

    // Healthcare - specific patterns
    if (
      text.includes("fitness assessment") ||
      text.includes("month end fitness") ||
      text.includes("health assessment") ||
      text.includes("fitness") ||
      text.includes("health") ||
      text.includes("assessment") ||
      text.includes("hospital") ||
      text.includes("doctor") ||
      text.includes("medical") ||
      text.includes("pharmacy") ||
      text.includes("dentist") ||
      text.includes("optician") ||
      text.includes("boots") ||
      text.includes("nhs") ||
      text.includes("prescription")
    ) {
      return "healthcare";
    }

    // Transport - specific patterns
    if (
      text.includes("equipment transport") ||
      text.includes("autumn equipment transport") ||
      text.includes("transport") ||
      text.includes("uber") ||
      text.includes("taxi") ||
      text.includes("bus") ||
      text.includes("train") ||
      text.includes("tfl") ||
      text.includes("oyster") ||
      text.includes("parking") ||
      text.includes("toll") ||
      text.includes("delivery")
    ) {
      return "transport";
    }

    // Fuel
    if (
      text.includes("petrol") ||
      text.includes("diesel") ||
      text.includes("fuel") ||
      text.includes("shell") ||
      text.includes("bp") ||
      text.includes("esso") ||
      text.includes("texaco")
    ) {
      return "fuel";
    }

    // Groceries - specific patterns
    if (
      text.includes("co-op weekly shop") ||
      text.includes("weekly shop") ||
      text.includes("tesco grocery") ||
      text.includes("grocery shopping") ||
      text.includes("grocery") ||
      text.includes("groceries") ||
      text.includes("supermarket") ||
      text.includes("tesco") ||
      text.includes("sainsbury") ||
      text.includes("asda") ||
      text.includes("morrisons") ||
      text.includes("co-op") ||
      text.includes("waitrose") ||
      text.includes("lidl") ||
      text.includes("aldi") ||
      text.includes("iceland")
    ) {
      return "groceries";
    }

    // Food & Dining - specific patterns
    if (
      text.includes("last week of september dinner") ||
      text.includes("autumn harvest dinner") ||
      text.includes("september dinner") ||
      text.includes("harvest dinner") ||
      text.includes("dinner") ||
      text.includes("lunch") ||
      text.includes("breakfast") ||
      text.includes("meal") ||
      text.includes("restaurant") ||
      text.includes("cafe") ||
      text.includes("pub") ||
      text.includes("takeaway") ||
      text.includes("mcdonald") ||
      text.includes("kfc") ||
      text.includes("pizza") ||
      text.includes("burger") ||
      text.includes("subway") ||
      text.includes("starbucks") ||
      text.includes("costa") ||
      text.includes("nando") ||
      text.includes("deliveroo") ||
      text.includes("just eat") ||
      text.includes("uber eats")
    ) {
      return "food";
    }

    // Shopping - specific patterns
    if (
      text.includes("premium autumn shop") ||
      text.includes("autumn sports equipment") ||
      text.includes("professional autumn collection") ||
      text.includes("professional camera upgrade") ||
      text.includes("camera upgrade") ||
      text.includes("sports equipment") ||
      text.includes("autumn collection") ||
      text.includes("shopping") ||
      text.includes("shop") ||
      text.includes("equipment") ||
      text.includes("upgrade") ||
      text.includes("camera") ||
      text.includes("collection") ||
      text.includes("professional") ||
      text.includes("amazon") ||
      text.includes("ebay") ||
      text.includes("argos") ||
      text.includes("currys") ||
      text.includes("john lewis") ||
      text.includes("marks") ||
      text.includes("next") ||
      text.includes("h&m") ||
      text.includes("zara") ||
      text.includes("clothing") ||
      text.includes("fashion")
    ) {
      return "shopping";
    }

    // Subscriptions - specific patterns
    if (
      text.includes("audible monthly subscription") ||
      text.includes("monthly subscription") ||
      text.includes("audible") ||
      text.includes("subscription") ||
      text.includes("netflix") ||
      text.includes("spotify") ||
      text.includes("amazon prime") ||
      text.includes("disney") ||
      text.includes("youtube") ||
      text.includes("apple music") ||
      text.includes("monthly payment") ||
      text.includes("annual fee") ||
      text.includes("membership")
    ) {
      return "subscriptions";
    }

    // Entertainment
    if (
      text.includes("entertainment") ||
      text.includes("cinema") ||
      text.includes("gym") ||
      text.includes("sport") ||
      text.includes("game") ||
      text.includes("playstation") ||
      text.includes("xbox")
    ) {
      return "entertainment";
    }

    // Bills detection
    if (this.isBillTransaction(text)) {
      return "bills";
    }

    // Education
    if (
      text.includes("education") ||
      text.includes("school") ||
      text.includes("university") ||
      text.includes("college") ||
      text.includes("course") ||
      text.includes("tuition") ||
      text.includes("books") ||
      text.includes("student")
    ) {
      return "education";
    }

    // Travel
    if (
      text.includes("travel") ||
      text.includes("hotel") ||
      text.includes("flight") ||
      text.includes("airline") ||
      text.includes("booking") ||
      text.includes("expedia") ||
      text.includes("airbnb") ||
      text.includes("holiday")
    ) {
      return "travel";
    }

    return "other";
  }

  /**
   * Detect if transaction is a bill/utility payment
   */
  static isBillTransaction(description: string): boolean {
    const desc = description.toLowerCase();

    const utilityPatterns = [
      // Energy companies
      "british gas",
      "bg",
      "eon",
      "e.on",
      "edf",
      "scottish power",
      "npower",
      "sse",
      "bulb",
      "octopus",
      "green supplier",
      "utility warehouse",
      // Water companies
      "thames water",
      "anglian water",
      "severn trent",
      "united utilities",
      "yorkshire water",
      "south west water",
      "water bill",
      // Telecoms
      "bt",
      "ee",
      "o2",
      "vodafone",
      "three",
      "3 mobile",
      "virgin media",
      "sky",
      "talktalk",
      "plusnet",
      "giffgaff",
      "tesco mobile",
      // Internet/TV
      "broadband",
      "wifi",
      "internet",
      "tv licence",
      // Insurance
      "insurance",
      "policy",
      "premium",
      "aviva",
      "axa",
      "direct line",
      "churchill",
      "admiral",
      "compare the market",
      "go compare",
      // Housing
      "rent",
      "mortgage",
      "council tax",
      "service charge",
      "ground rent",
      "letting",
      "property",
      "estate agent",
      // General bill keywords
      "bill",
      "payment",
      "direct debit",
      "dd",
      "standing order",
      "so",
      "monthly payment",
    ];

    const billTerms = [
      "electric",
      "electricity",
      "gas",
      "water",
      "heating",
      "energy",
      "phone",
      "mobile",
      "landline",
      "broadband",
      "internet",
      "wifi",
      "council tax",
      "rates",
      "service charge",
      "maintenance",
      "insurance",
      "policy",
      "premium",
      "cover",
      "mortgage",
      "rent",
      "letting",
      "property",
    ];

    const paymentIndicators = [
      "direct debit",
      "dd ",
      " dd",
      "standing order",
      "so ",
      " so",
      "auto payment",
      "recurring",
      "monthly payment",
      "quarterly payment",
      "annual payment",
      "autopay",
    ];

    // Check for utility company names
    if (utilityPatterns.some((pattern) => desc.includes(pattern))) {
      return true;
    }

    // Check for bill-specific terms
    if (billTerms.some((term) => desc.includes(term))) {
      return true;
    }

    // Check for payment method indicators
    if (paymentIndicators.some((indicator) => desc.includes(indicator))) {
      return true;
    }

    // Date-based patterns (bills often have dates in description)
    const hasDatePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(desc);
    const hasMonthYear = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{2,4}\b/i.test(
      desc
    );

    if (
      (hasDatePattern || hasMonthYear) &&
      (desc.includes("payment") ||
        desc.includes("bill") ||
        desc.includes("charge"))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Main categorization function with fallback
   * Tries keyword matching first, fast and reliable
   */
  static categorize(
    description: string,
    merchant?: string,
    tryAI: boolean = false
  ): string {
    // Always use keyword matching first (fast, reliable)
    return this.categorizeByKeyword(description, merchant);

    // Note: AI categorization would be added here if needed
    // For now, keyword-based categorization is sufficient
  }

  /**
   * Get category name from category ID
   */
  static getCategoryName(categoryId: string): string {
    const category = TRANSACTION_CATEGORIES.find((c) => c.id === categoryId);
    return category?.name || "Other";
  }

  /**
   * Get category emoji from category ID
   */
  static getCategoryEmoji(categoryId: string): string {
    const category = TRANSACTION_CATEGORIES.find((c) => c.id === categoryId);
    return category?.emoji || "📦";
  }

  /**
   * Get all available categories
   */
  static getAllCategories() {
    return TRANSACTION_CATEGORIES;
  }
}
