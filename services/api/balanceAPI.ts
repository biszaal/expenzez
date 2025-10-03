import { api } from '../config/apiClient';
import { cachedApiCall, CACHE_TTL, clearCachedData } from '../config/apiCache';

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
    const cacheKey = 'balance_summary';

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
   * Invalidate balance cache - call this when a new transaction is created
   */
  invalidateCache: async (): Promise<void> => {
    await clearCachedData('balance_summary');
  },
};
