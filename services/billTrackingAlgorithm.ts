import dayjs from 'dayjs';
import MerchantClassifier from './merchantClassifier';

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
  userModified?: boolean; // Indicates if user has manually modified this bill
}

export class BillTrackingAlgorithm {
  private transactions: Transaction[];
  private minConfidence: number = 0.3; // Further lowered for better detection
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
    console.log('[BillTrackingAlgorithm] Starting bill detection with', this.transactions.length, 'transactions');

    const merchantGroups = this.groupTransactionsByMerchant();
    console.log('[BillTrackingAlgorithm] Merchant groups:', {
      totalGroups: merchantGroups.size,
      groupSizes: Array.from(merchantGroups.entries()).map(([merchant, txs]) => ({
        merchant,
        count: txs.length
      }))
    });

    const detectedBills: DetectedBill[] = [];

    for (const [merchant, transactions] of merchantGroups) {
      // Skip if not enough transactions to establish pattern
      if (transactions.length < this.minOccurrences) {
        console.log('[BillTrackingAlgorithm] Skipping merchant', merchant, '- only', transactions.length, 'transactions');
        continue;
      }

      console.log('[BillTrackingAlgorithm] Analyzing pattern for', merchant, 'with', transactions.length, 'transactions');
      const bills = this.analyzeTransactionPattern(merchant, transactions);
      detectedBills.push(...bills);
    }

    // Also check for bills by same day of month pattern (even with fewer occurrences)
    const dayPatternBills = this.detectSameDayPatterns();
    detectedBills.push(...dayPatternBills);

    console.log('[BillTrackingAlgorithm] Before filtering:', detectedBills.length, 'bills detected');
    console.log('[BillTrackingAlgorithm] Min confidence:', this.minConfidence);

    // Sort by confidence and filter using merchant-specific thresholds
    const filteredBills = detectedBills
      .filter(bill => {
        const classification = MerchantClassifier.classifyMerchant(bill.merchant, '');
        const minThreshold = MerchantClassifier.getMinConfidenceThreshold(classification);
        const passes = bill.confidence >= minThreshold;

        console.log('[BillTrackingAlgorithm] Bill evaluation:', {
          merchant: bill.merchant,
          confidence: bill.confidence,
          classification: classification.type,
          threshold: minThreshold,
          passes: passes
        });

        if (!passes) {
          console.log('[BillTrackingAlgorithm] Filtered out bill:', bill.merchant,
            'confidence:', bill.confidence, 'threshold:', minThreshold);
        }
        return passes;
      })
      .sort((a, b) => b.confidence - a.confidence);

    console.log('[BillTrackingAlgorithm] Final detected bills:', filteredBills.length);

    return filteredBills;
  }

  /**
   * Group transactions by merchant/description patterns
   */
  private groupTransactionsByMerchant(): Map<string, Transaction[]> {
    const groups = new Map<string, Transaction[]>();

    // Debug: Check transaction types
    const typeCount = this.transactions.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('[BillTrackingAlgorithm] Transaction types:', typeCount);

    for (const transaction of this.transactions) {
      if (transaction.type !== 'debit') {
        console.log('[BillTrackingAlgorithm] Skipping non-debit transaction:', {
          merchant: transaction.merchant,
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description
        });
        continue; // Only track outgoing payments
      }

      // Check if merchant should be excluded from bill detection (e.g., groceries, retail)
      if (MerchantClassifier.shouldExcludeFromBills(transaction.merchant, transaction.description)) {
        console.log('[BillTrackingAlgorithm] Excluding retail/variable expense:', {
          merchant: transaction.merchant,
          amount: transaction.amount,
          description: transaction.description,
          classification: MerchantClassifier.classifyMerchant(transaction.merchant, transaction.description)
        });
        continue;
      }

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
      .replace(/\b(ltd|limited|inc|corp|llc|co|plc)\b/g, '')
      .replace(/\b(payment|autopay|auto|recurring|subscription|monthly|annual)\b/g, '')
      .replace(/\b(direct|debit|dd|so|standing|order)\b/g, '') // Bank-specific terms
      .replace(/\b(ref|reference|memo|description)\b/g, '') // Transaction reference terms
      .replace(/\d{2,}/g, '') // Remove long number sequences (transaction IDs)
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
   * Group transactions by similar amounts using merchant-specific variance thresholds
   */
  private groupByAmount(transactions: Transaction[]): Map<number, Transaction[]> {
    const groups = new Map<number, Transaction[]>();

    // Get merchant classification from first transaction (all should be same merchant)
    const sampleTransaction = transactions[0];
    const classification = MerchantClassifier.classifyMerchant(
      sampleTransaction.merchant,
      sampleTransaction.description
    );

    // Use merchant-specific variance threshold
    const variance = MerchantClassifier.getAmountVarianceThreshold(classification);

    console.log('[BillTrackingAlgorithm] Amount grouping for', sampleTransaction.merchant, ':', {
      classification: classification.type,
      variance: variance,
      transactionCount: transactions.length
    });

    for (const transaction of transactions) {
      let foundGroup = false;
      const absAmount = Math.abs(transaction.amount);

      for (const [baseAmount, group] of groups) {
        const absBaseAmount = Math.abs(baseAmount);
        const difference = Math.abs(absAmount - absBaseAmount) / absBaseAmount;

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
      { frequency: 'weekly' as const, expectedInterval: 7, tolerance: 4 }, // 3-11 days
      { frequency: 'monthly' as const, expectedInterval: 30, tolerance: 12 }, // 18-42 days
      { frequency: 'quarterly' as const, expectedInterval: 90, tolerance: 20 }, // 70-110 days
      { frequency: 'yearly' as const, expectedInterval: 365, tolerance: 40 }, // 325-405 days
    ];

    // Check for standard patterns first
    for (const pattern of patterns) {
      const matchingIntervals = intervals.filter(interval =>
        Math.abs(interval - pattern.expectedInterval) <= pattern.tolerance
      );

      const confidence = matchingIntervals.length / intervals.length;

      if (confidence >= 0.4) { // At least 40% of intervals match (more lenient)
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
    // If merchant has multiple transactions, it might be a service
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;

    // More flexible irregular pattern detection
    if (transactions.length >= 2) {
      // Check if it could be a bi-weekly pattern (14 days)
      const biWeeklyMatches = intervals.filter(interval => Math.abs(interval - 14) <= 5).length;
      if (biWeeklyMatches / intervals.length >= 0.3) {
        return {
          frequency: 'monthly' as const, // Treat bi-weekly as monthly for simplicity
          confidence: 0.6,
        };
      }

      // Check for very frequent small transactions (could be subscription services)
      if (avgInterval <= 25 && transactions.length >= 2) {
        return {
          frequency: 'monthly' as const, // Treat as monthly for estimation
          confidence: 0.5, // Lower confidence for irregular pattern
        };
      }
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
        keywords: ['netflix', 'spotify', 'apple', 'google', 'amazon prime', 'disney', 'hulu', 'subscription',
                  'youtube', 'premium', 'microsoft', 'adobe', 'office', 'dropbox', 'icloud', 'zoom', 'canva',
                  'github', 'slack', 'figma', 'notion', 'evernote', 'lastpass', 'nordvpn', 'expressvpn']
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
    const today = dayjs();

    let nextDate: dayjs.Dayjs;

    switch (pattern.frequency) {
      case 'weekly':
        nextDate = lastDate.add(1, 'week');
        // If date is in the past, calculate next occurrence
        while (nextDate.isBefore(today)) {
          nextDate = nextDate.add(1, 'week');
        }
        return nextDate.format('YYYY-MM-DD');

      case 'monthly':
        nextDate = lastDate.add(1, 'month');
        if (pattern.dayOfMonth) {
          nextDate = nextDate.date(pattern.dayOfMonth);
        }
        // If date is in the past, move to next month
        while (nextDate.isBefore(today)) {
          nextDate = nextDate.add(1, 'month');
          if (pattern.dayOfMonth) {
            nextDate = nextDate.date(pattern.dayOfMonth);
          }
        }
        return nextDate.format('YYYY-MM-DD');

      case 'quarterly':
        nextDate = lastDate.add(3, 'months');
        while (nextDate.isBefore(today)) {
          nextDate = nextDate.add(3, 'months');
        }
        return nextDate.format('YYYY-MM-DD');

      case 'yearly':
        nextDate = lastDate.add(1, 'year');
        while (nextDate.isBefore(today)) {
          nextDate = nextDate.add(1, 'year');
        }
        return nextDate.format('YYYY-MM-DD');

      default:
        nextDate = lastDate.add(1, 'month');
        while (nextDate.isBefore(today)) {
          nextDate = nextDate.add(1, 'month');
        }
        return nextDate.format('YYYY-MM-DD');
    }
  }

  /**
   * Determine bill status based on recent activity
   */
  private determineBillStatus(transactions: Transaction[]): 'active' | 'cancelled' | 'irregular' {
    const latestTransaction = dayjs(transactions[0].date);
    const daysSinceLatest = dayjs().diff(latestTransaction, 'days');

    // More lenient for imported/historical data - only mark as cancelled if >6 months old
    if (daysSinceLatest > 180) return 'cancelled';
    
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
   * Detect bills that occur on the same day of the month
   */
  private detectSameDayPatterns(): DetectedBill[] {
    const dayGroups = new Map<number, Transaction[]>();
    const bills: DetectedBill[] = [];

    // Group transactions by day of month
    for (const transaction of this.transactions) {
      if (transaction.type !== 'debit') continue;

      // Apply same merchant filtering for day patterns
      if (MerchantClassifier.shouldExcludeFromBills(transaction.merchant, transaction.description)) {
        continue;
      }

      const dayOfMonth = dayjs(transaction.date).date();
      if (!dayGroups.has(dayOfMonth)) {
        dayGroups.set(dayOfMonth, []);
      }
      dayGroups.get(dayOfMonth)!.push(transaction);
    }

    // Check each day group for potential recurring bills
    for (const [day, transactions] of dayGroups) {
      if (transactions.length < 2) continue;

      // Group by similar merchants and amounts
      const merchantGroups = new Map<string, Transaction[]>();

      for (const transaction of transactions) {
        const normalizedMerchant = this.normalizeMerchantName(transaction.merchant);
        if (!merchantGroups.has(normalizedMerchant)) {
          merchantGroups.set(normalizedMerchant, []);
        }
        merchantGroups.get(normalizedMerchant)!.push(transaction);
      }

      // Check each merchant group for recurring patterns
      for (const [merchant, merchantTransactions] of merchantGroups) {
        if (merchantTransactions.length < 2) continue;

        // Check if amounts are similar
        const amounts = merchantTransactions.map(t => Math.abs(t.amount));
        const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        const amountVariance = amounts.every(amt => Math.abs(amt - avgAmount) / avgAmount <= 0.15);

        if (amountVariance) {
          // Check if transactions span multiple months
          const dates = merchantTransactions.map(t => dayjs(t.date));
          const monthSpan = Math.max(...dates.map(d => d.month())) - Math.min(...dates.map(d => d.month()));

          if (monthSpan >= 1 || merchantTransactions.length >= 3) {
            const latestTransaction = merchantTransactions[0];
            const category = this.categorizeBill(merchant, latestTransaction.description);

            const bill: DetectedBill = {
              id: `day_pattern_${merchant.replace(/\s+/g, '_')}_day${day}`,
              name: this.generateBillName(merchant, category),
              merchant: merchant,
              amount: Math.round(avgAmount * 100) / 100,
              frequency: 'monthly',
              category,
              nextDueDate: this.calculateNextDueDateForDay(day),
              lastPaymentDate: latestTransaction.date,
              accountId: latestTransaction.accountId,
              bankName: latestTransaction.bankName || 'Unknown Bank',
              confidence: 0.6, // Medium confidence for day pattern
              transactions: merchantTransactions,
              status: this.determineBillStatus(merchantTransactions),
              averageAmount: avgAmount,
              dayOfMonth: day,
            };

            bills.push(bill);
          }
        }
      }
    }

    return bills;
  }

  /**
   * Calculate next due date for a specific day of month
   */
  private calculateNextDueDateForDay(dayOfMonth: number): string {
    const today = dayjs();
    let nextDate = today.date(dayOfMonth);

    // If the day has already passed this month, move to next month
    if (nextDate.isBefore(today) || nextDate.isSame(today, 'day')) {
      nextDate = nextDate.add(1, 'month').date(dayOfMonth);
    }

    return nextDate.format('YYYY-MM-DD');
  }

  /**
   * Get bill priority score (higher = more important)
   */
  static getBillPriority(bill: DetectedBill): number {
    let priority = 0;

    // Category-based priority (most important bills first)
    switch (bill.category.toLowerCase()) {
      case 'utilities':
      case 'housing':
      case 'insurance':
        priority += 100; // Essential bills
        break;
      case 'financial':
      case 'transportation':
        priority += 80; // Important bills
        break;
      case 'health':
        priority += 70; // Health-related bills
        break;
      case 'subscriptions':
        priority += 40; // Lower priority but still bills
        break;
      default:
        priority += 30; // Other bills
    }

    // Amount-based priority (higher amounts = higher priority)
    const monthlyAmount = this.getMonthlyAmount(bill);
    if (monthlyAmount > 500) priority += 30;
    else if (monthlyAmount > 200) priority += 20;
    else if (monthlyAmount > 100) priority += 10;
    else if (monthlyAmount > 50) priority += 5;

    // Frequency-based priority (more frequent = more important to track)
    switch (bill.frequency) {
      case 'weekly':
        priority += 15;
        break;
      case 'monthly':
        priority += 10;
        break;
      case 'quarterly':
        priority += 5;
        break;
      case 'yearly':
        priority += 2;
        break;
    }

    // Due date urgency (bills due soon get higher priority)
    const daysUntilDue = dayjs(bill.nextDueDate).diff(dayjs(), 'days');
    if (daysUntilDue <= 3) priority += 25; // Due very soon
    else if (daysUntilDue <= 7) priority += 15; // Due this week
    else if (daysUntilDue <= 14) priority += 10; // Due soon

    // Confidence boost (higher confidence = more reliable bill)
    priority += bill.confidence * 10;

    return priority;
  }

  /**
   * Get monthly equivalent amount for a bill
   */
  static getMonthlyAmount(bill: DetectedBill): number {
    switch (bill.frequency) {
      case 'weekly': return bill.amount * 4.33;
      case 'monthly': return bill.amount;
      case 'quarterly': return bill.amount / 3;
      case 'yearly': return bill.amount / 12;
      default: return bill.amount;
    }
  }

  /**
   * Get bills sorted by priority (important bills first)
   */
  static getBillsByPriority(bills: DetectedBill[]): DetectedBill[] {
    return [...bills].sort((a, b) => {
      const priorityA = this.getBillPriority(a);
      const priorityB = this.getBillPriority(b);

      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }

      // If same priority, sort by amount (higher amounts first)
      return this.getMonthlyAmount(b) - this.getMonthlyAmount(a);
    });
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