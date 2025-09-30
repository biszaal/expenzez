import { SavedBill } from './api/billsAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Subscription Optimization Service
 * Analyzes recurring bills/subscriptions and identifies duplicate services
 * to help users save money by suggesting cancellations
 *
 * Features:
 * - Detects duplicate subscriptions in same category
 * - Calculates potential savings
 * - Remembers user preferences when they choose to keep all subscriptions
 */

export interface SubscriptionCategory {
  category: string;
  services: string[];
  description: string;
  averageUsage: string;
}

export interface DuplicateSubscription {
  id: string;
  category: string;
  subscriptions: {
    name: string;
    amount: number;
    billId: string;
    frequency: string;
  }[];
  totalMonthlyCost: number;
  totalAnnualCost: number;
  recommendation: string;
  suggestedCancellation: string[];
  potentialMonthlySavings: number;
  potentialAnnualSavings: number;
  reasoning: string;
}

// Service categories and their known providers
const SERVICE_CATEGORIES: SubscriptionCategory[] = [
  {
    category: 'Streaming Video',
    services: ['netflix', 'disney', 'prime video', 'hulu', 'hbo', 'apple tv', 'paramount', 'peacock', 'now tv', 'sky', 'britbox'],
    description: 'Video streaming platforms',
    averageUsage: 'Most people actively use only 2-3 streaming services'
  },
  {
    category: 'Music Streaming',
    services: ['spotify', 'apple music', 'amazon music', 'youtube music', 'tidal', 'deezer', 'soundcloud'],
    description: 'Music streaming services',
    averageUsage: 'Most people only need one music service'
  },
  {
    category: 'Cloud Storage',
    services: ['icloud', 'google drive', 'dropbox', 'onedrive', 'amazon drive', 'box'],
    description: 'Cloud storage providers',
    averageUsage: 'Multiple services often have overlapping storage'
  },
  {
    category: 'Fitness & Wellness',
    services: ['peloton', 'fitbit', 'apple fitness', 'strava', 'myfitnesspal', 'headspace', 'calm', 'noom'],
    description: 'Fitness and wellness apps',
    averageUsage: 'Many fitness apps have similar features'
  },
  {
    category: 'News & Magazines',
    services: ['times', 'guardian', 'telegraph', 'economist', 'new york times', 'washington post', 'wsj', 'financial times'],
    description: 'News publications and magazines',
    averageUsage: 'News content often overlaps across publications'
  },
  {
    category: 'Gaming',
    services: ['playstation', 'xbox', 'nintendo', 'steam', 'epic games', 'ea play', 'ubisoft'],
    description: 'Gaming platforms and subscriptions',
    averageUsage: 'Console-specific services, but PC services can overlap'
  },
  {
    category: 'Meal Kits & Food Delivery',
    services: ['hello fresh', 'gousto', 'mindful chef', 'deliveroo plus', 'uber eats', 'just eat'],
    description: 'Meal kit and food delivery services',
    averageUsage: 'Using multiple services increases food spending significantly'
  },
  {
    category: 'Productivity & Software',
    services: ['microsoft 365', 'google workspace', 'adobe', 'grammarly', 'notion', 'evernote', 'todoist', 'canva'],
    description: 'Productivity tools and software subscriptions',
    averageUsage: 'Many free alternatives exist or features overlap'
  }
];

export class SubscriptionOptimizer {
  /**
   * Analyze bills and detect duplicate/redundant subscriptions
   */
  static analyzeBills(bills: SavedBill[]): DuplicateSubscription[] {
    console.log('🔍 [SubscriptionOptimizer] Analyzing', bills.length, 'bills for duplicates');

    const duplicates: DuplicateSubscription[] = [];

    // Group bills by service category
    const categorizedBills = this.categorizeBills(bills);

    // Analyze each category for duplicates
    for (const [category, categoryBills] of Object.entries(categorizedBills)) {
      if (categoryBills.length > 1) {
        // Found multiple subscriptions in the same category
        const duplicate = this.createDuplicateRecommendation(category, categoryBills);
        if (duplicate) {
          duplicates.push(duplicate);
        }
      }
    }

    console.log('✅ [SubscriptionOptimizer] Found', duplicates.length, 'duplicate categories');
    return duplicates;
  }

  /**
   * Categorize bills into service categories
   */
  private static categorizeBills(bills: SavedBill[]): Record<string, SavedBill[]> {
    const categorized: Record<string, SavedBill[]> = {};

    for (const bill of bills) {
      const billName = bill.name.toLowerCase();

      // Find matching category
      for (const categoryDef of SERVICE_CATEGORIES) {
        const matchesCategory = categoryDef.services.some(service =>
          billName.includes(service) || service.includes(billName.split(' ')[0])
        );

        if (matchesCategory) {
          if (!categorized[categoryDef.category]) {
            categorized[categoryDef.category] = [];
          }
          categorized[categoryDef.category].push(bill);
          break; // Only categorize into first match
        }
      }
    }

    return categorized;
  }

  /**
   * Create cancellation recommendation for duplicate subscriptions
   */
  private static createDuplicateRecommendation(
    category: string,
    bills: SavedBill[]
  ): DuplicateSubscription | null {
    if (bills.length < 2) return null;

    // Calculate costs
    const subscriptions = bills.map(bill => ({
      name: bill.name,
      amount: bill.amount,
      billId: bill.billId,
      frequency: bill.frequency
    }));

    const monthlyAmounts = bills.map(bill => this.convertToMonthly(bill.amount, bill.frequency));
    const totalMonthlyCost = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
    const totalAnnualCost = totalMonthlyCost * 12;

    // Determine which to cancel (usually keep cheapest or most popular)
    const sortedBills = [...bills].sort((a, b) => {
      const aMonthly = this.convertToMonthly(a.amount, a.frequency);
      const bMonthly = this.convertToMonthly(b.amount, b.frequency);
      return bMonthly - aMonthly; // Most expensive first
    });

    // Suggest canceling all but the cheapest
    const keepService = sortedBills[sortedBills.length - 1];
    const cancelServices = sortedBills.slice(0, -1);

    const potentialMonthlySavings = cancelServices.reduce((sum, bill) =>
      sum + this.convertToMonthly(bill.amount, bill.frequency), 0
    );
    const potentialAnnualSavings = potentialMonthlySavings * 12;

    // Generate reasoning
    const reasoning = this.generateReasoning(category, bills.length, keepService.name);
    const recommendation = this.generateRecommendation(category, keepService.name, cancelServices.map(b => b.name));

    return {
      id: `duplicate_${category.toLowerCase().replace(/\s+/g, '_')}`,
      category,
      subscriptions,
      totalMonthlyCost,
      totalAnnualCost,
      recommendation,
      suggestedCancellation: cancelServices.map(b => b.name),
      potentialMonthlySavings,
      potentialAnnualSavings,
      reasoning
    };
  }

  /**
   * Convert any frequency to monthly cost
   */
  private static convertToMonthly(amount: number, frequency: string): number {
    const freq = frequency.toLowerCase();

    if (freq.includes('month')) return amount;
    if (freq.includes('year') || freq.includes('annual')) return amount / 12;
    if (freq.includes('week')) return amount * 4.33; // Average weeks per month
    if (freq.includes('day')) return amount * 30;
    if (freq.includes('quarter')) return amount / 3;

    // Default to monthly if unknown
    return amount;
  }

  /**
   * Generate human-readable reasoning for the recommendation
   */
  private static generateReasoning(category: string, count: number, keepService: string): string {
    const categoryInfo = SERVICE_CATEGORIES.find(c => c.category === category);

    const reasons = [
      `You're currently subscribed to ${count} different ${category.toLowerCase()} services.`,
      categoryInfo?.averageUsage || 'Most people don't actively use all their subscriptions.',
      `Keeping ${keepService} and canceling the others could free up significant funds without impacting your lifestyle.`
    ];

    return reasons.join(' ');
  }

  /**
   * Generate actionable recommendation text
   */
  private static generateRecommendation(category: string, keep: string, cancel: string[]): string {
    if (cancel.length === 1) {
      return `Consider canceling ${cancel[0]} and keeping ${keep}. This consolidation can save you money while maintaining access to ${category.toLowerCase()} content.`;
    }

    const cancelList = cancel.length === 2
      ? cancel.join(' and ')
      : cancel.slice(0, -1).join(', ') + ', and ' + cancel[cancel.length - 1];

    return `Consider canceling ${cancelList} and keeping ${keep}. You'll still have access to ${category.toLowerCase()} content while significantly reducing costs.`;
  }

  /**
   * Get all optimization insights for AI to use
   */
  static getOptimizationInsights(bills: SavedBill[]): string[] {
    const duplicates = this.analyzeBills(bills);
    const insights: string[] = [];

    for (const duplicate of duplicates) {
      insights.push(
        `💰 Save £${duplicate.potentialAnnualSavings.toFixed(2)}/year: ${duplicate.recommendation}`
      );
    }

    // Add general subscription insight if many subscriptions exist
    if (bills.length >= 5) {
      const totalMonthly = bills.reduce((sum, bill) =>
        sum + this.convertToMonthly(bill.amount, bill.frequency), 0
      );
      insights.push(
        `📊 You have ${bills.length} active subscriptions totaling £${totalMonthly.toFixed(2)}/month. Review unused services regularly to avoid waste.`
      );
    }

    return insights;
  }

  /**
   * Generate AI-friendly summary for chat context
   */
  static generateAISummary(bills: SavedBill[]): string {
    const duplicates = this.analyzeBills(bills);

    if (duplicates.length === 0) {
      return "No duplicate subscriptions detected. User's subscriptions appear optimized.";
    }

    const totalPotentialSavings = duplicates.reduce((sum, d) => sum + d.potentialAnnualSavings, 0);
    const categories = duplicates.map(d => d.category).join(', ');

    return `Found ${duplicates.length} opportunities to save money by canceling duplicate subscriptions in: ${categories}. Total potential annual savings: £${totalPotentialSavings.toFixed(2)}.`;
  }

  /**
   * User Preference Management
   * Store and retrieve user decisions about subscriptions
   */

  private static readonly PREFERENCE_STORAGE_KEY = '@subscription_optimizer_preferences';

  /**
   * Save user's decision to keep all subscriptions in a category
   */
  static async saveUserPreference(
    category: string,
    subscriptionNames: string[],
    decision: 'keep_all' | 'optimize'
  ): Promise<void> {
    try {
      const preferences = await this.loadPreferences();
      const preferenceKey = `${category}_${subscriptionNames.sort().join('_')}`;

      preferences[preferenceKey] = {
        category,
        subscriptions: subscriptionNames,
        decision,
        timestamp: Date.now(),
        expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000) // 90 days
      };

      await AsyncStorage.setItem(
        this.PREFERENCE_STORAGE_KEY,
        JSON.stringify(preferences)
      );

      console.log('✅ [SubscriptionOptimizer] Saved user preference:', preferenceKey, decision);
    } catch (error) {
      console.error('❌ [SubscriptionOptimizer] Error saving preference:', error);
    }
  }

  /**
   * Check if user has previously decided to keep all subscriptions in this category
   */
  static async shouldSkipRecommendation(category: string, subscriptionNames: string[]): Promise<boolean> {
    try {
      const preferences = await this.loadPreferences();
      const preferenceKey = `${category}_${subscriptionNames.sort().join('_')}`;
      const preference = preferences[preferenceKey];

      if (!preference) return false;

      // Check if preference has expired
      if (preference.expiresAt && preference.expiresAt < Date.now()) {
        console.log('⏰ [SubscriptionOptimizer] Preference expired:', preferenceKey);
        return false;
      }

      // Only skip if user explicitly said to keep all
      return preference.decision === 'keep_all';
    } catch (error) {
      console.error('❌ [SubscriptionOptimizer] Error checking preference:', error);
      return false;
    }
  }

  /**
   * Load all user preferences
   */
  private static async loadPreferences(): Promise<Record<string, any>> {
    try {
      const stored = await AsyncStorage.getItem(this.PREFERENCE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('❌ [SubscriptionOptimizer] Error loading preferences:', error);
      return {};
    }
  }

  /**
   * Clear expired preferences (cleanup)
   */
  static async clearExpiredPreferences(): Promise<void> {
    try {
      const preferences = await this.loadPreferences();
      const now = Date.now();
      const cleaned: Record<string, any> = {};

      for (const [key, value] of Object.entries(preferences)) {
        if (!value.expiresAt || value.expiresAt > now) {
          cleaned[key] = value;
        }
      }

      await AsyncStorage.setItem(
        this.PREFERENCE_STORAGE_KEY,
        JSON.stringify(cleaned)
      );

      console.log('🧹 [SubscriptionOptimizer] Cleaned expired preferences');
    } catch (error) {
      console.error('❌ [SubscriptionOptimizer] Error cleaning preferences:', error);
    }
  }

  /**
   * Analyze bills with user preferences applied (filter out ignored categories)
   */
  static async analyzeBillsWithPreferences(bills: SavedBill[]): Promise<DuplicateSubscription[]> {
    const duplicates = this.analyzeBills(bills);
    const filtered: DuplicateSubscription[] = [];

    for (const duplicate of duplicates) {
      const subscriptionNames = duplicate.subscriptions.map(s => s.name);
      const shouldSkip = await this.shouldSkipRecommendation(duplicate.category, subscriptionNames);

      if (!shouldSkip) {
        filtered.push(duplicate);
      } else {
        console.log('⏭️  [SubscriptionOptimizer] Skipping recommendation (user prefers to keep all):', duplicate.category);
      }
    }

    return filtered;
  }

  /**
   * Generate cancellation instructions for specific subscriptions
   */
  static generateCancellationGuide(subscriptionName: string): {
    service: string;
    steps: string[];
    averageTime: string;
    warning?: string;
  } {
    const name = subscriptionName.toLowerCase();

    // Common cancellation guides
    const guides: Record<string, any> = {
      netflix: {
        service: 'Netflix',
        steps: [
          '1. Sign in to Netflix on a web browser',
          '2. Go to Account settings',
          '3. Click "Cancel Membership" under Membership & Billing',
          '4. Confirm cancellation',
          '5. Your access continues until the end of your billing period'
        ],
        averageTime: '2 minutes',
        warning: 'Netflix does not provide refunds. You\'ll have access until the end of your current billing period.'
      },
      disney: {
        service: 'Disney+',
        steps: [
          '1. Go to DisneyPlus.com and sign in',
          '2. Select your Profile',
          '3. Select Account',
          '4. Select "Cancel Subscription"',
          '5. Confirm your cancellation'
        ],
        averageTime: '2 minutes'
      },
      spotify: {
        service: 'Spotify',
        steps: [
          '1. Log in to Spotify.com/account',
          '2. Click "Manage your plan"',
          '3. Select "Change or cancel"',
          '4. Choose "Cancel Premium"',
          '5. Confirm cancellation'
        ],
        averageTime: '2 minutes',
        warning: 'You can continue using Spotify with ads on the free plan.'
      },
      'apple music': {
        service: 'Apple Music',
        steps: [
          '1. Open Settings on your iPhone',
          '2. Tap your name at the top',
          '3. Tap Subscriptions',
          '4. Tap Apple Music',
          '5. Tap "Cancel Subscription"'
        ],
        averageTime: '1 minute'
      }
    };

    // Find matching guide
    for (const [key, guide] of Object.entries(guides)) {
      if (name.includes(key)) {
        return guide;
      }
    }

    // Generic guide for unknown services
    return {
      service: subscriptionName,
      steps: [
        '1. Check your email for the subscription confirmation',
        '2. Look for cancellation links or account management options',
        '3. Sign in to the service\'s website or app',
        '4. Navigate to Account Settings or Subscription Management',
        '5. Look for "Cancel" or "Manage Subscription" options',
        '6. Follow the cancellation prompts'
      ],
      averageTime: '5-10 minutes',
      warning: 'Cancellation steps vary by service. Contact customer support if you need assistance.'
    };
  }
}

export default SubscriptionOptimizer;