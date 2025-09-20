export interface NotificationTemplate {
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high';
  category?: string;
  data?: { [key: string]: any };
}

export interface ScheduledNotification {
  id: string;
  template: NotificationTemplate;
  scheduledFor: Date;
  isActive: boolean;
}

export class SmartNotifications {
  private static notifications: ScheduledNotification[] = [];

  static async scheduleNotification(
    template: NotificationTemplate,
    scheduledFor: Date = new Date()
  ): Promise<string> {
    try {
      const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const notification: ScheduledNotification = {
        id,
        template,
        scheduledFor,
        isActive: true
      };

      this.notifications.push(notification);
      console.log('Notification scheduled:', template.title, 'for', scheduledFor);

      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  static async cancelNotification(id: string): Promise<void> {
    try {
      const index = this.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        this.notifications[index].isActive = false;
        console.log('Notification cancelled:', id);
      }
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  static async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
      return this.notifications.filter(n => n.isActive);
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  static async scheduleSpendingAlert(amount: number, category: string): Promise<string> {
    const template: NotificationTemplate = {
      title: 'Spending Alert',
      body: `You've spent £${amount.toFixed(2)} on ${category} today`,
      priority: 'normal',
      category: 'spending',
      data: { amount, category }
    };

    return this.scheduleNotification(template);
  }

  static async scheduleBudgetAlert(budgetName: string, spentAmount: number, budgetAmount: number): Promise<string> {
    const percentage = (spentAmount / budgetAmount) * 100;
    const template: NotificationTemplate = {
      title: 'Budget Alert',
      body: `You've used ${percentage.toFixed(0)}% of your ${budgetName} budget`,
      priority: percentage > 90 ? 'high' : 'normal',
      category: 'budget',
      data: { budgetName, spentAmount, budgetAmount, percentage }
    };

    return this.scheduleNotification(template);
  }

  static async scheduleBillReminder(billName: string, amount: number, dueDate: Date): Promise<string> {
    const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    const template: NotificationTemplate = {
      title: 'Bill Reminder',
      body: `${billName} payment of £${amount.toFixed(2)} is due in ${daysUntilDue} days`,
      priority: daysUntilDue <= 3 ? 'high' : 'normal',
      category: 'bills',
      data: { billName, amount, dueDate, daysUntilDue }
    };

    // Schedule for 24 hours before due date or now if already close
    const notificationDate = daysUntilDue > 1
      ? new Date(dueDate.getTime() - 24 * 60 * 60 * 1000)
      : new Date();

    return this.scheduleNotification(template, notificationDate);
  }

  static async clearAllNotifications(): Promise<void> {
    try {
      this.notifications = [];
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  static async processScheduledNotifications(): Promise<void> {
    try {
      const now = new Date();
      const dueNotifications = this.notifications.filter(
        n => n.isActive && n.scheduledFor <= now
      );

      for (const notification of dueNotifications) {
        console.log('Processing notification:', notification.template.title);
        // In a real implementation, this would trigger the actual notification
        notification.isActive = false;
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }
}