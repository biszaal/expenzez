import { api, aiAPI } from "../config/apiClient";
import { CURRENT_API_CONFIG } from "../../config/api";

const API_BASE_URL = CURRENT_API_CONFIG.baseURL;

export const notificationAPI = {
  // Device token management
  registerToken: async (tokenData: {
    token: string;
    platform: 'ios' | 'android' | 'web';
    deviceInfo?: {
      deviceName?: string;
      osVersion?: string;
      appVersion?: string;
    };
  }) => {
    try {
      const response = await api.post('/notifications/tokens', tokenData);
      return response.data;
    } catch (error: any) {
      console.error('Error registering notification token:', error);
      throw error;
    }
  },

  deactivateToken: async (tokenId?: string, token?: string) => {
    try {
      const response = await api.delete('/notifications/tokens', {
        data: { tokenId, token },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deactivating notification token:', error);
      throw error;
    }
  },

  getTokens: async () => {
    try {
      const response = await api.get('/notifications/tokens');
      return response.data;
    } catch (error: any) {
      console.error('Error getting notification tokens:', error);
      throw error;
    }
  },

  // Preferences management
  getPreferences: async () => {
    try {
      const response = await api.get('/notifications/preferences');
      return response.data;
    } catch (error: any) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  },

  updatePreferences: async (preferences: any) => {
    try {
      const response = await api.put('/notifications/preferences', preferences);
      return response.data;
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  },

  // Send notification (for testing)
  sendNotification: async (notificationData: {
    type: 'transaction' | 'budget' | 'account' | 'security' | 'insight';
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: 'low' | 'normal' | 'high';
  }) => {
    try {
      const response = await api.post('/notifications/send', notificationData);
      return response.data;
    } catch (error: any) {
      console.error('Error sending notification:', error);
      console.error('🔔 [API] Request details:', {
        baseURL: API_BASE_URL,
        url: error.config?.url,
        method: error.config?.method,
        fullRequestURL: error.config?.baseURL + error.config?.url,
      });
      throw error;
    }
  },

  // Get notification history from DynamoDB
  getHistory: async (limit?: number) => {
    try {
      const response = await api.get('/notifications/history', {
        params: { limit: limit || 50 },
        timeout: 45000, // 45 seconds timeout for notifications
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('Notification history request timed out');
        // Return empty result instead of throwing
        return { success: false, notifications: [], count: 0 };
      }
      console.error('Error fetching notification history:', error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    try {
      const response = await api.post('/notifications/mark-read', {
        notificationId,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Clear all notifications
  clearAll: async () => {
    try {
      const response = await api.delete('/notifications');
      return response.data;
    } catch (error: any) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  },

  // Monthly AI Reports
  getMonthlyReport: async (reportMonth: string = 'latest') => {
    try {
      const response = await aiAPI.get(`/ai/monthly-report/${reportMonth}`, {
        timeout: 30000, // 30 seconds timeout
      });
      return response.data;
    } catch (error: any) {
      // Don't log 404 or 401 errors - this feature is optional and may not be deployed yet
      if (error.response?.status === 404) {
        return { hasReports: false, message: 'Monthly reports feature not available' };
      }
      if (error.response?.status === 401) {
        // Authentication error - feature requires backend deployment
        console.log('[NotificationAPI] Monthly reports require authentication - feature not fully deployed');
        return { hasReports: false, message: 'Monthly reports feature not available yet' };
      }
      console.error('Error fetching monthly report:', error);
      throw error;
    }
  },
};