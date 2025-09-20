import { transactionAPI } from './api/transactionAPI';
import BillTrackingAlgorithm, { DetectedBill, Transaction } from './billTrackingAlgorithm';

export class AutomaticBillDetectionService {
  private static instance: AutomaticBillDetectionService;
  private lastAnalysisTimestamp: number = 0;
  private readonly ANALYSIS_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown

  static getInstance(): AutomaticBillDetectionService {
    if (!AutomaticBillDetectionService.instance) {
      AutomaticBillDetectionService.instance = new AutomaticBillDetectionService();
    }
    return AutomaticBillDetectionService.instance;
  }

  /**
   * Automatically detect bills after new transactions are added
   * This should be called after:
   * - Manual transaction entry
   * - CSV import
   * - Any bulk transaction creation
   */
  async triggerBillDetection(force: boolean = false): Promise<DetectedBill[]> {
    try {
      // Prevent too frequent analysis (performance optimization)
      const now = Date.now();
      if (!force && now - this.lastAnalysisTimestamp < this.ANALYSIS_COOLDOWN) {
        console.log('[AutoBillDetection] Skipping analysis due to cooldown period');
        return [];
      }

      // Fetch recent transactions (last 12 months for pattern analysis)
      const transactionsResponse = await transactionAPI.getTransactions({ limit: 2000 });
      const transactionsData = transactionsResponse.transactions || [];

      if (transactionsData.length === 0) {
        return [];
      }

      // Convert to the format expected by BillTrackingAlgorithm
      const transactions: Transaction[] = transactionsData.map((tx: any) => ({
        id: tx.id,
        amount: tx.amount || 0,
        description: tx.description || 'Unknown',
        date: tx.date,
        merchant: tx.merchant || tx.description || 'Unknown Merchant',
        category: tx.category,
        accountId: tx.accountId || 'manual',
        bankName: tx.bankName || 'Manual Entry',
        type: tx.type || (tx.amount < 0 ? 'debit' : 'credit')
      }));

      // Run bill detection algorithm
      const algorithm = new BillTrackingAlgorithm(transactions);
      const detectedBills = algorithm.detectBills();

      this.lastAnalysisTimestamp = now;

      detectedBills.forEach(bill => {
        console.log('Detected bill:', bill.name, bill.amount);
      });
      // You could store these bills in a database here if needed
      // await this.storeBillsInDatabase(detectedBills);

      return detectedBills;

    } catch (error) {
      console.error('[AutoBillDetection] Error during bill detection:', error);
      return [];
    }
  }

  /**
   * Get bills detected from current transactions
   */
  async getCurrentBills(): Promise<DetectedBill[]> {
    return this.triggerBillDetection();
  }

  /**
   * Check if a specific transaction looks like a bill payment
   * Useful for immediate feedback when adding transactions
   */
  isLikelyBillPayment(description: string, amount: number): {
    isBill: boolean;
    category: string;
    confidence: number;
  } {
    const text = description.toLowerCase();

    // Check for bill-like keywords
    const billKeywords = [
      // UK Utilities
      'british gas', 'bg', 'virgin media', 'bt', 'sky', 'ee', 'vodafone', 'three',
      'thames water', 'council tax', 'electricity', 'gas bill', 'water bill',
      // Subscriptions
      'netflix', 'spotify', 'amazon prime', 'subscription',
      // Insurance
      'insurance', 'aviva', 'admiral', 'direct line',
      // General bill terms
      'bill', 'payment', 'monthly', 'annual', 'quarterly'
    ];

    let confidence = 0;
    let matchedCategory = 'Other';

    // Check for exact keyword matches
    for (const keyword of billKeywords) {
      if (text.includes(keyword)) {
        confidence = Math.min(confidence + 0.3, 1.0);

        // Categorize based on keyword
        if (['british gas', 'bg', 'electricity', 'gas bill'].some(k => text.includes(k))) {
          matchedCategory = 'Utilities';
        } else if (['virgin media', 'bt', 'sky', 'ee'].some(k => text.includes(k))) {
          matchedCategory = 'Utilities';
        } else if (['netflix', 'spotify', 'subscription'].some(k => text.includes(k))) {
          matchedCategory = 'Subscriptions';
        } else if (['insurance', 'aviva', 'admiral'].some(k => text.includes(k))) {
          matchedCategory = 'Insurance';
        } else if (['council tax', 'rates'].some(k => text.includes(k))) {
          matchedCategory = 'Housing';
        }
      }
    }

    // Check for round numbers (often bills)
    if (amount % 1 === 0 && amount >= 10 && amount <= 500) {
      confidence += 0.2;
    }

    // Check for common bill amount patterns
    const commonBillAmounts = [9.99, 13.99, 14.99, 19.99, 25.00, 35.99, 39.99, 49.99];
    if (commonBillAmounts.includes(Math.abs(amount))) {
      confidence += 0.4;
    }

    return {
      isBill: confidence >= 0.5,
      category: matchedCategory,
      confidence: Math.min(confidence, 1.0)
    };
  }
}

// Export a singleton instance
export const autoBillDetection = AutomaticBillDetectionService.getInstance();