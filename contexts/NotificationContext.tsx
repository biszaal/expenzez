import React, { createContext, useContext, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../app/auth/AuthContext";
import { useSecurity } from "./SecurityContext";
import { notificationAPI } from "../services/api";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPreferences {
  // Core settings - reduced from 42 to 8 essential settings
  pushEnabled: boolean;                    // Master switch
  transactionAlerts: boolean;              // All transactions
  largeTransactionThreshold: number;       // Large transaction alerts (£500 default)
  budgetAlerts: boolean;                   // Budget warnings
  lowBalanceThreshold: number;             // Low balance alerts (£50 default)
  weeklyInsights: boolean;                 // Weekly summary instead of complex AI settings
  maxNotificationsPerDay: number;          // Simple daily limit (5/15/30)

  // Always-enabled security settings (not user-configurable)
  securityAlerts: boolean;                 // Always true - login/security issues
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
  
  // Manual retry
  retryNotificationSetup: () => Promise<void>;
  
  // Status
  loading: boolean;
  error: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const defaultPreferences: NotificationPreferences = {
  // Core simplified settings
  pushEnabled: true,
  transactionAlerts: true,
  largeTransactionThreshold: 500.0,          // Default £500 for large transactions
  budgetAlerts: true,
  lowBalanceThreshold: 50.0,                 // Default £50 for low balance
  weeklyInsights: true,
  maxNotificationsPerDay: 15,                // Default "Normal" (6-15 per day)

  // Always-enabled security (not user-configurable)
  securityAlerts: true,
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoggedIn, user } = useAuth();
  const { isLocked } = useSecurity();
  
  // State
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isTokenRegistered, setIsTokenRegistered] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize notification system when user logs in
  useEffect(() => {
    if (isLoggedIn && user && !isLocked) {
      console.log("🔔 [NotificationContext] User logged in and app unlocked, initializing notifications");
      initializeNotifications();
    } else if (isLoggedIn && user && isLocked) {
      console.log("🔒 [NotificationContext] App is locked, skipping notification initialization");
    } else {
      // Clear data when user logs out
      setExpoPushToken(null);
      setIsTokenRegistered(false);
      setPreferences(null);
      setNotifications([]);
    }
  }, [isLoggedIn, user, isLocked]);

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
        notificationListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, [isLoggedIn]);

  const initializeNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Longer delay to ensure auth tokens are fully ready after login
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Register for push notifications if possible
      const tokenRegistered = await registerForPushNotifications();
      
      // If token registration failed due to auth, retry after a delay
      if (!tokenRegistered) {
        console.log("[NotificationContext] Initial token registration failed, retrying in 3 seconds...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        await registerForPushNotifications();
      }
      
      // Load preferences with retry logic
      try {
        await loadPreferences();
      } catch (prefError: any) {
        console.log("[NotificationContext] Preferences load failed, using defaults:", prefError.message);
        setPreferences(defaultPreferences);
      }

      // Load notification history with retry logic
      try {
        await refreshNotifications();
      } catch (historyError: any) {
        console.log("[NotificationContext] History load failed, will retry later:", historyError.message);
        setNotifications([]);
      }

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
        return false;
      }

      // Get the token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "849d0f63-bfaa-4d69-aa89-818904092d8b",
      });
      
      const token = tokenData.data;

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
      console.log("[NotificationContext] Attempting to register token with backend...");
      
      const response = await notificationAPI.registerToken({
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceInfo: {
          deviceName: Device.deviceName || "Unknown Device",
          osVersion: Device.osVersion || "Unknown",
          appVersion: "1.0.0", // You can get this from app config
        },
      });

      console.log("[NotificationContext] Token registration response:", response);
      return response.success || false;
    } catch (error: any) {
      console.error("[NotificationContext] Error registering token with backend:", error);
      
      // If it's a 401 error, the user might need to re-authenticate
      if (error.response?.status === 401) {
        console.log("[NotificationContext] Authentication error during token registration. Will retry after login.");
        setError("Authentication required for notifications. Please log in again.");
      }
      
      return false;
    }
  };

  const loadPreferences = async () => {
    try {
      // Check if app is locked first
      if (isLocked) {
        console.log("🔒 [NotificationContext] App is locked, skipping preferences load");
        setPreferences(defaultPreferences);
        return;
      }

      const response = await notificationAPI.getPreferences();
      
      if (response.preferences) {
        setPreferences(response.preferences);
      } else {
        // Set default preferences
        setPreferences(defaultPreferences);
      }
    } catch (error: any) {
      // Reduce error noise in development - fallback to defaults works fine
      if (error.response?.status !== 404 && !error.message?.includes('Network Error') && !error.message?.includes('timeout')) {
        console.error("[NotificationContext] Error loading preferences:", error);
      } else {
        console.log("[NotificationContext] Server unavailable, using default preferences");
      }
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
      // Check if app is locked first
      if (isLocked) {
        console.log("🔒 [NotificationContext] App is locked, skipping notifications refresh");
        return;
      }

      // Import and use real data from dataSource API
      const { getRecentNotifications } = await import("../services/dataSource");
      const notificationData = await getRecentNotifications();
      
      
      if (notificationData && notificationData.length > 0) {
        // Load persisted read states from AsyncStorage
        const persistedReadStates = await AsyncStorage.getItem(`notification_read_states_${user?.id}`);
        const readStates = persistedReadStates ? JSON.parse(persistedReadStates) : {};
        
        // Transform data to match NotificationHistoryItem interface and apply persisted read states
        const notifications: NotificationHistoryItem[] = notificationData.map((item: any) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          time: formatTimestamp(item.timestamp),
          type: item.type,
          read: readStates[item.id] === true ? true : (item.isRead || false),
          data: {
            amount: item.amount,
            merchant: item.merchant,
            category: item.category,
            location: item.location,
            savingsAmount: item.savingsAmount,
          }
        }));

        setNotifications(notifications);
      } else {
        // No real notifications from backend
        setNotifications([]);
      }
    } catch (error: any) {
      console.error("[NotificationContext] Error refreshing notifications:", error);
      setError("Failed to load notifications");
      setNotifications([]);
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) {
      return "Just now";
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const handleNotificationReceived = (notification: Notifications.Notification) => {
    
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

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    // Persist read state to AsyncStorage
    await persistReadState(id, true);
  };

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    // Persist all read states to AsyncStorage
    const allIds = notifications.map(n => n.id);
    for (const id of allIds) {
      await persistReadState(id, true);
    }
  };

  // Helper function to persist read state
  const persistReadState = async (notificationId: string, isRead: boolean) => {
    try {
      const storageKey = `notification_read_states_${user?.id}`;
      const existingStates = await AsyncStorage.getItem(storageKey);
      const readStates = existingStates ? JSON.parse(existingStates) : {};
      
      readStates[notificationId] = isRead;
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(readStates));
    } catch (error) {
      console.error("[NotificationContext] Error persisting read state:", error);
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
    
    // Clear persisted read states from AsyncStorage
    try {
      const storageKey = `notification_read_states_${user?.id}`;
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error("[NotificationContext] Error clearing notification cache:", error);
    }
  };

  const retryNotificationSetup = async () => {
    console.log("[NotificationContext] Manual retry of notification setup...");
    await initializeNotifications();
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
    retryNotificationSetup,
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