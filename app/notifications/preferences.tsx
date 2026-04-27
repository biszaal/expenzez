import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  useNotifications,
  NotificationPreferences,
} from "../../contexts/NotificationContext";
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
  icon: string;
}

const simplifiedPreferences: PreferenceItem[] = [
  {
    key: "pushEnabled",
    title: "Push Notifications",
    subtitle: "Master switch for all notifications",
    icon: "notifications-outline",
  },
  {
    key: "transactionAlerts",
    title: "Transaction Alerts",
    subtitle: "Notify me about transactions",
    icon: "swap-horizontal-outline",
  },
  {
    key: "budgetAlerts",
    title: "Budget Alerts",
    subtitle: "Warn when approaching budget limits",
    icon: "pie-chart-outline",
  },
];

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { colors } = useTheme();
  const { preferences, updatePreferences } = useNotifications();

  const [localPreferences, setLocalPreferences] =
    useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handlePreferenceChange = async (
    key: keyof NotificationPreferences,
    value: any
  ) => {
    if (!localPreferences) return;

    const updatedPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(updatedPreferences);

    // Debounce API calls
    setSaving(true);
    try {
      await updatePreferences({ [key]: value });
    } catch (error) {
      console.error("Failed to update preference:", error);
    } finally {
      setSaving(false);
    }
  };

  const renderPreferenceItem = (item: PreferenceItem) => {
    if (!localPreferences) return null;

    const value = localPreferences[item.key];

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
          <View
            style={[
              styles.preferenceIcon,
              { backgroundColor: colors.primary.main[100] },
            ]}
          >
            <Ionicons
              name={item.icon as any}
              size={24}
              color={colors.primary.main}
            />
          </View>
          <View style={styles.preferenceContent}>
            <Text
              style={[
                styles.preferenceTitle,
                { color: colors.text.primary },
              ]}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.preferenceSubtitle,
                { color: colors.text.secondary },
              ]}
            >
              {item.subtitle}
            </Text>
          </View>
        </View>
        <Switch
          value={Boolean(value)}
          onValueChange={(newValue) =>
            handlePreferenceChange(item.key, newValue)
          }
          trackColor={{
            false: colors.gray[300],
            true: colors.primary.main[400],
          }}
          thumbColor={
            Boolean(value) ? colors.primary.main[600] : colors.gray[400]
          }
          ios_backgroundColor={colors.gray[300]}
        />
      </View>
    );
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
                color={colors.primary.main}
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
            Control when and how you receive notifications from Expenzez.
            Security alerts are always enabled for your protection.
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
          <View
            style={[
              styles.securityNote,
              { backgroundColor: colors.primary.main[100] },
            ]}
          >
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={colors.primary.main[600]}
            />
            <Text
              style={[styles.securityNoteText, { color: colors.primary.main[700] }]}
            >
              Security alerts (login attempts, failed logins) are always enabled
              and cannot be disabled to protect your account.
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
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  savingText: {
    fontSize: typography.fontSizes.sm,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  preferencesCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  preferenceLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  preferenceIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    marginBottom: 4,
  },
  preferenceSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  separator: {
    height: 1,
    marginLeft: spacing.lg + 40 + spacing.md,
  },
  description: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: spacing.md,
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
