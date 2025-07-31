import { useState, useEffect, useCallback } from 'react';

// Import existing cache functions from api.ts
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCachedData = (key: string): any | null => {
  const cached = apiCache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    apiCache.delete(key);
    return null;
  }
  
  return cached.data;
};

const setCachedData = (key: string, data: any, ttlMinutes: number = 5): void => {
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMinutes * 60 * 1000, // Convert minutes to milliseconds
  });
};

interface FetchConfig<T> {
  key: string;
  fetcher: () => Promise<T>;
  dependencies?: any[];
  cacheTime?: number; // in minutes  
  retryCount?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseDataFetcherReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: (force?: boolean) => Promise<T | null>;
  invalidateCache: () => void;
}

export function useDataFetcher<T>(config: FetchConfig<T>): UseDataFetcherReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidateCache = useCallback(() => {
    apiCache.delete(config.key);
  }, [config.key]);

  const fetchData = useCallback(async (force = false): Promise<T | null> => {
    if (config.enabled === false) return null;
    
    setLoading(true);
    setError(null);

    try {
      // Check cache first unless force refresh
      if (!force) {
        const cached = getCachedData(config.key);
        if (cached) {
          console.log(`[useDataFetcher] 🚀 Using cached data for key: ${config.key}`);
          setData(cached);
          setLoading(false);
          config.onSuccess?.(cached);
          return cached;
        }
      }

      console.log(`[useDataFetcher] 📡 Fetching fresh data for key: ${config.key}`);
      const result = await config.fetcher();
      setData(result);
      
      // Cache the result if cacheTime is specified
      if (config.cacheTime && config.cacheTime > 0) {
        setCachedData(config.key, result, config.cacheTime);
      }
      
      config.onSuccess?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch data';
      console.error(`[useDataFetcher] ❌ Error fetching data for key ${config.key}:`, err);
      setError(errorMessage);
      config.onError?.(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [config.key, config.fetcher, config.enabled, config.cacheTime, config.onSuccess, config.onError]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, config.dependencies || []);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData,
    invalidateCache
  };
}

// Batch fetching utility for multiple data sources
export class BatchDataFetcher {
  private static instance: BatchDataFetcher;
  private batchQueue: Map<string, Promise<any>> = new Map();
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new BatchDataFetcher();
    }
    return this.instance;
  }

  async batchFetch<T>(requests: Array<{ key: string; fetcher: () => Promise<T> }>) {
    console.log(`[BatchDataFetcher] 🚀 Batch fetching ${requests.length} requests`);
    
    const promises = requests.map(async ({ key, fetcher }) => {
      // Check if request is already in flight
      if (this.batchQueue.has(key)) {
        console.log(`[BatchDataFetcher] ⏳ Request for ${key} already in flight, reusing...`);
        return this.batchQueue.get(key);
      }
      
      const promise = fetcher();
      this.batchQueue.set(key, promise);
      
      try {
        const result = await promise;
        console.log(`[BatchDataFetcher] ✅ Success for ${key}`);
        return { key, data: result, error: null };
      } catch (error) {
        console.error(`[BatchDataFetcher] ❌ Error for ${key}:`, error);
        return { key, data: null, error };
      } finally {
        this.batchQueue.delete(key);
      }
    });

    return Promise.all(promises);
  }

  clearQueue() {
    this.batchQueue.clear();
  }
}

// Hook for batch fetching multiple data sources
export function useBatchDataFetcher() {
  const batcher = BatchDataFetcher.getInstance();
  
  return {
    batchFetch: batcher.batchFetch.bind(batcher),
    clearQueue: batcher.clearQueue.bind(batcher),
  };
}