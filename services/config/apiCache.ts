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

// Stable per-user namespace for cache keys. Keying user-specific data (balances,
// profile, etc.) by this prevents one account's cached data from being served to
// another within the same app session. Falls back to "default" if unavailable.
export const getCacheUserId = async (): Promise<string> => {
  try {
    const AsyncStorage = (
      await import('@react-native-async-storage/async-storage')
    ).default;
    const userStr = await AsyncStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return user?.sub || user?.id || user?.email || user?.username || 'default';
  } catch {
    return 'default';
  }
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

// Stale-aware read: returns the cached entry even if it has expired, so callers
// can fall back to last-known data when offline. Unlike getCachedData() it never
// deletes an expired entry. `isStale` is true when the entry is past its TTL.
export const getStaleCachedData = async (
  key: string
): Promise<{ data: any; isStale: boolean } | null> => {
  const now = Date.now();

  const memoryCached = memoryCache.get(key);
  if (memoryCached) {
    return { data: memoryCached.data, isStale: now - memoryCached.timestamp > memoryCached.ttl };
  }

  try {
    const storedData = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      // Restore to memory cache for faster subsequent access
      memoryCache.set(key, parsed);
      return { data: parsed.data, isStale: now - parsed.timestamp > parsed.ttl };
    }
  } catch (error) {
    console.warn('[Cache] Error reading stale data from AsyncStorage:', error);
  }

  return null;
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

// Clear every cache key starting with `prefix`, from both memory and AsyncStorage.
// Used for parameterized keys (e.g. transactions_<userId>_<params>) where a single
// mutation must drop several related entries at once.
export const clearCachedDataByPrefix = async (prefix: string): Promise<void> => {
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
  try {
    const keys = await AsyncStorage.getAllKeys();
    const matching = keys.filter(key => key.startsWith(CACHE_PREFIX + prefix));
    if (matching.length > 0) {
      await AsyncStorage.multiRemove(matching);
    }
  } catch (error) {
    console.warn('[Cache] Error clearing prefixed keys from AsyncStorage:', error);
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

// Cached API call with stale-while-revalidate + offline fallback.
//
// Unlike cachedApiCall, on a network/request failure this returns the last-known
// cached value (even if expired) instead of throwing — so screens keep showing
// data when the device is offline. A fresh cache hit short-circuits the request;
// otherwise it fetches (deduplicated), caches, and returns fresh data.
export const cachedApiCallSWR = async <T>(
  cacheKey: string,
  requestFn: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM,
  options: { forceRefresh?: boolean } = {}
): Promise<T> => {
  if (!options.forceRefresh) {
    const fresh = await getCachedData(cacheKey);
    if (fresh !== null) {
      console.log('[Cache] Hit:', cacheKey);
      return fresh;
    }
  }

  console.log('[Cache] Miss:', cacheKey);

  try {
    const data = await deduplicateRequest(cacheKey, requestFn);
    await setCachedData(cacheKey, data, ttl);
    return data;
  } catch (error) {
    // Network/request failed — fall back to stale cache if we have one.
    const stale = await getStaleCachedData(cacheKey);
    if (stale !== null) {
      console.log('[Cache] Serving stale (offline fallback):', cacheKey);
      return stale.data as T;
    }
    throw error;
  }
};