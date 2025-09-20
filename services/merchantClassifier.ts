/**
 * Merchant Classification Service
 * Distinguishes between variable retail expenses and true recurring bills
 */

export interface MerchantClassification {
  type: 'bill' | 'retail' | 'unknown';
  category: string;
  confidence: number;
  requiresAmountConsistency: boolean;
}

export class MerchantClassifier {

  // Merchants that should NEVER be considered bills (variable retail spending)
  private static RETAIL_EXCLUSIONS = [
    // Grocery Stores
    'aldi', 'tesco', 'sainsbury', 'asda', 'morrisons', 'lidl', 'iceland', 'coop', 'waitrose',
    'marks spencer', 'm&s', 'whole foods', 'trader joe', 'kroger', 'safeway', 'publix',
    'ms groceries', 'grocery', 'groceries', 'supermarket', 'market', 'food store',

    // Restaurants & Food
    'mcdonalds', 'burger king', 'kfc', 'subway', 'starbucks', 'costa', 'nandos',
    'pizza hut', 'dominos', 'papa johns', 'restaurant', 'cafe', 'bistro', 'diner',
    'takeaway', 'delivery', 'ubereats', 'deliveroo', 'just eat', 'doordash',

    // Retail Stores
    'amazon', 'argos', 'john lewis', 'next', 'primark', 'h&m', 'zara', 'uniqlo',
    'boots', 'superdrug', 'currys', 'pc world', 'dixons', 'carphone warehouse',
    'target', 'walmart', 'costco', 'best buy', 'home depot', 'lowes',

    // Gas Stations
    'shell', 'bp', 'esso', 'texaco', 'chevron', 'exxon', 'mobil', 'petrol', 'fuel',
    'gas station', 'service station',

    // General Retail Categories
    'shop', 'store', 'retail', 'department store', 'clothing', 'fashion',
    'electronics', 'pharmacy', 'chemist', 'hardware'
  ];

  // Merchants that are likely to be bills (subscriptions, utilities, insurance)
  private static BILL_INCLUSIONS = [
    // Utilities
    'british gas', 'eon', 'edf', 'scottish power', 'npower', 'bulb', 'octopus energy',
    'thames water', 'severn trent', 'anglian water', 'united utilities', 'yorkshire water',
    'bt', 'virgin media', 'sky', 'ee', 'vodafone', 'three', 'o2', 'plusnet', 'talktalk',
    'council tax', 'rates', 'water', 'electricity', 'gas', 'energy', 'power',
    'broadband', 'internet', 'wifi', 'phone', 'mobile', 'landline', 'telecom',

    // Insurance
    'aviva', 'admiral', 'direct line', 'churchill', 'axa', 'zurich', 'hastings',
    'compare the market', 'confused.com', 'go compare', 'money supermarket',
    'insurance', 'policy', 'premium', 'cover', 'protection',

    // Subscriptions & Software
    'netflix', 'amazon prime', 'spotify', 'apple music', 'youtube premium', 'disney plus',
    'microsoft', 'office 365', 'adobe', 'dropbox', 'icloud', 'google drive',
    'github', 'zoom', 'slack', 'figma', 'canva', 'notion', 'evernote',
    'nordvpn', 'expressvpn', 'subscription', 'premium', 'pro', 'plus',

    // Fitness & Memberships
    'gym', 'fitness', 'puregym', 'david lloyd', 'virgin active', 'nuffield health',
    'membership', 'club', 'studio', 'yoga', 'pilates',

    // Financial Services
    'loan', 'mortgage', 'credit card', 'bank', 'finance', 'payment', 'installment',
    'direct debit', 'standing order', 'autopay', 'recurring',

    // Transport
    'tfl', 'oyster', 'contactless', 'season ticket', 'rail', 'train', 'bus pass',
    'congestion charge', 'parking permit', 'car tax', 'mot', 'vehicle',

    // Housing
    'rent', 'mortgage', 'property', 'estate', 'letting', 'housing', 'maintenance'
  ];

  // Payment method patterns that indicate bills
  private static BILL_PAYMENT_PATTERNS = [
    'direct debit', 'dd', 'standing order', 'so', 'autopay', 'auto pay',
    'recurring payment', 'subscription', 'monthly payment', 'annual payment',
    'premium', 'policy', 'membership', 'service charge'
  ];

  /**
   * Classify a merchant to determine if it should be considered for bill detection
   */
  static classifyMerchant(merchant: string, description?: string): MerchantClassification {
    const normalizedMerchant = merchant.toLowerCase().trim();
    const fullText = `${normalizedMerchant} ${(description || '').toLowerCase()}`.trim();

    // Check for explicit retail exclusions first
    for (const retailPattern of this.RETAIL_EXCLUSIONS) {
      if (normalizedMerchant.includes(retailPattern) || fullText.includes(retailPattern)) {
        return {
          type: 'retail',
          category: this.categorizeRetail(normalizedMerchant),
          confidence: 0.9,
          requiresAmountConsistency: false
        };
      }
    }

    // Check for explicit bill inclusions
    for (const billPattern of this.BILL_INCLUSIONS) {
      if (normalizedMerchant.includes(billPattern) || fullText.includes(billPattern)) {
        return {
          type: 'bill',
          category: this.categorizeBill(normalizedMerchant, fullText),
          confidence: 0.8,
          requiresAmountConsistency: true
        };
      }
    }

    // Check for bill payment patterns in description
    for (const pattern of this.BILL_PAYMENT_PATTERNS) {
      if (fullText.includes(pattern)) {
        return {
          type: 'bill',
          category: this.categorizeBill(normalizedMerchant, fullText),
          confidence: 0.7,
          requiresAmountConsistency: true
        };
      }
    }

    // Unknown merchant - let amount consistency determine eligibility
    return {
      type: 'unknown',
      category: 'Other',
      confidence: 0.3,
      requiresAmountConsistency: true
    };
  }

  /**
   * Additional check for amount consistency requirement
   */
  static requiresHighAmountConsistency(classification: MerchantClassification): boolean {
    return classification.type === 'bill' || classification.type === 'unknown';
  }

  /**
   * Check if merchant should be excluded from bill detection entirely
   */
  static shouldExcludeFromBills(merchant: string, description?: string): boolean {
    const classification = this.classifyMerchant(merchant, description);
    return classification.type === 'retail';
  }

  /**
   * Get minimum confidence threshold based on merchant type
   */
  static getMinConfidenceThreshold(classification: MerchantClassification): number {
    switch (classification.type) {
      case 'bill':
        return 0.4; // Lower threshold for known bill merchants
      case 'retail':
        return 1.0; // Impossible threshold - should be excluded
      case 'unknown':
        return 0.7; // Higher threshold for unknown merchants
      default:
        return 0.5;
    }
  }

  /**
   * Categorize retail merchants
   */
  private static categorizeRetail(merchant: string): string {
    if (this.matchesAny(merchant, ['grocery', 'aldi', 'tesco', 'sainsbury', 'asda', 'morrisons', 'lidl', 'iceland', 'coop'])) {
      return 'Groceries';
    }
    if (this.matchesAny(merchant, ['restaurant', 'cafe', 'mcdonald', 'burger', 'pizza', 'starbucks', 'costa'])) {
      return 'Dining';
    }
    if (this.matchesAny(merchant, ['amazon', 'argos', 'john lewis', 'next', 'primark', 'shop', 'store'])) {
      return 'Shopping';
    }
    if (this.matchesAny(merchant, ['shell', 'bp', 'esso', 'petrol', 'fuel', 'gas station'])) {
      return 'Fuel';
    }
    return 'Retail';
  }

  /**
   * Categorize bill merchants
   */
  private static categorizeBill(merchant: string, fullText: string): string {
    const text = `${merchant} ${fullText}`.toLowerCase();

    if (this.matchesAny(text, ['electric', 'gas', 'water', 'energy', 'utility', 'council tax', 'rates'])) {
      return 'Utilities';
    }
    if (this.matchesAny(text, ['netflix', 'spotify', 'amazon prime', 'subscription', 'premium', 'disney', 'youtube'])) {
      return 'Subscriptions';
    }
    if (this.matchesAny(text, ['insurance', 'aviva', 'admiral', 'policy', 'premium', 'cover'])) {
      return 'Insurance';
    }
    if (this.matchesAny(text, ['gym', 'fitness', 'membership', 'club', 'studio'])) {
      return 'Fitness';
    }
    if (this.matchesAny(text, ['rent', 'mortgage', 'property', 'housing', 'estate'])) {
      return 'Housing';
    }
    if (this.matchesAny(text, ['phone', 'mobile', 'broadband', 'internet', 'bt', 'virgin', 'sky', 'ee', 'vodafone'])) {
      return 'Communications';
    }
    if (this.matchesAny(text, ['loan', 'credit', 'finance', 'bank', 'payment'])) {
      return 'Financial';
    }
    if (this.matchesAny(text, ['transport', 'tfl', 'oyster', 'rail', 'train', 'bus', 'car tax'])) {
      return 'Transportation';
    }

    return 'Other';
  }

  /**
   * Helper method to check if text matches any of the patterns
   */
  private static matchesAny(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }

  /**
   * Get variance threshold based on merchant classification
   */
  static getAmountVarianceThreshold(classification: MerchantClassification): number {
    switch (classification.type) {
      case 'bill':
        return 0.05; // 5% variance for known bills (very strict)
      case 'retail':
        return 1.0; // 100% variance allowed (but will be excluded anyway)
      case 'unknown':
        return 0.03; // 3% variance for unknown (very strict to avoid false positives)
      default:
        return 0.1;
    }
  }
}

export default MerchantClassifier;