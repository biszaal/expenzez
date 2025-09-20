export interface CategoryRule {
  pattern: string;
  category: string;
  confidence: number;
}

export interface TransactionCategorizationResult {
  category: string;
  confidence: number;
  rule?: string;
}

export class CategorizationEngine {
  private static categoryRules: CategoryRule[] = [
    // Food & Dining
    { pattern: 'grocery|supermarket|food|restaurant|cafe|coffee|pizza|takeaway|mcdonald|burger|kfc', category: 'Food & Dining', confidence: 0.9 },
    { pattern: 'tesco|sainsbury|asda|morrisons|waitrose|aldi|lidl|iceland', category: 'Food & Dining', confidence: 0.95 },

    // Transportation
    { pattern: 'petrol|gas|fuel|station|shell|bp|esso|taxi|uber|lyft|train|bus|metro|tube', category: 'Transportation', confidence: 0.9 },
    { pattern: 'parking|car|vehicle|insurance|mot|servicing', category: 'Transportation', confidence: 0.8 },

    // Shopping
    { pattern: 'amazon|ebay|shop|store|retail|purchase|buy|clothing|fashion', category: 'Shopping', confidence: 0.8 },
    { pattern: 'argos|currys|john lewis|marks|spencer|h&m|zara|next|primark', category: 'Shopping', confidence: 0.9 },

    // Bills & Utilities
    { pattern: 'electric|electricity|gas|water|council|tax|phone|mobile|internet|broadband|netflix|spotify', category: 'Bills & Utilities', confidence: 0.9 },
    { pattern: 'british gas|edf|eon|thames water|bt|ee|o2|three|vodafone|sky', category: 'Bills & Utilities', confidence: 0.95 },

    // Entertainment
    { pattern: 'cinema|movie|theatre|entertainment|games|gaming|spotify|netflix|disney|amazon prime', category: 'Entertainment', confidence: 0.8 },

    // Health & Fitness
    { pattern: 'pharmacy|boots|gym|fitness|health|medical|doctor|dentist|hospital', category: 'Health & Fitness', confidence: 0.9 },

    // Banking & Finance
    { pattern: 'transfer|payment|fee|charge|interest|loan|mortgage|credit|debit', category: 'Banking & Finance', confidence: 0.8 },

    // Travel
    { pattern: 'hotel|booking|flight|airline|travel|holiday|vacation|ryanair|easyjet|british airways', category: 'Travel', confidence: 0.9 }
  ];

  static categorizeTransaction(description: string, amount: number): TransactionCategorizationResult {
    try {
      const cleanDescription = description.toLowerCase().trim();

      // Check against predefined rules
      for (const rule of this.categoryRules) {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(cleanDescription)) {
          return {
            category: rule.category,
            confidence: rule.confidence,
            rule: rule.pattern
          };
        }
      }

      // Default categorization based on amount patterns
      if (amount > 0) {
        return {
          category: 'Income',
          confidence: 0.7
        };
      }

      // If no specific pattern matches, return Other
      return {
        category: 'Other',
        confidence: 0.5
      };
    } catch (error) {
      console.error('Error categorizing transaction:', error);
      return {
        category: 'Other',
        confidence: 0.3
      };
    }
  }

  static async improveCategorizationModel(transactions: Array<{
    description: string;
    amount: number;
    userCategory?: string;
  }>): Promise<void> {
    try {
      console.log('Improving categorization model with', transactions.length, 'transactions');

      // In a real implementation, this would use machine learning to improve the model
      // For now, we'll just log the data for potential future use
      const userFeedback = transactions.filter(t => t.userCategory);
      console.log('User feedback received for', userFeedback.length, 'transactions');

      // Could implement simple learning by adding new rules based on user corrections
      for (const transaction of userFeedback) {
        if (transaction.userCategory && transaction.userCategory !== 'Other') {
          console.log(`Learning: "${transaction.description}" -> ${transaction.userCategory}`);
        }
      }
    } catch (error) {
      console.error('Error improving categorization model:', error);
    }
  }

  static getAvailableCategories(): string[] {
    const categories = [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Bills & Utilities',
      'Entertainment',
      'Health & Fitness',
      'Banking & Finance',
      'Travel',
      'Income',
      'Other'
    ];

    return categories.sort();
  }

  static getCategoryRules(): CategoryRule[] {
    return [...this.categoryRules];
  }

  static addCustomRule(pattern: string, category: string, confidence: number = 0.8): void {
    try {
      this.categoryRules.unshift({
        pattern: pattern.toLowerCase(),
        category,
        confidence: Math.min(Math.max(confidence, 0), 1) // Clamp between 0 and 1
      });
      console.log('Added custom categorization rule:', pattern, '->', category);
    } catch (error) {
      console.error('Error adding custom rule:', error);
    }
  }

  static removeCustomRule(pattern: string): boolean {
    try {
      const initialLength = this.categoryRules.length;
      this.categoryRules = this.categoryRules.filter(rule => rule.pattern !== pattern.toLowerCase());
      const removed = this.categoryRules.length < initialLength;

      if (removed) {
        console.log('Removed custom categorization rule:', pattern);
      }

      return removed;
    } catch (error) {
      console.error('Error removing custom rule:', error);
      return false;
    }
  }

  static async batchCategorize(transactions: Array<{
    id: string;
    description: string;
    amount: number;
  }>): Promise<Array<{
    id: string;
    category: string;
    confidence: number;
  }>> {
    try {
      return transactions.map(transaction => {
        const result = this.categorizeTransaction(transaction.description, transaction.amount);
        return {
          id: transaction.id,
          category: result.category,
          confidence: result.confidence
        };
      });
    } catch (error) {
      console.error('Error batch categorizing transactions:', error);
      return transactions.map(t => ({
        id: t.id,
        category: 'Other',
        confidence: 0.3
      }));
    }
  }
}