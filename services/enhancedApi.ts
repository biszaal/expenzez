import { useState } from 'react';
import { useApiCache } from '../hooks/useApiCache';
import { useNetwork } from '../contexts/NetworkContext';
import { bankingAPI } from './api';

// Progressive loading wrapper for API calls
export const useProgressiveData = () => {
  const { isOnline, queueRequest } = useNetwork();

  const loadCriticalData = async () => {
    // Load only essential data first
    const criticalCalls = [
      () => bankingAPI.getAccounts(),
      () => bankingAPI.getConnectedBanks(),
    ];

    const results = await Promise.allSettled(
      criticalCalls.map(call => 
        isOnline ? call() : queueRequest(call)
      )
    );

    return results.map((result, index) => ({
      type: ['accounts', 'balance'][index],
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null,
    }));
  };

  const loadSecondaryData = async () => {
    // Load less critical data in background
    const secondaryCalls = [
      () => bankingAPI.getTransactionsUnified({ limit: 20 }), // Recent transactions only
      () => bankingAPI.getCachedBankData(),
    ];

    const results = await Promise.allSettled(
      secondaryCalls.map(call => 
        isOnline ? call() : queueRequest(call)
      )
    );

    return results.map((result, index) => ({
      type: ['recent_transactions', 'bank_data'][index],
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null,
    }));
  };

  const loadDetailedData = async () => {
    // Load comprehensive data last
    const detailedCalls = [
      () => bankingAPI.getTransactionsUnified({ limit: 1000 }), // All transactions
      () => bankingAPI.getCachedBankData(),
    ];

    const results = await Promise.allSettled(
      detailedCalls.map(call => 
        isOnline ? call() : queueRequest(call)
      )
    );

    return results.map((result, index) => ({
      type: ['all_transactions', 'all_bank_data'][index],
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null,
    }));
  };

  return {
    loadCriticalData,
    loadSecondaryData,
    loadDetailedData,
  };
};

// Enhanced API hooks with caching and progressive loading
export const useAccountsData = () => {
  return useApiCache(
    () => bankingAPI.getAccounts(),
    {
      cacheKey: 'accounts',
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      maxAge: 5 * 60 * 1000, // 5 minutes
    }
  );
};

export const useTransactionsData = (options: { limit?: number; offset?: number } = {}) => {
  const { limit = 50, offset = 0 } = options;
  
  return useApiCache(
    () => bankingAPI.getTransactionsUnified({ limit }),
    {
      cacheKey: `transactions_${limit}_${offset}`,
      cacheTTL: 1 * 60 * 1000, // 1 minute for transactions
      maxAge: 3 * 60 * 1000, // 3 minutes
    }
  );
};

export const useBalanceData = () => {
  return useApiCache(
    () => bankingAPI.getConnectedBanks(),
    {
      cacheKey: 'balance',
      cacheTTL: 30 * 1000, // 30 seconds for balance
      maxAge: 2 * 60 * 1000, // 2 minutes
    }
  );
};

export const useBankConnectionsData = () => {
  return useApiCache(
    () => bankingAPI.getCachedBankData(),
    {
      cacheKey: 'bank_connections',
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      maxAge: 10 * 60 * 1000, // 10 minutes
    }
  );
};

// Pagination helper for large datasets
export const usePaginatedData = <T>(
  fetchFunction: (limit: number, offset: number) => Promise<T[]>,
  itemsPerPage: number = 20
) => {
  const [allData, setAllData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newData = await fetchFunction(itemsPerPage, page * itemsPerPage);
      
      if (newData.length < itemsPerPage) {
        setHasMore(false);
      }

      setAllData(prev => [...prev, ...newData]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAllData([]);
    setPage(0);
    setHasMore(true);
  };

  return {
    data: allData,
    loading,
    hasMore,
    loadMore,
    reset,
  };
};

export default {
  useProgressiveData,
  useAccountsData,
  useTransactionsData,
  useBalanceData,
  useBankConnectionsData,
  usePaginatedData,
};