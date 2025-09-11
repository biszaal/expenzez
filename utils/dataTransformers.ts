// Centralized data transformation utilities to reduce code duplication

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  category: string;
  accountId: string;
  accountName: string;
  type: string;
  merchant?: string;
}

export interface Account {
  id: string;
  name: string;
  institution: Institution;
  balance: number;
  currency: string;
  type: string;
  status?: string;
}

export interface Institution {
  name: string;
  logo?: string;
  id?: string;
}

export interface CategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultBudget: number;
  spent: number;
  monthlySpent?: number;
}

export class DataTransformers {
  /**
   * Transform raw transaction data into standardized Transaction objects
   */
  static transformTransactions(rawTransactions: any[]): Transaction[] {
    if (!Array.isArray(rawTransactions)) {
      console.warn('[DataTransformers] Invalid transactions data provided:', rawTransactions);
      return [];
    }

    return rawTransactions.map((tx: any, idx: number) => ({
      id: tx.id || tx.transactionId || `tx-${idx}-${Date.now()}`,
      amount: tx.type === 'debit' ? -Math.abs(Number(tx.amount || 0)) : Math.abs(Number(tx.amount || 0)),
      currency: tx.currency || 'GBP',
      description: tx.description || tx.remittanceInformationUnstructured || 'Transaction',
      date: tx.date || tx.bookingDate || tx.createdAt || new Date().toISOString(),
      category: tx.category || this.inferCategoryFromDescription(tx.description || ''),
      accountId: tx.accountId || '',
      accountName: tx.accountName || 'Unknown Account',
      type: tx.type || (tx.amount < 0 ? 'debit' : 'credit'),
      merchant: tx.merchant || tx.creditorName || tx.debtorName,
    }));
  }

  /**
   * Transform raw account data into standardized Account objects
   */
  static transformAccounts(rawAccounts: any[]): Account[] {
    if (!Array.isArray(rawAccounts)) {
      console.warn('[DataTransformers] Invalid accounts data provided:', rawAccounts);
      return [];
    }

    return rawAccounts.map((account: any) => ({
      id: account.id || account.accountId || `acc-${Date.now()}`,
      name: account.name || account.displayName || `Account ${account.id?.slice(-4) || 'Unknown'}`,
      institution: this.transformInstitution(account.institution || account.institutionName),
      balance: this.parseAmount(account.balance || account.currentBalance),
      currency: account.currency || 'GBP',
      type: account.type || account.accountType || 'Current Account',
      status: account.status || 'active',
    }));
  }

  /**
   * Transform institution data
   */
  private static transformInstitution(institution: any): Institution {
    if (typeof institution === 'string') {
      return { name: institution, logo: undefined };
    }
    
    if (!institution) {
      return { name: 'Unknown Bank', logo: undefined };
    }

    return {
      id: institution.id,
      name: institution.name || institution.displayName || 'Unknown Bank',
      logo: institution.logo || institution.logoUrl,
    };
  }

  /**
   * Generate category data from transactions
   */
  static generateCategoriesFromTransactions(transactions: Transaction[]): CategoryData[] {
    const categoryMap = new Map<string, { count: number; totalSpent: number }>();
    
    transactions.forEach(tx => {
      if (tx.amount < 0) { // Only expenses
        const category = tx.category || 'Other';
        const existing = categoryMap.get(category) || { count: 0, totalSpent: 0 };
        categoryMap.set(category, {
          count: existing.count + 1,
          totalSpent: existing.totalSpent + Math.abs(tx.amount)
        });
      }
    });

    return Array.from(categoryMap.entries()).map(([name, data], index) => ({
      id: this.generateCategoryId(name),
      name,
      icon: this.getCategoryIcon(name),
      color: this.getCategoryColor(index),
      defaultBudget: 0, // Will be set by user or loaded from storage
      spent: data.totalSpent,
    }));
  }

  /**
   * Transform spending data by month
   */
  static transformSpendingByMonth(transactions: Transaction[]): Record<string, number> {
    const monthlySpending: Record<string, number> = {};
    
    transactions.forEach(tx => {
      if (tx.amount < 0 && tx.date) { // Only expenses with valid dates
        try {
          const monthKey = new Date(tx.date).toISOString().slice(0, 7); // YYYY-MM
          monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + Math.abs(tx.amount);
        } catch (error) {
          console.warn('[DataTransformers] Invalid transaction date:', tx.date);
        }
      }
    });

    return monthlySpending;
  }

  /**
   * Transform merchant data from transactions
   */
  static transformMerchantData(transactions: Transaction[]): {merchant: string; count: number; total: number}[] {
    const merchantMap = new Map<string, { count: number; total: number }>();
    
    transactions.forEach(tx => {
      if (tx.amount < 0) { // Only expenses
        const merchant = tx.merchant || tx.description || 'Unknown Merchant';
        const existing = merchantMap.get(merchant) || { count: 0, total: 0 };
        merchantMap.set(merchant, {
          count: existing.count + 1,
          total: existing.total + Math.abs(tx.amount)
        });
      }
    });

    return Array.from(merchantMap.entries())
      .map(([merchant, data]) => ({ merchant, ...data }))
      .sort((a, b) => b.total - a.total);
  }

  /**
   * Helper method to safely parse amount values
   */
  private static parseAmount(amount: any): number {
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount.replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    if (amount?.amount) return this.parseAmount(amount.amount);
    return 0;
  }

  /**
   * Infer category from transaction description
   */
  private static inferCategoryFromDescription(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('tesco') || desc.includes('sainsbury')) {
      return 'Groceries';
    }
    if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('mcdonald') || desc.includes('kfc')) {
      return 'Dining';
    }
    if (desc.includes('uber') || desc.includes('taxi') || desc.includes('transport') || desc.includes('bus')) {
      return 'Transport';
    }
    if (desc.includes('amazon') || desc.includes('shop') || desc.includes('retail')) {
      return 'Shopping';
    }
    if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('entertainment')) {
      return 'Entertainment';
    }
    if (desc.includes('gym') || desc.includes('fitness') || desc.includes('health')) {
      return 'Health & Fitness';
    }
    if (desc.includes('electric') || desc.includes('gas') || desc.includes('utility') || desc.includes('bill')) {
      return 'Utilities';
    }
    
    return 'Other';
  }

  /**
   * Generate consistent category ID from name
   */
  private static generateCategoryId(name: string): string {
    return name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Get category icon based on category name
   */
  private static getCategoryIcon(categoryName: string): string {
    const name = categoryName.toLowerCase();
    if (name.includes('food') || name.includes('dining') || name.includes('restaurant') || name.includes('groceries')) {
      return 'food-apple-outline';
    }
    if (name.includes('transport') || name.includes('travel') || name.includes('uber') || name.includes('taxi')) {
      return 'bus-clock';
    }
    if (name.includes('shop') || name.includes('retail') || name.includes('amazon')) {
      return 'bag-outline';
    }
    if (name.includes('entertainment') || name.includes('game') || name.includes('movie')) {
      return 'game-controller-outline';
    }
    if (name.includes('utility') || name.includes('electric') || name.includes('gas') || name.includes('bill')) {
      return 'flash-outline';
    }
    if (name.includes('health') || name.includes('fitness') || name.includes('gym') || name.includes('medical')) {
      return 'fitness-outline';
    }
    return 'pricetag-outline';
  }

  /**
   * Get category color based on index
   */
  private static getCategoryColor(index: number): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
      '#FF9FF3', '#95A5A6', '#F8B500', '#6C5CE7', '#A29BFE'
    ];
    return colors[index % colors.length];
  }

  /**
   * Format currency amount for display
   */
  static formatAmount(amount: number, currency: string = 'GBP'): string {
    try {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (error) {
      console.warn('[DataTransformers] Currency formatting error:', error);
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string, format: 'short' | 'long' | 'month' = 'short'): string {
    try {
      const date = new Date(dateString);
      
      switch (format) {
        case 'long':
          return date.toLocaleDateString('en-GB', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        case 'month':
          return date.toLocaleDateString('en-GB', { 
            year: 'numeric', 
            month: 'short' 
          });
        default:
          return date.toLocaleDateString('en-GB');
      }
    } catch (error) {
      console.warn('[DataTransformers] Date formatting error:', error);
      return dateString;
    }
  }
}