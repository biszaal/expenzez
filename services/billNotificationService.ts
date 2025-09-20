import { DetectedBill } from './billTrackingAlgorithm';
import { apiClient } from './apiClient';

export interface SaveBillsResponse {
  success: boolean;
  message?: string;
}

export interface GetBillsResponse {
  bills: DetectedBill[];
  success: boolean;
}

export class BillNotificationService {
  /**
   * Save detected bills to the backend for notification tracking
   */
  static async saveBills(bills: DetectedBill[]): Promise<SaveBillsResponse> {
    try {

      const response = await apiClient.post('/bills/detected', {
        bills: bills.map(bill => ({
          ...bill,
          // Ensure we have all required fields for notifications
          userId: undefined, // Will be set by backend from JWT
          savedAt: Date.now(),
        }))
      });

      return response.data;
    } catch (error: any) {
      console.error('[BillNotificationService] Error saving bills:', error);
      throw new Error(error.response?.data?.message || 'Failed to save bills');
    }
  }

  /**
   * Get all saved bills for the current user
   */
  static async getBills(): Promise<GetBillsResponse> {
    try {
      const response = await apiClient.get('/bills/detected');
      return response.data;
    } catch (error: any) {
      console.error('[BillNotificationService] Error fetching bills:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch bills');
    }
  }

  /**
   * Send a test notification for a specific bill
   */
  static async sendTestNotification(bill: DetectedBill, type: 'upcoming' | 'due_today' | 'overdue' | 'insufficient_balance'): Promise<void> {
    try {
      const notificationData = this.createTestNotificationPayload(bill, type);
      await apiClient.post('/notifications/send', notificationData);
    } catch (error: any) {
      console.error('[BillNotificationService] Error sending test notification:', error);
      throw new Error(error.response?.data?.message || 'Failed to send notification');
    }
  }

  /**
   * Create notification payload for testing
   */
  private static createTestNotificationPayload(bill: DetectedBill, type: 'upcoming' | 'due_today' | 'overdue' | 'insufficient_balance') {
    const amount = Math.abs(bill.amount);

    let title: string;
    let message: string;
    let priority: 'low' | 'normal' | 'high' = 'normal';

    switch (type) {
      case 'overdue':
        title = `🚨 Overdue Bill: ${bill.name}`;
        message = `Your ${bill.name} payment of £${amount.toFixed(2)} was due on ${bill.nextDueDate}`;
        priority = 'high';
        break;
      case 'due_today':
        title = `⏰ Bill Due Today: ${bill.name}`;
        message = `Your ${bill.name} payment of £${amount.toFixed(2)} is due today`;
        priority = 'high';
        break;
      case 'insufficient_balance':
        title = `⚠️ Insufficient Balance: ${bill.name}`;
        message = `Your ${bill.name} payment of £${amount.toFixed(2)} is due soon, but you may not have sufficient balance`;
        priority = 'high';
        break;
      default: // upcoming
        title = `📅 Upcoming Bill: ${bill.name}`;
        message = `Your ${bill.name} payment of £${amount.toFixed(2)} is due in a few days (${bill.nextDueDate})`;
        priority = 'normal';
        break;
    }

    return {
      type: type === 'insufficient_balance' ? 'budget' : 'account',
      title,
      message,
      data: {
        billId: bill.id,
        billName: bill.name,
        merchant: bill.merchant,
        amount: amount.toString(),
        dueDate: bill.nextDueDate,
        reminderType: type,
        category: bill.category,
        frequency: bill.frequency,
        accountId: bill.accountId,
        bankName: bill.bankName,
        testNotification: 'true', // Flag to indicate this is a test
      },
      priority,
      sound: priority === 'high' ? 'default' : undefined
    };
  }

  /**
   * Enable or disable bill notifications for a specific bill
   */
  static async updateBillNotificationSettings(billId: string, enabled: boolean): Promise<void> {
    try {
      await apiClient.put('/bills/preferences', {
        billId,
        enabled,
      });
    } catch (error: any) {
      console.error('[BillNotificationService] Error updating notification settings:', error);
      throw new Error(error.response?.data?.message || 'Failed to update notification settings');
    }
  }
}