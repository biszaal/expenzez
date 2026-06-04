import { api } from '../config/apiClient';
import { cachedApiCall, CACHE_TTL, clearCachedData, getCacheUserId } from '../config/apiCache';

// Per-user balance cache key so one account's balance is never served to another.
const balanceCacheKey = async () => `balance_summary_${await getCacheUserId()}`;

export interface BalanceSummary {
  balance: number;
  totalCredit: number;
  totalDebit: number;
  transactionCount: number;
  firstTransactionDate: string | null;
  lastTransactionDate: string | null;
  monthsWithData: string[];
}

export interface BalanceSummaryResponse {
  message: string;
  summary: BalanceSummary;
}

export const balanceAPI = {
  /**
   * Get balance summary - fast endpoint that returns balance without loading all transactions
   * This is much more efficient than loading all transactions to calculate balance client-side
   */
  getSummary: async (
    options: { useCache?: boolean; forceRefresh?: boolean } = { useCache: true, forceRefresh: false }
  ): Promise<BalanceSummary> => {
    const cacheKey = await balanceCacheKey();

    if (options.useCache) {
      return cachedApiCall(
        cacheKey,
        async () => {
          const response = await api.get('/transactions/summary');
          return response.data.summary;
        },
        CACHE_TTL.MEDIUM, // 5 minutes - balance changes occasionally
        options.forceRefresh
      );
    } else {
      const response = await api.get('/transactions/summary');
      return response.data.summary;
    }
  },

  /**
   * Refresh balance - recalculates balance from all transactions and caches it in the database
   * Use this when user manually requests a balance refresh (e.g., via refresh button)
   */
  refreshBalance: async (): Promise<{ balance: number; lastUpdated: string; transactionCount: number }> => {
    const response = await api.post('/transactions/refresh-balance');

    // Invalidate local cache after refresh
    await clearCachedData(await balanceCacheKey());

    return {
      balance: response.data.balance,
      lastUpdated: response.data.lastUpdated,
      transactionCount: response.data.transactionCount,
    };
  },

  /**
   * Invalidate balance cache - call this when a new transaction is created
   */
  invalidateCache: async (): Promise<void> => {
    await clearCachedData(await balanceCacheKey());
  },
};
