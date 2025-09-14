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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useNotifications, NotificationPreferences } from "../../contexts/NotificationContext";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

interface PreferenceItem {
  key: keyof NotificationPreferences;
  title: string;
  subtitle: string;
  type: 'boolean' | 'number' | 'select';
  icon?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { label: string; value: any }[];
}

const simplifiedPreferences: PreferenceItem[] = [
  {
    key: "pushEnabled",
    title: "Push Notifications",
    subtitle: "Master switch for all push notifications",
    type: "boolean",
    icon: "notifications-outline",
  },
  {
    key: "transactionAlerts",
    title: "Transaction Alerts",
    subtitle: "Notify me about all transactions",
    type: "boolean",
    icon: "swap-horizontal-outline",
  },
  {
    key: "largeTransactionThreshold",
    title: "Large Transaction Alerts",
    subtitle: "Notify for transactions over this amount",
    type: "number",
    min: 100,
    max: 2000,
    step: 50,
    unit: "£",
    icon: "warning-outline",
  },
  {
    key: "budgetAlerts",
    title: "Budget Alerts",
    subtitle: "Warn me when approaching budget limits",
    type: "boolean",
    icon: "pie-chart-outline",
  },
  {
    key: "lowBalanceThreshold",
    title: "Low Balance Alerts",
    subtitle: "Warn when account balance drops below",
    type: "number",
    min: 10,
    max: 500,
    step: 10,
    unit: "£",
    icon: "trending-down-outline",
  },
  {
    key: "weeklyInsights",
    title: "Weekly Summary",
    subtitle: "Receive weekly spending insights and tips",
    type: "boolean",
    icon: "calendar-outline",
  },
  {
    key: "maxNotificationsPerDay",
    title: "Notification Frequency",
    subtitle: "How many notifications per day",
    type: "select",
    icon: "settings-outline",
    options: [
      { label: "Few (1-5 per day)", value: 5 },
      { label: "Normal (6-15 per day)", value: 15 },
      { label: "Many (16+ per day)", value: 30 },
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

  const renderPreferenceItem = (item: PreferenceItem) => {
    if (!localPreferences) return null;

    const value = localPreferences[item.key];

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
              />
            </View>
          </View>
        );

      case 'select':
        const selectedOption = item.options?.find(opt => opt.value === value);
        return (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.preferenceItem,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              },
            ]}
            onPress={() => {
              if (item.options) {
                Alert.alert(
                  item.title,
                  "Choose your preference",
                  [
                    ...item.options.map(option => ({
                      text: option.label,
                      onPress: () => handlePreferenceChange(item.key, option.value),
                    })),
                    { text: "Cancel", style: "cancel" as const }
                  ]
                );
              }
            }}
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
            <View style={styles.selectContainer}>
              <Text style={[styles.selectValue, { color: colors.text.primary }]}>
                {selectedOption?.label || "Not set"}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.tertiary}
              />
            </View>
          </TouchableOpacity>
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
              Notifications
            </Text>
            <View style={{ width: 32 }} />
          </View>
          {saving && (
            <Text style={[styles.savingText, { color: colors.text.secondary }]}>
              Saving...
            </Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.description, { color: colors.text.secondary }]}>
            Control when and how you receive notifications from Expenzez. Security alerts are always enabled for your protection.
          </Text>
        </View>

        {/* Simplified Preferences */}
        <View style={styles.section}>
          <View
            style={[
              styles.preferencesCard,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              },
            ]}
          >
            {simplifiedPreferences.map((preference, index) => (
              <View key={preference.key}>
                {renderPreferenceItem(preference)}
                {index < simplifiedPreferences.length - 1 && (
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

        {/* Security Note */}
        <View style={styles.section}>
          <View style={[styles.securityNote, { backgroundColor: colors.primary[100] }]}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={colors.primary[600]}
            />
            <Text style={[styles.securityNoteText, { color: colors.primary[700] }]}>
              Security alerts (login attempts, failed logins) are always enabled and cannot be disabled to protect your account.
            </Text>
          </View>
        </View>
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
  description: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  selectContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectValue: {
    fontSize: typography.fontSizes.base,
    fontWeight: "500" as const,
    marginRight: spacing.sm,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  securityNoteText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    lineHeight: 18,
  },
});