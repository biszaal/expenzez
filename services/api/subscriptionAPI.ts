import { api } from '../config/apiClient';
import { SubscriptionTier, SubscriptionInfo } from '../../contexts/SubscriptionContext';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  trialEndDate: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface SubscriptionUsage {
  aiChats: {
    used: number;
    limit: number;
    resetDate: string;
  };
  goals: {
    used: number;
    limit: number;
  };
  budgets: {
    used: number;
    limit: number;
  };
  exportReports: {
    used: number;
    limit: number;
  };
}

export interface TrialEligibility {
  eligible: boolean;
  reason?: string;
  daysOffered?: number;
}

class SubscriptionAPI {
  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const response = await api.get('/subscription');
      return response.data.subscription;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      // Return free tier default on error
      return {
        tier: 'free',
        isActive: false,
        startDate: null,
        endDate: null,
        trialEndDate: null,
        cancelAtPeriodEnd: false,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      };
    }
  }

  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      // For now, return hardcoded plans since /subscription/plans is not yet deployed
      return [
        {
          id: 'premium-monthly',
          name: 'Premium Monthly',
          price: 4.99,
          currency: 'GBP',
          interval: 'month',
          features: [
            'Enhanced security features',
            'Advanced analytics',
            'Unlimited AI conversations',
            'AI transaction categorization',
            'Bill predictions',
            'Unlimited goals & budgets',
          ],
        },
        {
          id: 'premium-annual',
          name: 'Premium Annual',
          price: 49.99,
          currency: 'GBP',
          interval: 'year',
          features: [
            'All monthly features',
            '2 months free',
            'Priority support',
            'Early access to new features',
          ],
          popular: true,
        },
      ];
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      // Return default plans on error
      return [
        {
          id: 'premium-monthly',
          name: 'Premium Monthly',
          price: 4.99,
          currency: 'GBP',
          interval: 'month',
          features: [
            'Enhanced security features',
            'Advanced analytics',
            'Unlimited AI conversations',
            'AI transaction categorization',
            'Bill predictions',
            'Unlimited goals & budgets',
          ],
        },
        {
          id: 'premium-annual',
          name: 'Premium Annual',
          price: 49.99,
          currency: 'GBP',
          interval: 'year',
          features: [
            'All monthly features',
            '2 months free',
            'Priority support',
            'Early access to new features',
          ],
          popular: true,
        },
      ];
    }
  }

  /**
   * Check trial eligibility
   */
  async checkTrialEligibility(): Promise<TrialEligibility> {
    try {
      const response = await api.get('/subscription/trial');
      return response.data;
    } catch (error) {
      console.warn('Trial API unavailable, using fallback data:', error.message || error);
      return {
        eligible: true,
        daysOffered: 14,
      };
    }
  }

  /**
   * Start premium trial
   */
  async startTrial(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post('/subscription/trial');
      return response.data;
    } catch (error: any) {
      console.error('Error starting trial:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to start trial',
      };
    }
  }

  /**
   * Subscribe to premium plan
   */
  async subscribeToPlan(
    planId: string,
    paymentMethodId?: string
  ): Promise<{ success: boolean; clientSecret?: string; message?: string }> {
    try {
      const response = await api.post('/subscription', {
        planId,
        paymentMethodId,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error subscribing to plan:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to subscribe',
      };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    cancelAtPeriodEnd: boolean = true
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete('/subscription', {
        data: { cancelAtPeriodEnd },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to cancel subscription',
      };
    }
  }

  /**
   * Resume cancelled subscription
   */
  async resumeSubscription(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post('/subscription/resume');
      return response.data;
    } catch (error: any) {
      console.error('Error resuming subscription:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resume subscription',
      };
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscriptionPlan(
    newPlanId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.put('/subscription/plan', {
        planId: newPlanId,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating subscription plan:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update plan',
      };
    }
  }

  /**
   * Get subscription usage statistics
   */
  async getSubscriptionUsage(): Promise<SubscriptionUsage> {
    try {
      const response = await api.get('/subscription/usage');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription usage:', error);
      // Return free tier limits on error
      return {
        aiChats: {
          used: 0,
          limit: 3,
          resetDate: new Date().toISOString(),
        },
        goals: {
          used: 0,
          limit: 1,
        },
        budgets: {
          used: 0,
          limit: 1,
        },
        exportReports: {
          used: 0,
          limit: 3,
        },
      };
    }
  }

  /**
   * Track feature usage
   */
  async trackUsage(
    feature: 'aiChats' | 'goals' | 'budgets' | 'exportReports',
    increment: number = 1
  ): Promise<{ success: boolean; remaining?: number; message?: string }> {
    try {
      const response = await api.post('/subscription/usage', {
        feature,
        amount: increment,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error tracking usage:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to track usage',
      };
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await api.get('/subscription/payment-methods');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(
    paymentMethodId: string,
    setAsDefault: boolean = false
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post('/subscription/payment-methods', {
        paymentMethodId,
        setAsDefault,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add payment method',
      };
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(
    paymentMethodId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete(`/subscription/payment-methods/${paymentMethodId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error removing payment method:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove payment method',
      };
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(
    paymentMethodId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.put(`/subscription/payment-methods/${paymentMethodId}/default`);
      return response.data;
    } catch (error: any) {
      console.error('Error setting default payment method:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to set default payment method',
      };
    }
  }

  /**
   * Get subscription history
   */
  async getSubscriptionHistory(): Promise<any[]> {
    try {
      const response = await api.get('/subscription/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      return [];
    }
  }

  /**
   * Download invoice
   */
  async downloadInvoice(invoiceId: string): Promise<{ success: boolean; url?: string; message?: string }> {
    try {
      const response = await api.get(`/subscription/invoices/${invoiceId}/download`);
      return response.data;
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to download invoice',
      };
    }
  }

  /**
   * Check feature availability for current tier
   */
  async checkFeatureAccess(feature: string): Promise<{ hasAccess: boolean; requiresUpgrade: boolean }> {
    try {
      const response = await api.get(`/subscription/features/${feature}/access`);
      return response.data;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return {
        hasAccess: false,
        requiresUpgrade: true,
      };
    }
  }
}

export const subscriptionAPI = new SubscriptionAPI();