import AsyncStorage from '@react-native-async-storage/async-storage';

const BALANCE_CACHE_KEY = 'cached_balance_data';
const BALANCE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedBalanceData {
  totalBalance: number;
  bankBalances: Array<{
    accountId: string;
    bankName: string;
    balance: number;
    currency: string;
    lastSyncAt: number;
  }>;
  cachedAt: number;
  currency: string;
}

/**
 * Save balance data to cache
 */
export const saveBalanceToCache = async (
  totalBalance: number,
  bankBalances: Array<{
    accountId: string;
    bankName: string;
    balance: number;
    currency: string;
    lastSyncAt: number;
  }>,
  currency: string = 'GBP'
): Promise<void> => {
  try {
    const cacheData: CachedBalanceData = {
      totalBalance,
      bankBalances,
      cachedAt: Date.now(),
      currency,
    };

    await AsyncStorage.setItem(BALANCE_CACHE_KEY, JSON.stringify(cacheData));
    console.log('[BalanceCache] ✅ Saved balance to cache:', { totalBalance, bankCount: bankBalances.length });
  } catch (error) {
    console.error('[BalanceCache] ❌ Error saving balance to cache:', error);
  }
};

/**
 * Load balance data from cache
 */
export const loadBalanceFromCache = async (): Promise<CachedBalanceData | null> => {
  try {
    const cachedData = await AsyncStorage.getItem(BALANCE_CACHE_KEY);
    if (!cachedData) {
      console.log('[BalanceCache] 📭 No cached balance data found');
      return null;
    }

    const parsed: CachedBalanceData = JSON.parse(cachedData);
    
    // Check if cache is still valid (24 hours)
    const now = Date.now();
    const cacheAge = now - parsed.cachedAt;
    
    if (cacheAge > BALANCE_CACHE_DURATION) {
      console.log('[BalanceCache] ⏰ Cached balance data expired, removing...');
      await AsyncStorage.removeItem(BALANCE_CACHE_KEY);
      return null;
    }

    console.log('[BalanceCache] ✅ Loaded balance from cache:', { 
      totalBalance: parsed.totalBalance, 
      bankCount: parsed.bankBalances.length,
      ageMinutes: Math.floor(cacheAge / (1000 * 60))
    });
    
    return parsed;
  } catch (error) {
    console.error('[BalanceCache] ❌ Error loading balance from cache:', error);
    return null;
  }
};

/**
 * Clear balance cache
 */
export const clearBalanceCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(BALANCE_CACHE_KEY);
    console.log('[BalanceCache] 🗑️ Cleared balance cache');
  } catch (error) {
    console.error('[BalanceCache] ❌ Error clearing balance cache:', error);
  }
};

/**
 * Check if we should show cached data (when all banks are expired)
 */
export const shouldUseCachedBalance = (banks: any[]): boolean => {
  if (!banks || banks.length === 0) {
    return false; // No banks, no need for cached data
  }

  // Use cached balance if all banks are expired
  const allExpired = banks.every(bank => bank.isExpired || bank.status === 'expired');
  console.log('[BalanceCache] 📊 Should use cached balance:', { allExpired, bankCount: banks.length });
  
  return allExpired;
};

/**
 * Format cache age for display
 */
export const formatCacheAge = (cachedAt: number): string => {
  const now = Date.now();
  const ageMs = now - cachedAt;
  const ageMinutes = Math.floor(ageMs / (1000 * 60));
  const ageHours = Math.floor(ageMinutes / 60);
  const ageDays = Math.floor(ageHours / 24);

  if (ageDays > 0) {
    return `${ageDays} day${ageDays > 1 ? 's' : ''} ago`;
  } else if (ageHours > 0) {
    return `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
  } else if (ageMinutes > 0) {
    return `${ageMinutes} minute${ageMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};