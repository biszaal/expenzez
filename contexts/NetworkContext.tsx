import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NetworkContextType {
  isConnected: boolean;
  isOnline: boolean;
  connectionType: string | null;
  cacheData: (key: string, data: any, ttl?: number) => Promise<void>;
  getCachedData: (key: string) => Promise<any>;
  clearCache: (key?: string) => Promise<void>;
  isDataStale: (key: string, maxAge?: number) => Promise<boolean>;
  queueRequest: (request: () => Promise<any>) => Promise<any>;
  processQueuedRequests: () => Promise<void>;
}

interface CachedItem {
  data: any;
  timestamp: number;
  ttl?: number;
}

interface QueuedRequest {
  id: string;
  request: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const CACHE_PREFIX = '@expenzez_cache_';
const QUEUE_PREFIX = '@expenzez_queue_';
const DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes (reduced from 5 to prevent corruption)
const DEFAULT_MAX_AGE = 4 * 60 * 1000; // 4 minutes (reduced from 10 to prevent corruption)

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const requestQueue = useRef<QueuedRequest[]>([]);
  const processingQueue = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(connected ?? false);
      setIsOnline(connected ?? false);
      setConnectionType(state.type);
      
      // Process queued requests when connection is restored
      if (connected && requestQueue.current.length > 0) {
        processQueuedRequests();
      }
    });

    // Check initial state
    NetInfo.fetch().then(state => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(connected ?? false);
      setIsOnline(connected ?? false);
      setConnectionType(state.type);
    });

    return () => unsubscribe();
  }, []);

  const cacheData = async (key: string, data: any, ttl: number = DEFAULT_TTL): Promise<void> => {
    try {
      const cacheItem: CachedItem = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  };

  const getCachedData = async (key: string): Promise<any> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheItem: CachedItem = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache has expired
      if (cacheItem.ttl && (now - cacheItem.timestamp) > cacheItem.ttl) {
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  };

  const clearCache = async (key?: string): Promise<void> => {
    try {
      if (key) {
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
      } else {
        // Clear all cache
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  };

  const isDataStale = async (key: string, maxAge: number = DEFAULT_MAX_AGE): Promise<boolean> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return true;

      const cacheItem: CachedItem = JSON.parse(cached);
      const now = Date.now();
      
      return (now - cacheItem.timestamp) > maxAge;
    } catch (error) {
      return true;
    }
  };

  const queueRequest = async (request: () => Promise<any>): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (isOnline) {
        // Execute immediately if online
        request().then(resolve).catch(reject);
      } else {
        // Queue for later if offline
        const queuedRequest: QueuedRequest = {
          id: Date.now().toString() + Math.random().toString(36),
          request,
          resolve,
          reject,
        };
        requestQueue.current.push(queuedRequest);
        
        // Store in AsyncStorage for persistence
        AsyncStorage.setItem(
          QUEUE_PREFIX + queuedRequest.id,
          JSON.stringify({ id: queuedRequest.id, timestamp: Date.now() })
        ).catch(() => {});
      }
    });
  };

  const processQueuedRequests = async (): Promise<void> => {
    if (processingQueue.current || !isOnline || requestQueue.current.length === 0) {
      return;
    }

    processingQueue.current = true;

    try {
      const requests = [...requestQueue.current];
      requestQueue.current = [];

      // Process requests in parallel with some concurrency limit
      const BATCH_SIZE = 3;
      for (let i = 0; i < requests.length; i += BATCH_SIZE) {
        const batch = requests.slice(i, i + BATCH_SIZE);
        
        await Promise.allSettled(
          batch.map(async ({ id, request, resolve, reject }) => {
            try {
              const result = await request();
              resolve(result);
              // Remove from persistent storage
              AsyncStorage.removeItem(QUEUE_PREFIX + id).catch(() => {});
            } catch (error) {
              reject(error);
              AsyncStorage.removeItem(QUEUE_PREFIX + id).catch(() => {});
            }
          })
        );
      }
    } catch (error) {
      console.warn('Error processing queued requests:', error);
    } finally {
      processingQueue.current = false;
    }
  };

  const contextValue: NetworkContextType = {
    isConnected,
    isOnline,
    connectionType,
    cacheData,
    getCachedData,
    clearCache,
    isDataStale,
    queueRequest,
    processQueuedRequests,
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export default NetworkProvider;