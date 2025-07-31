import React, { createContext, useContext, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../app/auth/AuthContext";
import { notificationAPI } from "../services/api";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  transactionAlerts: boolean;
  budgetAlerts: boolean;
  accountAlerts: boolean;
  securityAlerts: boolean;
  insightAlerts: boolean;
  minimumTransactionAmount: number;
  budgetThresholds: number[];
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface NotificationHistoryItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'transaction' | 'budget' | 'account' | 'security' | 'insight';
  read: boolean;
  data?: Record<string, any>;
}

interface NotificationContextType {
  // Push token management
  expoPushToken: string | null;
  isTokenRegistered: boolean;
  registerForPushNotifications: () => Promise<boolean>;
  
  // Preferences
  preferences: NotificationPreferences | null;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<boolean>;
  
  // History
  notifications: NotificationHistoryItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  refreshNotifications: () => Promise<void>;
  
  // Status
  loading: boolean;
  error: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const defaultPreferences: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: false,
  smsEnabled: false,
  transactionAlerts: true,
  budgetAlerts: true,
  accountAlerts: true,
  securityAlerts: true,
  insightAlerts: true,
  minimumTransactionAmount: 1.0,
  budgetThresholds: [75, 90, 100],
  quietHours: {
    enabled: false,
    startTime: "22:00",
    endTime: "07:00",
  },
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoggedIn, user } = useAuth();
  
  // State
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isTokenRegistered, setIsTokenRegistered] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize notification system when user logs in
  useEffect(() => {
    if (isLoggedIn && user) {
      initializeNotifications();
    } else {
      // Clear data when user logs out
      setExpoPushToken(null);
      setIsTokenRegistered(false);
      setPreferences(null);
      setNotifications([]);
    }
  }, [isLoggedIn, user]);

  // Set up notification listeners
  useEffect(() => {
    let notificationListener: Notifications.Subscription;
    let responseListener: Notifications.Subscription;

    if (isLoggedIn) {
      // Listen for notifications received while app is foregrounded
      notificationListener = Notifications.addNotificationReceivedListener(handleNotificationReceived);

      // Listen for user interactions with notifications
      responseListener = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    }

    return () => {
      if (notificationListener) {
        Notifications.removeNotificationSubscription(notificationListener);
      }
      if (responseListener) {
        Notifications.removeNotificationSubscription(responseListener);
      }
    };
  }, [isLoggedIn]);

  const initializeNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Register for push notifications if possible
      const tokenRegistered = await registerForPushNotifications();
      
      // Load preferences
      await loadPreferences();
      
      // Load notification history
      await refreshNotifications();

      console.log("[NotificationContext] Initialized successfully", {
        tokenRegistered,
        hasPreferences: !!preferences,
        notificationCount: notifications.length,
      });
    } catch (error: any) {
      console.error("[NotificationContext] Initialization failed:", error);
      setError("Failed to initialize notifications");
    } finally {
      setLoading(false);
    }
  };

  const registerForPushNotifications = async (): Promise<boolean> => {
    try {
      if (!Device.isDevice) {
        console.log("[NotificationContext] Must use physical device for Push Notifications");
        return false;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log("[NotificationContext] Failed to get push token for push notification!");
        return false;
      }

      // Get the token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "849d0f63-bfaa-4d69-aa89-818904092d8b",
      });
      
      const token = tokenData.data;
      console.log("[NotificationContext] Got push token:", token.substring(0, 20) + "...");

      // Register token with backend
      const success = await registerTokenWithBackend(token);
      
      if (success) {
        setExpoPushToken(token);
        setIsTokenRegistered(true);
        
        // Store token locally
        await AsyncStorage.setItem("expoPushToken", token);
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error("[NotificationContext] Error registering for push notifications:", error);
      setError("Failed to register for push notifications");
      return false;
    }
  };

  const registerTokenWithBackend = async (token: string): Promise<boolean> => {
    try {
      const response = await notificationAPI.registerToken({
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceInfo: {
          deviceName: Device.deviceName || "Unknown Device",
          osVersion: Device.osVersion || "Unknown",
          appVersion: "1.0.0", // You can get this from app config
        },
      });

      return response.success || false;
    } catch (error: any) {
      console.error("[NotificationContext] Error registering token with backend:", error);
      return false;
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await notificationAPI.getPreferences();
      
      if (response.preferences) {
        setPreferences(response.preferences);
      } else {
        // Set default preferences
        setPreferences(defaultPreferences);
      }
    } catch (error: any) {
      console.error("[NotificationContext] Error loading preferences:", error);
      setPreferences(defaultPreferences);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>): Promise<boolean> => {
    try {
      if (!preferences) return false;

      const updatedPreferences = { ...preferences, ...updates };
      
      const response = await notificationAPI.updatePreferences(updatedPreferences);
      
      if (response.preferences) {
        setPreferences(response.preferences);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error("[NotificationContext] Error updating preferences:", error);
      setError("Failed to update preferences");
      return false;
    }
  };

  const refreshNotifications = async () => {
    try {
      // In a real implementation, you would fetch from your backend
      // For now, we'll use mock data
      const mockNotifications: NotificationHistoryItem[] = [
        {
          id: "1",
          title: "Budget Alert",
          message: "You've spent 80% of your monthly budget",
          time: "2 hours ago",
          type: "budget",
          read: false,
        },
        {
          id: "2",
          title: "Transaction Complete",
          message: "Payment of £45.20 to Tesco completed",
          time: "1 day ago",
          type: "transaction",
          read: true,
        },
        {
          id: "3",
          title: "New Bank Connected",
          message: "Your Lloyds Bank account has been connected",
          time: "2 days ago",
          type: "account",
          read: true,
        },
      ];

      setNotifications(mockNotifications);
    } catch (error: any) {
      console.error("[NotificationContext] Error refreshing notifications:", error);
      setError("Failed to load notifications");
    }
  };

  const handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log("[NotificationContext] Notification received:", notification);
    
    // Add to local notifications list
    const newNotification: NotificationHistoryItem = {
      id: Date.now().toString(),
      title: notification.request.content.title || "Notification",
      message: notification.request.content.body || "",
      time: "Just now",
      type: (notification.request.content.data?.type as any) || "account",
      read: false,
      data: notification.request.content.data,
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log("[NotificationContext] User interacted with notification:", response);
    
    // Handle navigation based on notification type
    const notificationData = response.notification.request.content.data;
    if (notificationData?.type) {
      // You can add navigation logic here based on notification type
      switch (notificationData.type) {
        case 'transaction':
          // Navigate to transactions page
          break;
        case 'budget':
          // Navigate to budget page
          break;
        case 'account':
          // Navigate to account page
          break;
        default:
          break;
      }
    }

    // Mark notification as read
    const notificationId = response.notification.request.identifier;
    markAsRead(notificationId);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    expoPushToken,
    isTokenRegistered,
    registerForPushNotifications,
    preferences,
    updatePreferences,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    refreshNotifications,
    loading,
    error,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};