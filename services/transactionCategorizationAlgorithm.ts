import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  merchant: string;
  category?: string;
  accountId: string;
  bankName?: string;
  type: 'debit' | 'credit';
  originalAmount?: number; // Original signed amount for display
  originalCategory?: string; // Store original auto-detected category
  userCategory?: string; // User-assigned category
  isIgnored?: boolean; // User chose to ignore for budget calculations
  isInternalTransfer?: boolean; // Detected as internal transfer
  confidence?: number; // Confidence in auto-categorization
}

export interface CategoryRule {
  id: string;
  merchantPattern: string; // Normalized merchant name pattern
  category: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  userDefined: boolean; // Whether user manually set this rule
  transactionCount: number; // How many transactions this rule has categorized
}

export interface TransactionCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  keywords: string[];
  parentCategory?: string;
  isCustom?: boolean;
  budgetRelevant: boolean; // Whether this category should count towards budget
}

export class TransactionCategorizationAlgorithm {
  private transactions: Transaction[];
  private categories: TransactionCategory[];
  private userRules: CategoryRule[] = [];
  private readonly INTERNAL_TRANSFER_KEYWORDS = [
    'transfer', 'tfr', 'internal', 'between accounts', 'account transfer',
    'online transfer', 'mobile transfer', 'instant transfer', 'wire transfer',
    'savings transfer', 'checking transfer', 'balance transfer'
  ];

  constructor(transactions: Transaction[]) {
    this.transactions = transactions;
    this.categories = this.getDefaultCategories();
    this.loadUserRules();
  }

  /**
   * Default transaction categories with keywords and budget relevance
   */
  private getDefaultCategories(): TransactionCategory[] {
    return [
      {
        id: 'groceries',
        name: 'Groceries',
        icon: 'basket-outline',
        color: '#10B981',
        description: 'Food and household essentials',
        keywords: [
          'supermarket', 'grocery', 'tesco', 'sainsbury', 'asda', 'morrisons', 
          'lidl', 'aldi', 'waitrose', 'iceland', 'coop', 'co-op', 'marks spencer',
          'm&s food', 'whole foods', 'organic', 'fresh market', 'food store',
          'mini market', 'convenience store', 'corner shop'
        ],
        budgetRelevant: true
      },
      {
        id: 'shopping',
        name: 'Shopping',
        icon: 'bag-outline',
        color: '#8B5CF6',
        description: 'Retail purchases and non-essentials',
        keywords: [
          'amazon', 'ebay', 'john lewis', 'next', 'h&m', 'zara', 'primark',
          'argos', 'currys', 'dixons', 'boots', 'superdrug', 'department store',
          'retail', 'shopping centre', 'outlet', 'fashion', 'clothing', 'shoes',
          'electronics', 'gadgets', 'homeware', 'furniture', 'ikea', 'b&q',
          'wickes', 'homebase', 'screwfix', 'toolstation'
        ],
        budgetRelevant: true
      },
      {
        id: 'dining',
        name: 'Dining Out',
        icon: 'restaurant-outline',
        color: '#F59E0B',
        description: 'Restaurants, takeaways, and food delivery',
        keywords: [
          'restaurant', 'cafe', 'coffee', 'pub', 'bar', 'takeaway', 'delivery',
          'mcdonald', 'kfc', 'burger king', 'subway', 'pizza hut', 'dominos',
          'nandos', 'greggs', 'costa', 'starbucks', 'pret', 'eat', 'wagamama',
          'pizza express', 'tgi friday', 'harvester', 'weatherspoon', 'uber eats',
          'deliveroo', 'just eat', 'foodhub', 'food delivery', 'takeout'
        ],
        budgetRelevant: true
      },
      {
        id: 'transport',
        name: 'Transportation',
        icon: 'car-outline',
        color: '#3B82F6',
        description: 'Travel, fuel, and transportation costs',
        keywords: [
          'petrol', 'fuel', 'gas station', 'shell', 'bp', 'esso', 'texaco',
          'bus', 'train', 'tube', 'underground', 'taxi', 'uber', 'lyft',
          'parking', 'congestion', 'toll', 'oyster', 'transport for london',
          'tfl', 'national rail', 'first bus', 'stagecoach', 'arriva',
          'car park', 'airline', 'flight', 'airport', 'easyjet', 'ryanair',
          'british airways', 'virgin', 'rail'
        ],
        budgetRelevant: true
      },
      {
        id: 'utilities',
        name: 'Utilities & Bills',
        icon: 'flash-outline',
        color: '#EF4444',
        description: 'Essential utilities and recurring bills',
        keywords: [
          'electric', 'electricity', 'gas', 'water', 'council tax', 'broadband',
          'internet', 'phone', 'mobile', 'bt', 'sky', 'virgin media', 'ee',
          'o2', 'vodafone', 'three', 'plusnet', 'talktalk', 'utility',
          'british gas', 'eon', 'edf', 'scottish power', 'npower', 'bulb',
          'octopus energy', 'thames water', 'anglian water', 'severn trent'
        ],
        budgetRelevant: true
      },
      {
        id: 'entertainment',
        name: 'Entertainment',
        icon: 'musical-notes-outline',
        color: '#EC4899',
        description: 'Movies, streaming, games, and leisure',
        keywords: [
          'netflix', 'spotify', 'disney', 'amazon prime', 'apple music',
          'cinema', 'odeon', 'vue', 'cineworld', 'theatre', 'concert',
          'game', 'steam', 'playstation', 'xbox', 'nintendo', 'gym',
          'fitness', 'subscription', 'streaming', 'music', 'books',
          'kindle', 'audible', 'youtube premium'
        ],
        budgetRelevant: true
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        icon: 'medical-outline',
        color: '#06B6D4',
        description: 'Medical expenses and health services',
        keywords: [
          'pharmacy', 'boots', 'superdrug', 'lloyds pharmacy', 'chemist',
          'hospital', 'clinic', 'dental', 'dentist', 'doctor', 'gp',
          'medical', 'health', 'prescription', 'medicine', 'nhs',
          'private healthcare', 'bupa', 'insurance', 'optical', 'specsavers',
          'vision express', 'glasses', 'contact lenses'
        ],
        budgetRelevant: true
      },
      {
        id: 'education',
        name: 'Education',
        icon: 'school-outline',
        color: '#7C3AED',
        description: 'Learning, courses, and educational expenses',
        keywords: [
          'university', 'college', 'school', 'course', 'training', 'education',
          'tuition', 'student', 'learning', 'certification', 'exam',
          'books', 'academic', 'udemy', 'coursera', 'skillshare', 'masterclass'
        ],
        budgetRelevant: true
      },
      {
        id: 'savings',
        name: 'Savings & Investments',
        icon: 'trending-up-outline',
        color: '#059669',
        description: 'Savings transfers and investments',
        keywords: [
          'savings', 'investment', 'isa', 'pension', 'stocks', 'shares',
          'fund', 'portfolio', 'trading', 'crypto', 'bitcoin', 'vanguard',
          'blackrock', 'nutmeg', 'monzo', 'starling', 'halifax savings'
        ],
        budgetRelevant: false // Savings shouldn't count against budget
      },
      {
        id: 'income',
        name: 'Income',
        icon: 'cash-outline',
        color: '#10B981',
        description: 'Salary, freelance, and other income',
        keywords: [
          'salary', 'wage', 'pay', 'payroll', 'freelance', 'consulting',
          'dividend', 'interest', 'refund', 'cashback', 'bonus', 'commission',
          'hmrc', 'tax refund', 'benefits', 'pension payment'
        ],
        budgetRelevant: false // Income shouldn't count against budget
      },
      {
        id: 'transfers',
        name: 'Internal Transfers',
        icon: 'swap-horizontal-outline',
        color: '#6B7280',
        description: 'Transfers between your own accounts',
        keywords: this.INTERNAL_TRANSFER_KEYWORDS,
        budgetRelevant: false // Internal transfers shouldn't affect budget
      },
      {
        id: 'other',
        name: 'Other',
        icon: 'ellipsis-horizontal-outline',
        color: '#6B7280',
        description: 'Uncategorized transactions',
        keywords: [],
        budgetRelevant: true
      }
    ];
  }

  /**
   * Load user-defined categorization rules
   */
  private async loadUserRules(): Promise<void> {
    try {
      const storedRules = await AsyncStorage.getItem('user_category_rules');
      if (storedRules) {
        this.userRules = JSON.parse(storedRules);
      }
    } catch (error) {
      console.error('Failed to load user rules:', error);
    }
  }

  /**
   * Save user-defined categorization rules
   */
  private async saveUserRules(): Promise<void> {
    try {
      await AsyncStorage.setItem('user_category_rules', JSON.stringify(this.userRules));
    } catch (error) {
      console.error('Failed to save user rules:', error);
    }
  }

  /**
   * Main method to categorize all transactions
   */
  async categorizeTransactions(): Promise<Transaction[]> {
    const categorizedTransactions: Transaction[] = [];

    for (const transaction of this.transactions) {
      const categorized = await this.categorizeTransaction(transaction);
      categorizedTransactions.push(categorized);
    }

    return categorizedTransactions;
  }

  /**
   * Categorize a single transaction
   */
  private async categorizeTransaction(transaction: Transaction): Promise<Transaction> {
    // Don't re-categorize if user has manually set a category
    if (transaction.userCategory) {
      return {
        ...transaction,
        category: transaction.userCategory
      };
    }

    // Check if transaction is ignored
    if (transaction.isIgnored) {
      return transaction;
    }

    // Detect internal transfers first
    if (this.isInternalTransfer(transaction)) {
      return {
        ...transaction,
        category: 'transfers',
        isInternalTransfer: true,
        originalCategory: 'transfers',
        confidence: 0.95
      };
    }

    // Check user-defined rules first
    const userRule = this.findMatchingUserRule(transaction);
    if (userRule) {
      return {
        ...transaction,
        category: userRule.category,
        originalCategory: userRule.category,
        confidence: userRule.confidence
      };
    }

    // Use AI-powered categorization
    const aiCategory = this.aiCategorizeTransaction(transaction);
    
    return {
      ...transaction,
      category: aiCategory.category,
      originalCategory: aiCategory.category,
      confidence: aiCategory.confidence
    };
  }

  /**
   * Detect if a transaction is an internal transfer
   */
  private isInternalTransfer(transaction: Transaction): boolean {
    const description = transaction.description.toLowerCase();
    const merchant = transaction.merchant.toLowerCase();
    const combinedText = `${description} ${merchant}`;

    // Check for internal transfer keywords
    const hasTransferKeywords = this.INTERNAL_TRANSFER_KEYWORDS.some(keyword =>
      combinedText.includes(keyword)
    );

    // Check for account-to-account patterns
    const hasAccountPattern = /account.*\d+.*account.*\d+|transfer.*account|account.*transfer/i.test(combinedText);

    // Check for bank-specific patterns
    const hasBankPattern = /^(monzo|starling|halifax|lloyds|barclays|hsbc|natwest|santander)/i.test(merchant) &&
                          /transfer|move|between/i.test(description);

    // Check if it's a round number (common for manual transfers)
    const isRoundAmount = transaction.amount % 10 === 0 || transaction.amount % 5 === 0;

    // Combine signals for confidence scoring
    if (hasTransferKeywords || hasAccountPattern || hasBankPattern) {
      return true;
    }

    // Lower confidence detection for potential transfers
    if (isRoundAmount && /^[A-Z0-9\s-]+$/i.test(description) && transaction.amount >= 10) {
      return true;
    }

    return false;
  }

  /**
   * Find matching user-defined rule
   */
  private findMatchingUserRule(transaction: Transaction): CategoryRule | null {
    const normalizedMerchant = this.normalizeMerchantName(transaction.merchant);
    
    return this.userRules.find(rule => {
      const pattern = rule.merchantPattern.toLowerCase();
      return normalizedMerchant.includes(pattern) || pattern.includes(normalizedMerchant);
    }) || null;
  }

  /**
   * AI-powered transaction categorization using multiple signals
   */
  private aiCategorizeTransaction(transaction: Transaction): { category: string; confidence: number } {
    const description = transaction.description.toLowerCase();
    const merchant = transaction.merchant.toLowerCase();
    const amount = transaction.amount;
    const combinedText = `${description} ${merchant}`;

    let bestMatch: { category: string; confidence: number } = {
      category: 'other',
      confidence: 0.3
    };

    // Check each category for keyword matches
    for (const category of this.categories) {
      if (category.id === 'other' || category.id === 'transfers') continue;

      const matchScore = this.calculateCategoryMatchScore(combinedText, category, amount);
      
      if (matchScore > bestMatch.confidence) {
        bestMatch = {
          category: category.id,
          confidence: matchScore
        };
      }
    }

    // Apply business logic adjustments
    bestMatch = this.applyBusinessLogic(transaction, bestMatch);

    return bestMatch;
  }

  /**
   * Calculate match score for a category
   */
  private calculateCategoryMatchScore(text: string, category: TransactionCategory, amount: number): number {
    let score = 0;
    let matchCount = 0;

    // Keyword matching with weighted scoring
    for (const keyword of category.keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Exact match gets highest score
      if (text.includes(keywordLower)) {
        if (text.includes(` ${keywordLower} `) || text.startsWith(keywordLower) || text.endsWith(keywordLower)) {
          score += 0.8; // Exact word match
        } else {
          score += 0.6; // Partial match
        }
        matchCount++;
      }
      
      // Fuzzy matching for similar words
      const similarity = this.calculateStringSimilarity(text, keywordLower);
      if (similarity > 0.7) {
        score += similarity * 0.4;
        matchCount++;
      }
    }

    // Normalize score based on number of keywords
    if (matchCount > 0) {
      score = score / category.keywords.length;
    }

    // Amount-based adjustments
    score = this.adjustScoreByAmount(score, amount, category.id);

    return Math.min(score, 0.95); // Cap at 95% confidence
  }

  /**
   * Apply business logic to categorization
   */
  private applyBusinessLogic(transaction: Transaction, match: { category: string; confidence: number }): { category: string; confidence: number } {
    const amount = transaction.amount;
    const merchant = transaction.merchant.toLowerCase();
    
    // High-confidence overrides for specific patterns
    if (merchant.includes('tesco') || merchant.includes('sainsbury') || merchant.includes('asda')) {
      return { category: 'groceries', confidence: 0.9 };
    }
    
    if (merchant.includes('amazon') && amount < 50) {
      return { category: 'shopping', confidence: 0.85 };
    }
    
    if (merchant.includes('mcdonald') || merchant.includes('kfc') || merchant.includes('uber eats')) {
      return { category: 'dining', confidence: 0.9 };
    }

    // Income detection
    if (transaction.type === 'credit' && amount > 500) {
      if (merchant.includes('salary') || merchant.includes('wage') || merchant.includes('pay')) {
        return { category: 'income', confidence: 0.95 };
      }
    }

    // Small amounts are likely miscellaneous
    if (amount < 5 && match.confidence < 0.7) {
      return { category: 'other', confidence: 0.6 };
    }

    return match;
  }

  /**
   * Adjust score based on transaction amount patterns
   */
  private adjustScoreByAmount(score: number, amount: number, categoryId: string): number {
    switch (categoryId) {
      case 'groceries':
        // Grocery amounts typically range £10-£200
        if (amount >= 10 && amount <= 200) score += 0.1;
        if (amount < 5 || amount > 500) score -= 0.2;
        break;
        
      case 'dining':
        // Dining amounts typically range £5-£100
        if (amount >= 5 && amount <= 100) score += 0.1;
        if (amount < 3 || amount > 200) score -= 0.1;
        break;
        
      case 'utilities':
        // Utilities typically have consistent amounts £20-£300
        if (amount >= 20 && amount <= 300) score += 0.1;
        break;
        
      case 'transport':
        // Transport can vary widely, but small amounts are common
        if (amount <= 50) score += 0.05;
        break;
    }
    
    return score;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const matrix: number[][] = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const distance = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  }

  /**
   * Normalize merchant name for consistent matching
   */
  private normalizeMerchantName(merchant: string): string {
    return merchant
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\b(ltd|limited|inc|corp|llc|co|plc)\b/g, '')
      .trim();
  }

  /**
   * Update transaction category (user action)
   */
  async updateTransactionCategory(transactionId: string, newCategory: string): Promise<Transaction[]> {
    const transaction = this.transactions.find(t => t.id === transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Update the transaction
    transaction.userCategory = newCategory;
    transaction.category = newCategory;

    // Create or update user rule
    await this.createUserRule(transaction, newCategory);

    return this.transactions;
  }

  /**
   * Find similar transactions for bulk categorization
   */
  findSimilarTransactions(transactionId: string): Transaction[] {
    const transaction = this.transactions.find(t => t.id === transactionId);
    if (!transaction) return [];

    const normalizedMerchant = this.normalizeMerchantName(transaction.merchant);
    
    return this.transactions.filter(t => 
      t.id !== transactionId &&
      this.normalizeMerchantName(t.merchant) === normalizedMerchant &&
      !t.userCategory && // Only include uncategorized transactions
      Math.abs(t.amount - transaction.amount) / transaction.amount <= 0.3 // Within 30% amount variance
    );
  }

  /**
   * Apply category to multiple transactions
   */
  async applyCategoryToSimilarTransactions(transactionIds: string[], category: string): Promise<void> {
    for (const id of transactionIds) {
      const transaction = this.transactions.find(t => t.id === id);
      if (transaction) {
        transaction.userCategory = category;
        transaction.category = category;
      }
    }

    // Create user rule based on first transaction
    const firstTransaction = this.transactions.find(t => t.id === transactionIds[0]);
    if (firstTransaction) {
      await this.createUserRule(firstTransaction, category);
    }
  }

  /**
   * Create or update user categorization rule
   */
  private async createUserRule(transaction: Transaction, category: string): Promise<void> {
    const normalizedMerchant = this.normalizeMerchantName(transaction.merchant);
    
    // Check if rule already exists
    const existingRuleIndex = this.userRules.findIndex(rule => 
      rule.merchantPattern === normalizedMerchant
    );

    const now = dayjs().toISOString();

    if (existingRuleIndex >= 0) {
      // Update existing rule
      this.userRules[existingRuleIndex] = {
        ...this.userRules[existingRuleIndex],
        category,
        confidence: 0.95,
        updatedAt: now,
        transactionCount: this.userRules[existingRuleIndex].transactionCount + 1
      };
    } else {
      // Create new rule
      const newRule: CategoryRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        merchantPattern: normalizedMerchant,
        category,
        confidence: 0.95,
        createdAt: now,
        updatedAt: now,
        userDefined: true,
        transactionCount: 1
      };
      
      this.userRules.push(newRule);
    }

    await this.saveUserRules();
  }

  /**
   * Toggle transaction ignore status
   */
  toggleTransactionIgnore(transactionId: string): Transaction | null {
    const transaction = this.transactions.find(t => t.id === transactionId);
    if (!transaction) return null;

    transaction.isIgnored = !transaction.isIgnored;
    return transaction;
  }

  /**
   * Get transactions for budget calculation (excludes ignored and non-budget-relevant)
   */
  getBudgetRelevantTransactions(): Transaction[] {
    return this.transactions.filter(transaction => {
      if (transaction.isIgnored) return false;
      if (transaction.isInternalTransfer) return false;
      if (transaction.type === 'credit') return false; // Exclude income
      
      const category = this.categories.find(c => c.id === transaction.category);
      return category?.budgetRelevant !== false;
    });
  }

  /**
   * Get spending by category for budget tracking
   */
  getSpendingByCategory(startDate?: string, endDate?: string): { [categoryId: string]: number } {
    const relevantTransactions = this.getBudgetRelevantTransactions();
    
    const filteredTransactions = relevantTransactions.filter(transaction => {
      if (startDate && dayjs(transaction.date).isBefore(dayjs(startDate))) return false;
      if (endDate && dayjs(transaction.date).isAfter(dayjs(endDate))) return false;
      return true;
    });

    const spendingByCategory: { [categoryId: string]: number } = {};
    
    filteredTransactions.forEach(transaction => {
      const category = transaction.category || 'other';
      spendingByCategory[category] = (spendingByCategory[category] || 0) + transaction.amount;
    });

    return spendingByCategory;
  }

  /**
   * Get all available categories
   */
  getCategories(): TransactionCategory[] {
    return this.categories;
  }

  /**
   * Get user-defined rules
   */
  getUserRules(): CategoryRule[] {
    return this.userRules;
  }

  /**
   * Delete user rule
   */
  async deleteUserRule(ruleId: string): Promise<void> {
    this.userRules = this.userRules.filter(rule => rule.id !== ruleId);
    await this.saveUserRules();
  }
}

export default TransactionCategorizationAlgorithm;