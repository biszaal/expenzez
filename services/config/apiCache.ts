// Simple in-memory cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const getCachedData = (key: string): any | null => {
  const cached = apiCache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    apiCache.delete(key);
    return null;
  }
  
  return cached.data;
};

export const setCachedData = (key: string, data: any, ttlMs: number = 300000): void => {
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
};

export const clearCachedData = (key: string): void => {
  apiCache.delete(key);
};