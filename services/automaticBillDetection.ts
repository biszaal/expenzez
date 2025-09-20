import { transactionAPI } from './api/transactionAPI';
import BillTrackingAlgorithm, { DetectedBill, Transaction } from './billTrackingAlgorithm';
import { BillsAPI, SavedBill } from './api/billsAPI';
import { BillPreferencesAPI } from './api/billPreferencesAPI';
import dayjs from 'dayjs';

export class AutomaticBillDetectionService {
  private static instance: AutomaticBillDetectionService;
  private lastAnalysisTimestamp: number = 0;
  private readonly ANALYSIS_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown
  private cachedBills: DetectedBill[] = [];
  private lastCacheTimestamp: number = 0;

  static getInstance(): AutomaticBillDetectionService {
    if (!AutomaticBillDetectionService.instance) {
      AutomaticBillDetectionService.instance = new AutomaticBillDetectionService();
    }
    return AutomaticBillDetectionService.instance;
  }

  /**
   * Get bills with smart caching - returns cached bills immediately,
   * runs detection in background if needed
   */
  async getBillsWithSmartCaching(forceRefresh: boolean = false): Promise<DetectedBill[]> {
    try {
      console.log('[AutoBillDetection] Getting bills with smart caching, force:', forceRefresh);

      // Try to get cached bills from database first (instant UX)
      const cacheResult = await BillsAPI.getBillsWithCaching(forceRefresh);

      if (cacheResult.bills.length > 0 && !forceRefresh) {
        console.log('[AutoBillDetection] Returning cached bills:', cacheResult.bills.length);
        this.cachedBills = this.convertSavedBillsToDetectedBills(cacheResult.bills);
        this.lastCacheTimestamp = Date.now();

        // Apply exclusion filtering to cached bills
        const filteredCachedBills = await this.applyExclusionFiltering(this.cachedBills);
        this.cachedBills = filteredCachedBills;

        // Check if background refresh is needed
        if (cacheResult.refreshTriggered) {
          console.log('[AutoBillDetection] Triggering background refresh...');
          this.triggerBackgroundRefresh();
        }

        return this.cachedBills;
      }

      // No cached bills or force refresh - run detection immediately
      console.log('[AutoBillDetection] No cached bills available, running detection...');
      return await this.triggerBillDetection(forceRefresh);

    } catch (error) {
      console.error('[AutoBillDetection] Error in smart caching:', error);
      // Fallback to regular detection
      return await this.triggerBillDetection(forceRefresh);
    }
  }

  /**
   * Convert saved bills back to detected bills format
   */
  private convertSavedBillsToDetectedBills(savedBills: SavedBill[]): DetectedBill[] {
    return savedBills.map(bill => ({
      id: bill.id,
      name: bill.name,
      merchant: bill.merchant,
      amount: bill.amount,
      frequency: bill.frequency,
      category: bill.category,
      nextDueDate: bill.nextDueDate,
      lastPaymentDate: bill.lastPaymentDate,
      accountId: bill.accountId,
      bankName: bill.bankName,
      confidence: bill.confidence,
      transactions: bill.transactions || [],
      status: bill.status,
      averageAmount: bill.averageAmount,
      dayOfMonth: bill.dayOfMonth,
      dayOfWeek: bill.dayOfWeek,
      userModified: bill.userModified
    }));
  }

  /**
   * Run bill detection in background and update cache
   */
  private async triggerBackgroundRefresh(): Promise<void> {
    try {
      console.log('[AutoBillDetection] Starting background refresh...');

      // Run detection without blocking UI
      setTimeout(async () => {
        const freshBills = await this.runBillDetectionAlgorithm();
        if (freshBills.length > 0) {
          // Save to database
          await this.saveBillsToCache(freshBills);
          console.log('[AutoBillDetection] Background refresh completed, saved', freshBills.length, 'bills');
        }
      }, 100); // Small delay to not block UI

    } catch (error) {
      console.error('[AutoBillDetection] Background refresh failed:', error);
    }
  }

  /**
   * Save detected bills to database cache
   */
  private async saveBillsToCache(bills: DetectedBill[]): Promise<void> {
    try {
      await BillsAPI.saveBills(bills);
      this.cachedBills = bills;
      this.lastCacheTimestamp = Date.now();
      console.log('[AutoBillDetection] Bills saved to cache successfully');

      // Trigger notification check for any upcoming bills
      if (bills.length > 0) {
        this.triggerBillNotificationCheck(bills);
      }
    } catch (error) {
      console.error('[AutoBillDetection] Failed to save bills to cache:', error);
    }
  }

  /**
   * Trigger bill notification check when new bills are detected/saved
   */
  private async triggerBillNotificationCheck(bills: DetectedBill[]): Promise<void> {
    try {
      console.log('[AutoBillDetection] Checking for upcoming bill notifications...');

      // Check if any bills are due soon (next 7 days)
      const upcomingBills = bills.filter(bill => {
        if (bill.status !== 'active' || !bill.nextDueDate) return false;

        const dueDate = dayjs(bill.nextDueDate);
        const daysUntilDue = dueDate.diff(dayjs(), 'days');

        // Check for bills due in next 7 days
        return daysUntilDue >= 0 && daysUntilDue <= 7;
      });

      if (upcomingBills.length > 0) {
        console.log(`[AutoBillDetection] Found ${upcomingBills.length} upcoming bills, may trigger notifications`);

        upcomingBills.forEach(bill => {
          const daysUntilDue = dayjs(bill.nextDueDate).diff(dayjs(), 'days');
          console.log(`[AutoBillDetection] Upcoming: ${bill.merchant} due in ${daysUntilDue} days (${bill.nextDueDate})`);
        });
      }

      // Note: Actual notifications are sent by the scheduled bill-reminders Lambda function
      // This is just logging for awareness. The daily cron job will pick up these bills.

    } catch (error) {
      console.error('[AutoBillDetection] Error checking bill notifications:', error);
    }
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
        return this.cachedBills;
      }

      const detectedBills = await this.runBillDetectionAlgorithm();

      // Save to cache if bills were detected
      if (detectedBills.length > 0) {
        await this.saveBillsToCache(detectedBills);
      }

      this.lastAnalysisTimestamp = now;
      return detectedBills;

    } catch (error) {
      console.error('[AutoBillDetection] Error during bill detection:', error);
      return [];
    }
  }

  /**
   * Core bill detection algorithm - extracted for reuse
   */
  private async runBillDetectionAlgorithm(): Promise<DetectedBill[]> {
    try {
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
        type: tx.type || (tx.amount > 0 ? 'debit' : 'credit') // In our CSV, positive amounts are expenses (debit)
      }));

      // Debug: Log transaction data before bill detection
      console.log('[AutoBillDetection] Processing transactions for bill detection:', {
        totalTransactions: transactions.length,
        sampleTransactions: transactions.slice(0, 5).map(tx => ({
          merchant: tx.merchant,
          description: tx.description,
          amount: tx.amount,
          date: tx.date,
          type: tx.type
        })),
        transactionTypes: transactions.reduce((acc, tx) => {
          acc[tx.type] = (acc[tx.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        debitTransactions: transactions.filter(tx => tx.type === 'debit').length,
        creditTransactions: transactions.filter(tx => tx.type === 'credit').length
      });

      // Run bill detection algorithm
      const algorithm = new BillTrackingAlgorithm(transactions);
      const detectedBills = algorithm.detectBills();

      console.log('[AutoBillDetection] Bill detection results:', {
        detectedBills: detectedBills.length,
        bills: detectedBills.map(bill => ({
          name: bill.name,
          merchant: bill.merchant,
          amount: bill.amount,
          confidence: bill.confidence
        }))
      });

      // Filter out user-excluded bills
      const finalBills = await this.applyExclusionFiltering(detectedBills);

      console.log(`[AutoBillDetection] After exclusion filtering: ${finalBills.length}/${detectedBills.length} bills`);

      finalBills.forEach(bill => {
        console.log('Final bill:', bill.name, bill.amount);
      });

      return finalBills;

    } catch (error) {
      console.error('[AutoBillDetection] Error in bill detection algorithm:', error);
      return [];
    }
  }

  /**
   * Normalize merchant name for consistent matching with exclusions
   * Uses same logic as bill detection algorithm
   */
  /**
   * Apply exclusion filtering to bills (works for both fresh detection and cached bills)
   */
  private async applyExclusionFiltering(bills: DetectedBill[]): Promise<DetectedBill[]> {
    try {
      const userExclusions = await BillPreferencesAPI.getBillExclusions();
      console.log('[AutoBillDetection] User exclusions loaded:', {
        count: userExclusions.length,
        exclusions: userExclusions.map(e => ({
          billId: e.billId,
          customName: e.customName,
          normalized: this.normalizeMerchantName(e.customName || ''),
          exclusionReason: e.exclusionReason
        }))
      });

      const filteredBills = bills.filter(bill => {
        const normalizedBillMerchant = this.normalizeMerchantName(bill.merchant);

        const isExcluded = userExclusions.some(exclusion => {
          if (!exclusion.customName) return false;
          const normalizedExclusion = this.normalizeMerchantName(exclusion.customName);
          const matches = normalizedExclusion === normalizedBillMerchant;

          console.log('[AutoBillDetection] Checking exclusion match:', {
            billMerchant: bill.merchant,
            normalizedBill: normalizedBillMerchant,
            exclusionName: exclusion.customName,
            normalizedExclusion: normalizedExclusion,
            matches: matches
          });

          return matches;
        });

        if (isExcluded) {
          console.log(`[AutoBillDetection] ✅ Filtering out excluded bill: ${bill.merchant}`);
        } else {
          console.log(`[AutoBillDetection] ✅ Keeping bill: ${bill.merchant}`);
        }

        return !isExcluded;
      });

      return filteredBills;
    } catch (error) {
      console.error('[AutoBillDetection] Error applying exclusion filtering:', error);
      // Return original bills if filtering fails
      return bills;
    }
  }

  private normalizeMerchantName(merchant: string): string {
    return merchant
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\b(ltd|limited|inc|corp|llc|co|plc)\b/g, '')
      .replace(/\b(payment|autopay|auto|recurring|subscription|monthly|annual)\b/g, '')
      .replace(/\b(direct|debit|dd|so|standing|order)\b/g, '')
      .replace(/\b(ref|reference|memo|description)\b/g, '')
      .replace(/\d{2,}/g, '')
      .trim();
  }

  /**
   * Get bills detected from current transactions
   * Uses smart caching for optimal performance
   */
  async getCurrentBills(): Promise<DetectedBill[]> {
    return this.getBillsWithSmartCaching();
  }

  /**
   * Trigger bill refresh after significant transaction changes
   * Should be called after CSV imports, bulk adds, etc.
   */
  async refreshAfterTransactionChanges(transactionCount?: number): Promise<DetectedBill[]> {
    try {
      console.log('[AutoBillDetection] Refreshing bills after transaction changes:', { transactionCount });

      // Force refresh to analyze new transactions
      const detectedBills = await this.triggerBillDetection(true);

      console.log('[AutoBillDetection] Refresh completed, detected', detectedBills.length, 'bills');
      return detectedBills;

    } catch (error) {
      console.error('[AutoBillDetection] Error refreshing after transaction changes:', error);
      return [];
    }
  }

  /**
   * Clear cached bills (useful when user logs out or switches accounts)
   */
  clearCache(): void {
    console.log('[AutoBillDetection] Clearing cached bills');
    this.cachedBills = [];
    this.lastCacheTimestamp = 0;
    this.lastAnalysisTimestamp = 0;
  }

  /**
   * Force cache refresh due to algorithm improvements
   * Call this when algorithm logic has changed significantly
   */
  async invalidateCacheAndRefresh(): Promise<DetectedBill[]> {
    console.log('[AutoBillDetection] Invalidating cache due to algorithm improvements...');

    try {
      // Clear local cache
      this.clearCache();

      // Clear database cache
      await BillsAPI.clearBillsCache();

      // Force fresh detection with new algorithm
      return await this.triggerBillDetection(true);

    } catch (error) {
      console.error('[AutoBillDetection] Error invalidating cache:', error);
      return [];
    }
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