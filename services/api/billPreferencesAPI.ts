import { api } from '../config/apiClient';

export interface BillPreference {
  userId: string;
  billId: string;
  category?: string;
  status: 'active' | 'inactive';
  customName?: string;
  isIgnored: boolean;
  userModified: boolean;
  createdAt: number;
  updatedAt: number;
  exclusionReason?: 'not_recurring' | 'no_longer_active' | 'incorrect_detection' | 'user_choice';
  reason?: string;
  excludedAt?: number;
}

export interface BillPreferencesResponse {
  preferences: BillPreference[];
  count: number;
}

/**
 * Bill Preferences API service for managing user bill exclusions
 * Allows users to dismiss bills they don't want to track
 */
export class BillPreferencesAPI {
  /**
   * Get all user bill exclusions
   */
  static async getBillExclusions(): Promise<BillPreference[]> {
    try {
      console.log('[BillPreferencesAPI] Fetching bill exclusions...');

      const response = await api.get<BillPreferencesResponse>('/bills/preferences');

      console.log('[BillPreferencesAPI] Retrieved preferences:', {
        count: response.data.count,
        ignored: response.data.preferences?.filter(p => p.isIgnored).length || 0,
        allPreferences: response.data.preferences?.map(p => ({
          billId: p.billId,
          customName: p.customName,
          isIgnored: p.isIgnored,
          exclusionReason: p.exclusionReason
        }))
      });

      // Filter to only return ignored/excluded bills
      const ignoredBills = response.data.preferences?.filter(p => p.isIgnored) || [];
      console.log('[BillPreferencesAPI] Returning ignored bills:', ignoredBills.map(b => ({
        billId: b.billId,
        customName: b.customName,
        exclusionReason: b.exclusionReason
      })));

      return ignoredBills;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('[BillPreferencesAPI] No bill exclusions found - user has no preferences');
        return [];
      }

      console.error('[BillPreferencesAPI] Error fetching bill exclusions:', error);
      throw error;
    }
  }

  /**
   * Exclude a bill from future detection
   */
  static async excludeBill(params: {
    merchant: string;
    amount: number;
    category: string;
    reason: 'not_recurring' | 'no_longer_active' | 'incorrect_detection' | 'user_choice';
  }): Promise<BillPreference> {
    try {
      console.log('[BillPreferencesAPI] Excluding bill:', {
        merchant: params.merchant,
        reason: params.reason
      });

      // Create a unique billId based on merchant and amount
      const billId = this.createBillId(params.merchant, params.amount);

      const response = await api.put<{
        success: boolean;
        message: string;
        preference: BillPreference;
      }>('/bills/preferences', {
        action: 'create',
        billId,
        category: params.category,
        status: 'inactive',
        isIgnored: true,
        customName: params.merchant,
        exclusionReason: params.reason
      });

      console.log('[BillPreferencesAPI] Bill excluded successfully:', response.data.message);

      return response.data.preference;
    } catch (error) {
      console.error('[BillPreferencesAPI] Error excluding bill:', error);
      throw error;
    }
  }

  /**
   * Re-include a previously excluded bill
   */
  static async includeBill(merchantPattern: string): Promise<void> {
    try {
      console.log('[BillPreferencesAPI] Re-including bill:', merchantPattern);

      await api.delete(`/bills/preferences/exclude/${encodeURIComponent(merchantPattern)}`);

      console.log('[BillPreferencesAPI] Bill re-included successfully');
    } catch (error) {
      console.error('[BillPreferencesAPI] Error re-including bill:', error);
      throw error;
    }
  }

  /**
   * Check if a merchant should be excluded from bill detection
   */
  static async isExcluded(merchant: string, exclusions?: BillPreference[]): Promise<boolean> {
    const normalizedMerchant = this.normalizeMerchantName(merchant);

    // Use provided exclusions or fetch from API
    const billExclusions = exclusions || await this.getBillExclusions();

    return billExclusions.some(exclusion => {
      const normalizedCustomName = exclusion.customName ? this.normalizeMerchantName(exclusion.customName) : '';
      return normalizedCustomName === normalizedMerchant;
    });
  }

  /**
   * Get exclusion reason for a merchant
   */
  static getExclusionReason(merchant: string, exclusions: BillPreference[]): string | null {
    const normalizedMerchant = this.normalizeMerchantName(merchant);

    const exclusion = exclusions.find(e => {
      const normalizedCustomName = e.customName ? this.normalizeMerchantName(e.customName) : '';
      return normalizedCustomName === normalizedMerchant;
    });

    if (!exclusion) return null;

    switch (exclusion.exclusionReason) {
      case 'not_recurring':
        return 'Marked as not a recurring bill';
      case 'no_longer_active':
        return 'No longer an active bill';
      case 'incorrect_detection':
        return 'Incorrectly detected as bill';
      case 'user_choice':
        return 'Excluded by user choice';
      default:
        return 'Excluded by user';
    }
  }

  /**
   * Create a unique bill ID from merchant and amount
   */
  private static createBillId(merchant: string, amount: number): string {
    const normalizedMerchant = this.normalizeMerchantName(merchant);
    const amountString = Math.abs(amount).toFixed(2);
    return `${normalizedMerchant}-${amountString}`.replace(/\s+/g, '-');
  }

  /**
   * Normalize merchant name for consistent matching
   * Uses same logic as bill detection algorithm
   */
  private static normalizeMerchantName(merchant: string): string {
    return merchant
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\b(ltd|limited|inc|corp|llc|co|plc)\b/g, '')
      .replace(/\b(payment|autopay|auto|recurring|subscription|monthly|annual)\b/g, '')
      .replace(/\b(direct|debit|dd|so|standing|order)\b/g, '')
      .replace(/\b(ref|reference|memo|description)\b/g, '')
      .replace(/\d{2,}/g, '')
      .trim();
  }

  /**
   * Get formatted exclusion stats for user
   */
  static async getExclusionStats(): Promise<{
    total: number;
    byReason: Record<string, number>;
    recentlyExcluded: BillPreference[];
  }> {
    try {
      const exclusions = await this.getBillExclusions();

      const byReason = exclusions.reduce((acc, exclusion) => {
        acc[exclusion.reason] = (acc[exclusion.reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const recentlyExcluded = exclusions
        .sort((a, b) => b.excludedAt - a.excludedAt)
        .slice(0, 5);

      return {
        total: exclusions.length,
        byReason,
        recentlyExcluded
      };
    } catch (error) {
      console.error('[BillPreferencesAPI] Error getting exclusion stats:', error);
      return {
        total: 0,
        byReason: {},
        recentlyExcluded: []
      };
    }
  }

  /**
   * Get bill preferences with additional filtering and merging capabilities
   */
  static async getBillPreferences(): Promise<BillPreference[]> {
    return this.getBillExclusions();
  }

  /**
   * Merge bills with preferences to provide enhanced bill data
   */
  static async mergeBillsWithPreferences(bills: any[], preferences?: BillPreference[]): Promise<any[]> {
    try {
      const prefs = preferences || await this.getBillPreferences();
      const preferencesMap = new Map(prefs.map(p => [p.billId, p]));

      return bills.map(bill => ({
        ...bill,
        preference: preferencesMap.get(bill.id),
        isIgnored: preferencesMap.get(bill.id)?.isIgnored || false,
        customName: preferencesMap.get(bill.id)?.customName || bill.name
      }));
    } catch (error) {
      console.error('[BillPreferencesAPI] Error merging bills with preferences:', error);
      return bills;
    }
  }

  /**
   * Update bill category
   */
  static async updateBillCategory(billId: string, category: string): Promise<boolean> {
    try {
      await api.put(`/bills/preferences/${billId}`, { category });
      return true;
    } catch (error) {
      console.error('[BillPreferencesAPI] Error updating bill category:', error);
      return false;
    }
  }

  /**
   * Update bill status
   */
  static async updateBillStatus(billId: string, status: 'active' | 'inactive'): Promise<boolean> {
    try {
      await api.put(`/bills/preferences/${billId}`, { status });
      return true;
    } catch (error) {
      console.error('[BillPreferencesAPI] Error updating bill status:', error);
      return false;
    }
  }

  /**
   * Create preference from bill
   */
  static async createPreferenceFromBill(bill: any, overrides: Partial<BillPreference> = {}): Promise<BillPreference> {
    return {
      userId: 'current-user', // This should come from auth context
      billId: bill.id,
      category: bill.category,
      status: 'active',
      customName: bill.name,
      isIgnored: false,
      userModified: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides
    };
  }

  /**
   * Save bill preference
   */
  static async saveBillPreference(preference: BillPreference): Promise<boolean> {
    try {
      await api.post('/bills/preferences', preference);
      return true;
    } catch (error) {
      console.error('[BillPreferencesAPI] Error saving bill preference:', error);
      return false;
    }
  }
}

// Export default methods for convenience
export const getBillExclusions = BillPreferencesAPI.getBillExclusions;
export const excludeBill = BillPreferencesAPI.excludeBill;
export const includeBill = BillPreferencesAPI.includeBill;
export const isExcluded = BillPreferencesAPI.isExcluded;