import dayjs from 'dayjs';

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
}

export interface DetectedBill {
  id: string;
  name: string;
  merchant: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  category: string;
  nextDueDate: string;
  lastPaymentDate: string;
  accountId: string;
  bankName: string;
  confidence: number; // 0-1 score of detection confidence
  transactions: Transaction[];
  status: 'active' | 'cancelled' | 'irregular';
  averageAmount: number;
  dayOfMonth?: number; // For monthly bills
  dayOfWeek?: number; // For weekly bills
}

export class BillTrackingAlgorithm {
  private transactions: Transaction[];
  private minConfidence: number = 0.7;
  private minOccurrences: number = 2;

  constructor(transactions: Transaction[]) {
    this.transactions = transactions.sort((a, b) => 
      dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    );
  }

  /**
   * Main method to detect all recurring bills and subscriptions
   */
  detectBills(): DetectedBill[] {
    const merchantGroups = this.groupTransactionsByMerchant();
    const detectedBills: DetectedBill[] = [];

    for (const [merchant, transactions] of merchantGroups) {
      // Skip if not enough transactions to establish pattern
      if (transactions.length < this.minOccurrences) continue;

      const bills = this.analyzeTransactionPattern(merchant, transactions);
      detectedBills.push(...bills);
    }

    // Sort by confidence and filter by minimum confidence
    return detectedBills
      .filter(bill => bill.confidence >= this.minConfidence)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Group transactions by merchant/description patterns
   */
  private groupTransactionsByMerchant(): Map<string, Transaction[]> {
    const groups = new Map<string, Transaction[]>();

    for (const transaction of this.transactions) {
      if (transaction.type !== 'debit') continue; // Only track outgoing payments

      const normalizedMerchant = this.normalizeMerchantName(transaction.merchant);
      
      if (!groups.has(normalizedMerchant)) {
        groups.set(normalizedMerchant, []);
      }
      
      groups.get(normalizedMerchant)!.push(transaction);
    }

    return groups;
  }

  /**
   * Normalize merchant names to group similar transactions
   */
  private normalizeMerchantName(merchant: string): string {
    return merchant
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\b(ltd|limited|inc|corp|llc|co)\b/g, '')
      .replace(/\b(payment|autopay|auto|recurring)\b/g, '')
      .trim();
  }

  /**
   * Analyze transaction patterns for a specific merchant
   */
  private analyzeTransactionPattern(merchant: string, transactions: Transaction[]): DetectedBill[] {
    const bills: DetectedBill[] = [];
    
    // Group by similar amounts (±10% variance)
    const amountGroups = this.groupByAmount(transactions);

    for (const [baseAmount, amountTransactions] of amountGroups) {
      if (amountTransactions.length < this.minOccurrences) continue;

      const pattern = this.detectFrequencyPattern(amountTransactions);
      if (!pattern) continue;

      const bill = this.createBillFromPattern(
        merchant,
        baseAmount,
        amountTransactions,
        pattern
      );

      if (bill) bills.push(bill);
    }

    return bills;
  }

  /**
   * Group transactions by similar amounts
   */
  private groupByAmount(transactions: Transaction[]): Map<number, Transaction[]> {
    const groups = new Map<number, Transaction[]>();
    const variance = 0.1; // 10% variance allowed

    for (const transaction of transactions) {
      let foundGroup = false;

      for (const [baseAmount, group] of groups) {
        const difference = Math.abs(transaction.amount - baseAmount) / baseAmount;
        
        if (difference <= variance) {
          group.push(transaction);
          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        groups.set(transaction.amount, [transaction]);
      }
    }

    return groups;
  }

  /**
   * Detect frequency pattern from transaction dates
   */
  private detectFrequencyPattern(transactions: Transaction[]): {
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    confidence: number;
    dayOfMonth?: number;
    dayOfWeek?: number;
  } | null {
    if (transactions.length < 2) return null;

    const sortedTransactions = transactions.sort((a, b) => 
      dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );

    const intervals: number[] = [];
    
    // Calculate intervals between transactions (in days)
    for (let i = 1; i < sortedTransactions.length; i++) {
      const daysDiff = dayjs(sortedTransactions[i].date)
        .diff(dayjs(sortedTransactions[i - 1].date), 'days');
      intervals.push(daysDiff);
    }

    // Analyze intervals to detect patterns
    // Made more flexible for real-world usage
    const patterns = [
      { frequency: 'weekly' as const, expectedInterval: 7, tolerance: 3 }, // 4-10 days
      { frequency: 'monthly' as const, expectedInterval: 30, tolerance: 10 }, // 20-40 days  
      { frequency: 'quarterly' as const, expectedInterval: 90, tolerance: 15 }, // 75-105 days
      { frequency: 'yearly' as const, expectedInterval: 365, tolerance: 30 }, // 335-395 days
    ];
    
    // Check for standard patterns first
    for (const pattern of patterns) {
      const matchingIntervals = intervals.filter(interval => 
        Math.abs(interval - pattern.expectedInterval) <= pattern.tolerance
      );

      const confidence = matchingIntervals.length / intervals.length;
      
      if (confidence >= 0.5) { // At least 50% of intervals match (more lenient)
        const result: any = {
          frequency: pattern.frequency,
          confidence,
        };

        // Add specific day information
        if (pattern.frequency === 'monthly') {
          const days = sortedTransactions.map(t => dayjs(t.date).date());
          result.dayOfMonth = this.getMostFrequentValue(days);
        } else if (pattern.frequency === 'weekly') {
          const days = sortedTransactions.map(t => dayjs(t.date).day());
          result.dayOfWeek = this.getMostFrequentValue(days);
        }

        return result;
      }
    }
    
    // If no standard pattern, check for frequent irregular transactions (potential subscription services)
    // If merchant has 3+ transactions in a short period, it might be a service
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    if (transactions.length >= 3 && avgInterval <= 20) {
      return {
        frequency: 'monthly' as const, // Treat as monthly for estimation
        confidence: 0.6, // Medium confidence for irregular pattern
      };
    }

    return null;
  }

  /**
   * Create a DetectedBill from analyzed pattern
   */
  private createBillFromPattern(
    merchant: string,
    baseAmount: number,
    transactions: Transaction[],
    pattern: any
  ): DetectedBill | null {
    const latestTransaction = transactions[0];
    const averageAmount = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length;
    
    const category = this.categorizeBill(merchant, latestTransaction.description);
    const nextDueDate = this.calculateNextDueDate(latestTransaction.date, pattern);

    // Calculate overall confidence
    const amountConsistency = 1 - (Math.abs(baseAmount - averageAmount) / baseAmount);
    const overallConfidence = (pattern.confidence + amountConsistency) / 2;

    return {
      id: `bill_${merchant.replace(/\s+/g, '_')}_${pattern.frequency}`,
      name: this.generateBillName(merchant, category),
      merchant: merchant,
      amount: Math.round(averageAmount * 100) / 100,
      frequency: pattern.frequency,
      category,
      nextDueDate,
      lastPaymentDate: latestTransaction.date,
      accountId: latestTransaction.accountId,
      bankName: latestTransaction.bankName || 'Unknown Bank',
      confidence: overallConfidence,
      transactions,
      status: this.determineBillStatus(transactions),
      averageAmount,
      dayOfMonth: pattern.dayOfMonth,
      dayOfWeek: pattern.dayOfWeek,
    };
  }

  /**
   * Categorize bills based on merchant and description
   */
  private categorizeBill(merchant: string, description: string): string {
    const text = `${merchant} ${description}`.toLowerCase();

    const categories = [
      { 
        name: 'Utilities', 
        keywords: ['electric', 'gas', 'water', 'sewer', 'internet', 'phone', 'mobile', 'broadband', 'wifi']
      },
      { 
        name: 'Subscriptions', 
        keywords: ['netflix', 'spotify', 'apple', 'google', 'amazon prime', 'disney', 'hulu', 'subscription']
      },
      { 
        name: 'Insurance', 
        keywords: ['insurance', 'life', 'health', 'car', 'auto', 'home', 'renters']
      },
      { 
        name: 'Housing', 
        keywords: ['rent', 'mortgage', 'property', 'maintenance', 'hoa']
      },
      { 
        name: 'Transportation', 
        keywords: ['car payment', 'auto loan', 'parking', 'toll', 'public transport']
      },
      { 
        name: 'Financial', 
        keywords: ['loan', 'credit card', 'bank fee', 'finance', 'payment']
      },
      { 
        name: 'Health', 
        keywords: ['pharmacy', 'medical', 'dental', 'vision', 'health']
      }
    ];

    for (const category of categories) {
      if (category.keywords.some(keyword => text.includes(keyword))) {
        return category.name;
      }
    }

    return 'Other';
  }

  /**
   * Generate a friendly bill name
   */
  private generateBillName(merchant: string, category: string): string {
    const cleanMerchant = merchant
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    if (category === 'Subscriptions') return `${cleanMerchant} Subscription`;
    if (category === 'Utilities') return `${cleanMerchant} Utility`;
    if (category === 'Insurance') return `${cleanMerchant} Insurance`;
    
    return cleanMerchant;
  }

  /**
   * Calculate next due date based on pattern
   */
  private calculateNextDueDate(lastPayment: string, pattern: any): string {
    const lastDate = dayjs(lastPayment);
    
    switch (pattern.frequency) {
      case 'weekly':
        return lastDate.add(1, 'week').format('YYYY-MM-DD');
      case 'monthly':
        const nextMonth = lastDate.add(1, 'month');
        if (pattern.dayOfMonth) {
          return nextMonth.date(pattern.dayOfMonth).format('YYYY-MM-DD');
        }
        return nextMonth.format('YYYY-MM-DD');
      case 'quarterly':
        return lastDate.add(3, 'months').format('YYYY-MM-DD');
      case 'yearly':
        return lastDate.add(1, 'year').format('YYYY-MM-DD');
      default:
        return lastDate.add(1, 'month').format('YYYY-MM-DD');
    }
  }

  /**
   * Determine bill status based on recent activity
   */
  private determineBillStatus(transactions: Transaction[]): 'active' | 'cancelled' | 'irregular' {
    const latestTransaction = dayjs(transactions[0].date);
    const daysSinceLatest = dayjs().diff(latestTransaction, 'days');
    
    // If no recent activity (>60 days), might be cancelled
    if (daysSinceLatest > 60) return 'cancelled';
    
    // Check for irregularity in recent payments
    if (transactions.length >= 3) {
      const recent3 = transactions.slice(0, 3);
      const intervals = [];
      
      for (let i = 1; i < recent3.length; i++) {
        intervals.push(
          dayjs(recent3[i - 1].date).diff(dayjs(recent3[i].date), 'days')
        );
      }
      
      const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
      const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
      
      // High variance indicates irregular payments
      if (variance > 100) return 'irregular';
    }
    
    return 'active';
  }

  /**
   * Get most frequent value from array
   */
  private getMostFrequentValue(values: number[]): number {
    const frequency: { [key: number]: number } = {};
    
    values.forEach(value => {
      frequency[value] = (frequency[value] || 0) + 1;
    });
    
    return parseInt(
      Object.keys(frequency).reduce((a, b) => 
        frequency[parseInt(a)] > frequency[parseInt(b)] ? a : b
      )
    );
  }

  /**
   * Get bills by category
   */
  static getBillsByCategory(bills: DetectedBill[]): { [category: string]: DetectedBill[] } {
    return bills.reduce((acc, bill) => {
      if (!acc[bill.category]) acc[bill.category] = [];
      acc[bill.category].push(bill);
      return acc;
    }, {} as { [category: string]: DetectedBill[] });
  }

  /**
   * Calculate total monthly spending on bills
   */
  static calculateMonthlyTotal(bills: DetectedBill[]): number {
    return bills.reduce((total, bill) => {
      switch (bill.frequency) {
        case 'weekly': return total + (bill.amount * 4.33); // ~4.33 weeks per month
        case 'monthly': return total + bill.amount;
        case 'quarterly': return total + (bill.amount / 3);
        case 'yearly': return total + (bill.amount / 12);
        default: return total;
      }
    }, 0);
  }

  /**
   * Get upcoming bills in next 30 days
   */
  static getUpcomingBills(bills: DetectedBill[], days: number = 30): DetectedBill[] {
    const cutoffDate = dayjs().add(days, 'days');
    
    return bills
      .filter(bill => dayjs(bill.nextDueDate).isBefore(cutoffDate) && bill.status === 'active')
      .sort((a, b) => dayjs(a.nextDueDate).valueOf() - dayjs(b.nextDueDate).valueOf());
  }
}

export default BillTrackingAlgorithm;