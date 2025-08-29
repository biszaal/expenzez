import { useState, useEffect, useCallback } from 'react';
import { useNetwork } from '../contexts/NetworkContext';

interface ApiCacheOptions {
  cacheKey: string;
  cacheTTL?: number;
  maxAge?: number;
  forceRefresh?: boolean;
  enableOffline?: boolean;
}

interface ApiCacheResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
  isFromCache: boolean;
  refetch: () => Promise<void>;
  clearCache: () => Promise<void>;
}

export function useApiCache<T>(
  apiCall: () => Promise<T>,
  options: ApiCacheOptions
): ApiCacheResult<T> {
  const {
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    maxAge = 10 * 60 * 1000, // 10 minutes
    forceRefresh = false,
    enableOffline = true,
  } = options;

  const { 
    isOnline, 
    cacheData, 
    getCachedData, 
    clearCache: clearNetworkCache,
    isDataStale,
    queueRequest 
  } = useNetwork();

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);

  const fetchData = useCallback(async (useCache: boolean = true) => {
    try {
      setLoading(true);
      setError(null);

      // Try to get cached data first if not forcing refresh
      if (useCache && !forceRefresh) {
        const cachedData = await getCachedData(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setIsFromCache(true);
          setLoading(false);
          
          // Check if data is stale
          const stale = await isDataStale(cacheKey, maxAge);
          setIsStale(stale);
          
          // If data is not stale or we're offline, use cached data
          if (!stale || !isOnline) {
            return;
          }
        }
      }

      // If online, try to fetch fresh data
      if (isOnline) {
        const freshData = await apiCall();
        setData(freshData);
        setIsFromCache(false);
        setIsStale(false);
        setLoading(false);
        
        // Cache the fresh data
        await cacheData(cacheKey, freshData, cacheTTL);
      } else {
        // If offline and no cached data, queue the request
        if (!data && enableOffline) {
          queueRequest(apiCall);
          setLoading(false);
        } else if (!data) {
          throw new Error('No internet connection and no cached data available');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      
      // If there's an error but we have cached data, use it
      if (!data) {
        const cachedData = await getCachedData(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setIsFromCache(true);
          setIsStale(true);
        }
      }
    }
  }, [apiCall, cacheKey, cacheTTL, maxAge, forceRefresh, enableOffline, isOnline]);

  const refetch = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  const clearCache = useCallback(async () => {
    await clearNetworkCache(cacheKey);
    setIsFromCache(false);
    setIsStale(false);
  }, [clearNetworkCache, cacheKey]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when coming back online
  useEffect(() => {
    if (isOnline && (isStale || error)) {
      fetchData(false);
    }
  }, [isOnline, isStale, error, fetchData]);

  return {
    data,
    loading,
    error,
    isStale,
    isFromCache,
    refetch,
    clearCache,
  };
}

export default useApiCache;