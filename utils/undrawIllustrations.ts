import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// UnDraw illustration URLs for personal finance app
export const UNDRAW_ILLUSTRATIONS = {
  WELCOME: 'https://undraw.co/api/illustrations/personal-finance',
  ANALYTICS: 'https://undraw.co/api/illustrations/analytics', 
  SECURITY: 'https://undraw.co/api/illustrations/security',
  NOTIFICATIONS: 'https://undraw.co/api/illustrations/notifications',
  ROCKET: 'https://undraw.co/api/illustrations/rocket',
  WALLET: 'https://undraw.co/api/illustrations/wallet',
  BUDGET: 'https://undraw.co/api/illustrations/budget',
  INVESTMENT: 'https://undraw.co/api/illustrations/investment',
  SAVINGS: 'https://undraw.co/api/illustrations/savings',
  CREDIT_CARD: 'https://undraw.co/api/illustrations/credit-card',
  MOBILE_PAYMENT: 'https://undraw.co/api/illustrations/mobile-payment',
  FINANCIAL_GOALS: 'https://undraw.co/api/illustrations/financial-goals',
  EXPENSE_TRACKING: 'https://undraw.co/api/illustrations/expense-tracking',
  BUDGET_PLANNING: 'https://undraw.co/api/illustrations/budget-planning',
  FINANCIAL_REPORTS: 'https://undraw.co/api/illustrations/financial-reports',
};

// Cache key for storing downloaded illustrations
const CACHE_KEY = 'undraw_illustrations_cache';

export interface CachedIllustration {
  url: string;
  localPath: string;
  downloadedAt: number;
}

export class UnDrawIllustrationManager {
  private static instance: UnDrawIllustrationManager;
  private cache: Map<string, CachedIllustration> = new Map();

  static getInstance(): UnDrawIllustrationManager {
    if (!UnDrawIllustrationManager.instance) {
      UnDrawIllustrationManager.instance = new UnDrawIllustrationManager();
    }
    return UnDrawIllustrationManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load illustration cache:', error);
    }
  }

  async getIllustrationUrl(key: string, color?: string): Promise<string> {
    const baseUrl = UNDRAW_ILLUSTRATIONS[key as keyof typeof UNDRAW_ILLUSTRATIONS];
    if (!baseUrl) {
      throw new Error(`Illustration key "${key}" not found`);
    }

    // Add color parameter if provided
    const url = color ? `${baseUrl}?color=${encodeURIComponent(color)}` : baseUrl;
    
    // Check if we have a cached version
    const cached = this.cache.get(url);
    if (cached && this.isCacheValid(cached)) {
      return cached.localPath;
    }

    // For now, return the URL directly
    // In a production app, you might want to download and cache the images locally
    return url;
  }

  private isCacheValid(cached: CachedIllustration): boolean {
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    return Date.now() - cached.downloadedAt < oneWeek;
  }

  async preloadIllustrations(keys: string[], colors?: string[]): Promise<void> {
    const promises = keys.map(async (key, index) => {
      const color = colors?.[index];
      try {
        await this.getIllustrationUrl(key, color);
      } catch (error) {
        console.warn(`Failed to preload illustration ${key}:`, error);
      }
    });

    await Promise.all(promises);
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem(CACHE_KEY);
  }
}

// Helper function to get illustration with color
export const getIllustrationWithColor = (key: string, color: string): string => {
  const baseUrl = UNDRAW_ILLUSTRATIONS[key as keyof typeof UNDRAW_ILLUSTRATIONS];
  if (!baseUrl) {
    console.warn(`Illustration key "${key}" not found`);
    return '';
  }
  
  // UnDraw supports color customization via URL parameter
  return `${baseUrl}?color=${encodeURIComponent(color)}`;
};

// Predefined illustration sets for different onboarding flows
export const ONBOARDING_ILLUSTRATIONS = {
  PERSONAL_FINANCE: [
    { key: 'WELCOME', color: '#6366F1' },
    { key: 'ANALYTICS', color: '#10B981' },
    { key: 'SECURITY', color: '#F59E0B' },
    { key: 'NOTIFICATIONS', color: '#3B82F6' },
    { key: 'ROCKET', color: '#8B5CF6' },
  ],
  BUDGETING: [
    { key: 'BUDGET', color: '#6366F1' },
    { key: 'EXPENSE_TRACKING', color: '#10B981' },
    { key: 'BUDGET_PLANNING', color: '#F59E0B' },
    { key: 'FINANCIAL_GOALS', color: '#3B82F6' },
  ],
  INVESTMENT: [
    { key: 'INVESTMENT', color: '#6366F1' },
    { key: 'SAVINGS', color: '#10B981' },
    { key: 'FINANCIAL_REPORTS', color: '#F59E0B' },
  ],
};

export default UnDrawIllustrationManager;
