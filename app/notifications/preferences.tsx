import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useNotifications, NotificationPreferences } from "../../contexts/NotificationContext";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

interface PreferenceSection {
  title: string;
  icon: string;
  description: string;
  preferences: PreferenceItem[];
}

interface PreferenceItem {
  key: keyof NotificationPreferences;
  title: string;
  subtitle: string;
  type: 'boolean' | 'number' | 'array' | 'time';
  icon?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const preferencesSections: PreferenceSection[] = [
  {
    title: "Delivery Channels",
    icon: "send-outline",
    description: "Choose how you want to receive notifications",
    preferences: [
      {
        key: "pushEnabled",
        title: "Push Notifications",
        subtitle: "Instant alerts on your device",
        type: "boolean",
        icon: "notifications-outline",
      },
      {
        key: "emailEnabled", 
        title: "Email Notifications",
        subtitle: "Get updates via email",
        type: "boolean",
        icon: "mail-outline",
      },
      {
        key: "smsEnabled",
        title: "SMS Notifications",
        subtitle: "Receive text message alerts",
        type: "boolean",
        icon: "chatbubble-outline",
      },
    ],
  },
  {
    title: "Transaction Alerts",
    icon: "card-outline",
    description: "Control when you&apos;re notified about spending",
    preferences: [
      {
        key: "transactionAlerts",
        title: "All Transaction Alerts",
        subtitle: "Enable/disable all transaction notifications",
        type: "boolean",
        icon: "swap-horizontal-outline",
      },
      {
        key: "minimumTransactionAmount",
        title: "Minimum Amount",
        subtitle: "Only notify for transactions above this amount",
        type: "number",
        min: 0,
        max: 1000,
        step: 1,
        unit: "£",
        icon: "calculator-outline",
      },
      {
        key: "largeTransactionThreshold",
        title: "Large Transaction Threshold",
        subtitle: "Amount considered unusually large",
        type: "number",
        min: 100,
        max: 5000,
        step: 50,
        unit: "£",
        icon: "warning-outline",
      },
      {
        key: "unusualSpendingAlerts",
        title: "Unusual Spending Patterns",
        subtitle: "Alert when spending deviates from normal patterns",
        type: "boolean",
        icon: "analytics-outline",
      },
      {
        key: "newMerchantAlerts",
        title: "New Merchant Alerts",
        subtitle: "Notify when spending at new merchants",
        type: "boolean",
        icon: "storefront-outline",
      },
    ],
  },
  {
    title: "Budget Alerts",
    icon: "trending-up-outline",
    description: "Stay on track with your spending goals",
    preferences: [
      {
        key: "budgetAlerts",
        title: "Budget Alerts",
        subtitle: "Enable budget threshold notifications",
        type: "boolean",
        icon: "pie-chart-outline",
      },
      {
        key: "categoryBudgetAlerts",
        title: "Category Budget Alerts",
        subtitle: "Separate alerts for spending categories",
        type: "boolean",
        icon: "apps-outline",
      },
      {
        key: "monthlyBudgetSummary",
        title: "Monthly Summary",
        subtitle: "End-of-month budget report",
        type: "boolean",
        icon: "calendar-outline",
      },
    ],
  },
  {
    title: "Security Alerts",
    icon: "shield-checkmark-outline",
    description: "Keep your account secure",
    preferences: [
      {
        key: "securityAlerts",
        title: "All Security Alerts",
        subtitle: "Enable/disable all security notifications",
        type: "boolean",
        icon: "shield-outline",
      },
      {
        key: "loginAlerts",
        title: "Login Notifications",
        subtitle: "Alert on successful logins",
        type: "boolean",
        icon: "log-in-outline",
      },
      {
        key: "newDeviceAlerts",
        title: "New Device Alerts",
        subtitle: "Notify when logging in from new devices",
        type: "boolean",
        icon: "phone-portrait-outline",
      },
      {
        key: "failedLoginAlerts",
        title: "Failed Login Attempts",
        subtitle: "Alert on unsuccessful login attempts",
        type: "boolean",
        icon: "alert-circle-outline",
      },
      {
        key: "locationChangeAlerts",
        title: "Location Change Alerts", 
        subtitle: "Notify when logging in from new locations",
        type: "boolean",
        icon: "location-outline",
      },
    ],
  },
  {
    title: "Account & Banking",
    icon: "business-outline",
    description: "Banking and account notifications",
    preferences: [
      {
        key: "accountAlerts",
        title: "Account Alerts",
        subtitle: "General account notifications",
        type: "boolean",
        icon: "wallet-outline",
      },
      {
        key: "bankConnectionAlerts",
        title: "Bank Connection Issues",
        subtitle: "Alert when bank connections need attention",
        type: "boolean",
        icon: "link-outline",
      },
      {
        key: "lowBalanceAlerts",
        title: "Low Balance Alerts",
        subtitle: "Notify when balance drops below threshold",
        type: "boolean",
        icon: "trending-down-outline",
      },
      {
        key: "lowBalanceThreshold",
        title: "Low Balance Threshold",
        subtitle: "Balance level that triggers alerts",
        type: "number",
        min: 0,
        max: 1000,
        step: 10,
        unit: "£",
        icon: "settings-outline",
      },
      {
        key: "recurringPaymentAlerts",
        title: "Recurring Payment Alerts",
        subtitle: "Notify about direct debits and subscriptions",
        type: "boolean",
        icon: "refresh-outline",
      },
    ],
  },
  {
    title: "AI & Insights",
    icon: "bulb-outline",
    description: "Personalized financial insights",
    preferences: [
      {
        key: "insightAlerts",
        title: "All AI Insights",
        subtitle: "Enable/disable all AI-generated insights",
        type: "boolean",
        icon: "bulb-outline",
      },
      {
        key: "dailyReminders",
        title: "Daily Expense Reminders",
        subtitle: "Evening reminders to track your daily spending (9 PM)",
        type: "boolean",
        icon: "alarm-outline",
      },
      {
        key: "weeklyInsights",
        title: "Weekly Insights",
        subtitle: "Weekly spending analysis and tips",
        type: "boolean",
        icon: "calendar-outline",
      },
      {
        key: "monthlyReports",
        title: "Monthly Reports",
        subtitle: "Comprehensive monthly financial reports",
        type: "boolean",
        icon: "document-text-outline",
      },
      {
        key: "savingsTips",
        title: "Savings Tips",
        subtitle: "Personalized money-saving recommendations",
        type: "boolean",
        icon: "trophy-outline",
      },
      {
        key: "creditScoreUpdates",
        title: "Credit Score Updates",
        subtitle: "Changes to your credit score",
        type: "boolean",
        icon: "trending-up-outline",
      },
    ],
  },
  {
    title: "Timing & Frequency",
    icon: "time-outline",
    description: "Control when and how often you receive notifications",
    preferences: [
      {
        key: "maxNotificationsPerDay",
        title: "Daily Notification Limit",
        subtitle: "Maximum notifications per day",
        type: "number",
        min: 1,
        max: 50,
        step: 1,
        icon: "settings-outline",
      },
      {
        key: "batchNotifications",
        title: "Batch Similar Notifications",
        subtitle: "Group similar notifications together",
        type: "boolean",
        icon: "layers-outline",
      },
    ],
  },
];

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { colors, isDark } = useTheme();
  const {
    preferences,
    updatePreferences,
    loading,
    error,
  } = useNotifications();

  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: any) => {
    if (!localPreferences) return;

    const updatedPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(updatedPreferences);

    // Debounce API calls
    setSaving(true);
    try {
      await updatePreferences({ [key]: value });
    } catch (error) {
      console.error('Failed to update preference:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderPreferenceItem = (item: PreferenceItem, sectionEnabled: boolean = true) => {
    if (!localPreferences) return null;

    const value = localPreferences[item.key];
    const isDisabled = !sectionEnabled;

    switch (item.type) {
      case 'boolean':
        return (
          <View
            key={item.key}
            style={[
              styles.preferenceItem,
              { 
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
                opacity: isDisabled ? 0.6 : 1,
              },
            ]}
          >
            <View style={styles.preferenceLeft}>
              {item.icon && (
                <View
                  style={[
                    styles.preferenceIcon,
                    { backgroundColor: colors.primary[100] },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={colors.primary[500]}
                  />
                </View>
              )}
              <View style={styles.preferenceContent}>
                <Text style={[styles.preferenceTitle, { color: colors.text.primary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.preferenceSubtitle, { color: colors.text.secondary }]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
            <Switch
              value={Boolean(value)}
              onValueChange={(newValue) => handlePreferenceChange(item.key, newValue)}
              disabled={isDisabled}
              trackColor={{ false: colors.gray[300], true: colors.primary[400] }}
              thumbColor={Boolean(value) ? colors.primary[600] : colors.gray[400]}
              ios_backgroundColor={colors.gray[300]}
            />
          </View>
        );

      case 'number':
        return (
          <View
            key={item.key}
            style={[
              styles.preferenceItem,
              { 
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
                opacity: isDisabled ? 0.6 : 1,
              },
            ]}
          >
            <View style={styles.preferenceLeft}>
              {item.icon && (
                <View
                  style={[
                    styles.preferenceIcon,
                    { backgroundColor: colors.primary[100] },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={colors.primary[500]}
                  />
                </View>
              )}
              <View style={styles.preferenceContent}>
                <Text style={[styles.preferenceTitle, { color: colors.text.primary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.preferenceSubtitle, { color: colors.text.secondary }]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
            <View style={styles.numberInputContainer}>
              <Text style={[styles.numberUnit, { color: colors.text.primary }]}>
                {item.unit}
              </Text>
              <TextInput
                style={[
                  styles.numberInput,
                  { 
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                  },
                ]}
                value={String(value || 0)}
                onChangeText={(text) => {
                  const numValue = parseFloat(text) || 0;
                  if (item.min !== undefined && numValue < item.min) return;
                  if (item.max !== undefined && numValue > item.max) return;
                  handlePreferenceChange(item.key, numValue);
                }}
                keyboardType="numeric"
                editable={!isDisabled}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (!isLoggedIn || !localPreferences) {
    return null;
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={[
                styles.backButton,
                { backgroundColor: colors.background.secondary },
                shadows.sm,
              ]}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Notification Preferences
            </Text>
            <View style={{ width: 32 }} />
          </View>
          {saving && (
            <Text style={[styles.savingText, { color: colors.text.secondary }]}>
              Saving...
            </Text>
          )}
        </View>

        {/* Preference Sections */}
        {preferencesSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <View
                  style={[
                    styles.sectionIcon,
                    { backgroundColor: colors.primary[100] },
                  ]}
                >
                  <Ionicons
                    name={section.icon as any}
                    size={28}
                    color={colors.primary[500]}
                  />
                </View>
                <View style={styles.sectionHeaderContent}>
                  <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    {section.title}
                  </Text>
                  <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
                    {section.description}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.preferencesCard,
                { 
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
              ]}
            >
              {section.preferences.map((preference, index) => (
                <View key={preference.key}>
                  {renderPreferenceItem(preference)}
                  {index < section.preferences.length - 1 && (
                    <View
                      style={[
                        styles.separator,
                        { backgroundColor: colors.border.light },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["2xl"],
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
  },
  savingText: {
    fontSize: typography.fontSizes.sm,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  sectionHeaderContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.fontSizes.sm,
  },
  preferencesCard: {
    borderRadius: borderRadius["2xl"],
    borderWidth: 1,
    overflow: "hidden",
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  preferenceLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    marginBottom: spacing.xs,
  },
  preferenceSubtitle: {
    fontSize: typography.fontSizes.sm,
  },
  numberInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  numberUnit: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    marginRight: spacing.sm,
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSizes.base,
    minWidth: 80,
    textAlign: "center",
  },
  separator: {
    height: 1,
    marginLeft: spacing.lg + 40 + spacing.md, // Icon width + margin
  },
});