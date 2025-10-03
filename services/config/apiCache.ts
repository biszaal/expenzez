import AsyncStorage from '@react-native-async-storage/async-storage';

// Dual-layer cache: memory (fast) + AsyncStorage (persistent)
const memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_PREFIX = '@expenzez_api_cache_';
const pendingRequests = new Map<string, Promise<any>>();

// Cache TTL presets (in milliseconds)
export const CACHE_TTL = {
  SHORT: 30000,      // 30 seconds - real-time data
  MEDIUM: 300000,    // 5 minutes - frequently updated data
  LONG: 1800000,     // 30 minutes - semi-static data
  VERY_LONG: 86400000 // 24 hours - static data (profile, settings)
};

// Enhanced cache retrieval with AsyncStorage fallback
export const getCachedData = async (key: string): Promise<any | null> => {
  const now = Date.now();

  // Check memory cache first (fastest)
  const memoryCached = memoryCache.get(key);
  if (memoryCached && (now - memoryCached.timestamp <= memoryCached.ttl)) {
    return memoryCached.data;
  }

  // Check AsyncStorage if memory cache missed
  try {
    const storedData = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      if (now - parsed.timestamp <= parsed.ttl) {
        // Restore to memory cache for faster subsequent access
        memoryCache.set(key, parsed);
        return parsed.data;
      } else {
        // Expired in storage, remove it
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
      }
    }
  } catch (error) {
    console.warn('[Cache] Error reading from AsyncStorage:', error);
  }

  return null;
};

// Enhanced cache storage with both memory and AsyncStorage
export const setCachedData = async (key: string, data: any, ttlMs: number = CACHE_TTL.MEDIUM): Promise<void> => {
  const cacheEntry = {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  };

  // Store in memory cache (synchronous, fast)
  memoryCache.set(key, cacheEntry);

  // Store in AsyncStorage (async, persistent) - don't await to keep it fast
  AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheEntry)).catch(err => {
    console.warn('[Cache] Error writing to AsyncStorage:', err);
  });
};

// Clear specific cache key
export const clearCachedData = async (key: string): Promise<void> => {
  memoryCache.delete(key);
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
  } catch (error) {
    console.warn('[Cache] Error removing from AsyncStorage:', error);
  }
};

// Clear all cache
export const clearAllCache = async (): Promise<void> => {
  memoryCache.clear();
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.warn('[Cache] Error clearing AsyncStorage cache:', error);
  }
};

// Request deduplication - prevent multiple identical requests
export const deduplicateRequest = async <T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> => {
  // If same request is already in flight, return that promise
  if (pendingRequests.has(key)) {
    console.log('[Cache] Deduplicating request:', key);
    return pendingRequests.get(key)!;
  }

  // Execute the request and store the promise
  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
};

// Cached API call wrapper
export const cachedApiCall = async <T>(
  cacheKey: string,
  requestFn: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM,
  forceRefresh: boolean = false
): Promise<T> => {
  // Check cache first unless force refresh
  if (!forceRefresh) {
    const cached = await getCachedData(cacheKey);
    if (cached !== null) {
      console.log('[Cache] Hit:', cacheKey);
      return cached;
    }
  }

  console.log('[Cache] Miss:', cacheKey);

  // Use request deduplication
  const data = await deduplicateRequest(cacheKey, requestFn);

  // Cache the result
  await setCachedData(cacheKey, data, ttl);

  return data;
};