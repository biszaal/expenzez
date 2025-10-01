import { api } from '../config/apiClient';
import { DetectedBill } from '../billTrackingAlgorithm';

export interface SavedBill extends DetectedBill {
  userId: string;
  billId: string;
  savedAt: number;
  updatedAt: number;
}

export interface BillsResponse {
  bills: SavedBill[];
  count: number;
}

/**
 * Bills API service for managing detected bills persistence
 * Connects to backend /bills/detected endpoints
 */
export class BillsAPI {
  /**
   * Get all saved bills for the current user from database
   */
  static async getBills(): Promise<SavedBill[]> {
    try {
      console.log('[BillsAPI] Fetching saved bills from database...');

      const response = await api.get<BillsResponse>('/bills/detected');

      console.log('[BillsAPI] Retrieved bills:', {
        count: response.data.count,
        bills: response.data.bills?.map(b => ({ name: b.name, amount: b.amount })) || []
      });

      return response.data.bills || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('[BillsAPI] No bills found in database (404) - user has no saved bills');
        return [];
      }

      console.error('[BillsAPI] Error fetching bills:', error);
      throw error;
    }
  }

  /**
   * Save detected bills to database
   */
  static async saveBills(bills: DetectedBill[]): Promise<SavedBill[]> {
    try {
      console.log('[BillsAPI] Saving bills to database:', {
        count: bills.length,
        bills: bills.map(b => ({ name: b.name, amount: b.amount }))
      });

      const response = await api.post<{
        message: string;
        saved: number;
        bills: SavedBill[];
      }>('/bills/detected', {
        bills: bills
      });

      console.log('[BillsAPI] Bills saved successfully:', {
        saved: response.data.saved,
        message: response.data.message
      });

      return response.data.bills;
    } catch (error) {
      console.error('[BillsAPI] Error saving bills:', error);
      throw error;
    }
  }

  /**
   * Check if bills cache is stale and needs refresh
   */
  static async shouldRefreshBills(lastRefresh?: number, newTransactionCount?: number): Promise<boolean> {
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    const TRANSACTION_THRESHOLD = 5; // Refresh if 5+ new transactions

    if (!lastRefresh) {
      console.log('[BillsAPI] No last refresh timestamp - refresh needed');
      return true;
    }

    const now = Date.now();
    const timeSinceRefresh = now - lastRefresh;
    const isStale = timeSinceRefresh > CACHE_DURATION;
    const hasNewTransactions = (newTransactionCount || 0) >= TRANSACTION_THRESHOLD;

    console.log('[BillsAPI] Refresh check:', {
      timeSinceRefresh: Math.round(timeSinceRefresh / (60 * 60 * 1000)), // hours
      isStale,
      newTransactionCount,
      hasNewTransactions,
      shouldRefresh: isStale || hasNewTransactions
    });

    return isStale || hasNewTransactions;
  }

  /**
   * Get bills with smart caching - returns cached bills immediately,
   * triggers refresh in background if needed
   */
  static async getBillsWithCaching(
    forceRefresh: boolean = false,
    onBackgroundRefresh?: (bills: SavedBill[]) => void
  ): Promise<{
    bills: SavedBill[];
    fromCache: boolean;
    refreshTriggered: boolean;
  }> {
    try {
      // Always try to get cached bills first for instant UX
      let cachedBills: SavedBill[] = [];
      let fromCache = false;

      if (!forceRefresh) {
        try {
          cachedBills = await this.getBills();
          fromCache = cachedBills.length > 0;
          console.log('[BillsAPI] Loaded cached bills:', cachedBills.length);
        } catch (error) {
          console.log('[BillsAPI] No cached bills available');
        }
      }

      // Check if refresh is needed
      const lastRefresh = cachedBills.length > 0 ?
        Math.max(...cachedBills.map(b => b.updatedAt)) :
        undefined;

      const shouldRefresh = forceRefresh || await this.shouldRefreshBills(lastRefresh);

      return {
        bills: cachedBills,
        fromCache,
        refreshTriggered: shouldRefresh
      };
    } catch (error) {
      console.error('[BillsAPI] Error in smart caching:', error);
      return {
        bills: [],
        fromCache: false,
        refreshTriggered: false
      };
    }
  }

  /**
   * Clear bills cache from database (useful when algorithm changes)
   */
  static async clearBillsCache(): Promise<void> {
    try {
      console.log('[BillsAPI] Clearing bills cache from database...');

      await api.delete('/bills/detected/cache');

      console.log('[BillsAPI] Bills cache cleared successfully');
    } catch (error) {
      console.error('[BillsAPI] Error clearing bills cache:', error);
      // Don't throw - cache clearing is optional
    }
  }
}

// Export default methods for backward compatibility
export const getBills = BillsAPI.getBills;
export const saveBills = BillsAPI.saveBills;
export const getBillsWithCaching = BillsAPI.getBillsWithCaching;
export const clearBillsCache = BillsAPI.clearBillsCache;