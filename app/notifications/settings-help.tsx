import { Ionicons , MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

interface NotificationTypeInfo {
  title: string;
  icon: string;
  description: string;
  examples: string[];
  triggers: string[];
  timing: string;
  priority: 'Low' | 'Medium' | 'High';
}

const notificationTypes: NotificationTypeInfo[] = [
  {
    title: "Transaction Alerts",
    icon: "swap-horizontal-outline",
    description: "Real-time notifications about your spending and income",
    examples: [
      "£45.99 spent at Tesco",
      "£2,500 salary received",
      "Large transaction: £899 at Amazon UK",
      "Unusual spending at new merchant"
    ],
    triggers: [
      "Any transaction above your minimum amount threshold",
      "Large transactions (above £500 by default)",
      "Spending at completely new merchants",
      "Transactions that deviate from your normal patterns",
      "Income deposits and transfers"
    ],
    timing: "Instant (within 1-2 minutes of transaction)",
    priority: "Medium"
  },
  {
    title: "Budget Alerts",
    icon: "trending-up-outline", 
    description: "Keep track of your spending goals and limits",
    examples: [
      "You've used 85% of your monthly budget",
      "Dining budget exceeded: £420/£400",
      "Weekly spending summary available",
      "Monthly budget report ready"
    ],
    triggers: [
      "75%, 85%, 95%, and 100% of monthly budget reached",
      "Category budget thresholds exceeded",
      "End of week/month budget summaries",
      "Overspending in specific categories"
    ],
    timing: "Every 6 hours check, immediate alerts when thresholds hit",
    priority: "Medium"
  },
  {
    title: "Security Alerts",
    icon: "shield-checkmark-outline",
    description: "Protect your account with security notifications",
    examples: [
      "New login from iPhone in London",
      "Failed login attempt detected",
      "New device added to account",
      "Suspicious login pattern detected"
    ],
    triggers: [
      "Successful logins from new devices/locations",
      "Failed login attempts",
      "Multiple logins from different locations quickly",
      "Password changes or security setting updates"
    ],
    timing: "Instant security monitoring",
    priority: "High"
  },
  {
    title: "Account & Banking",
    icon: "business-outline",
    description: "Stay informed about your bank connections and account status",
    examples: [
      "Bank connection lost - action required",
      "Low balance alert: £45 remaining",
      "Direct debit processed: Netflix £9.99",
      "Account balance updated"
    ],
    triggers: [
      "Bank connections expire or fail",
      "Balance drops below your threshold (£100 default)",
      "Recurring payments like direct debits",
      "Account sync issues or reconnection needed"
    ],
    timing: "Real-time for connection issues, daily for balance checks",
    priority: "High"
  },
  {
    title: "AI & Insights",
    icon: "bulb-outline",
    description: "Personalized financial advice and spending insights",
    examples: [
      "You could save £50 by switching subscriptions",
      "Weekly spending analysis ready",
      "Credit score increased by 15 points",
      "Unusual spending pattern detected this week"
    ],
    triggers: [
      "Weekly spending analysis completed",
      "Monthly financial reports generated",
      "Money-saving opportunities identified",
      "Credit score changes detected"
    ],
    timing: "Weekly insights, monthly reports, instant credit score updates",
    priority: "Low"
  },
];

const timingSettings = [
  {
    title: "Quiet Hours",
    description: "No notifications between 22:00 - 07:00 by default",
    icon: "moon-outline"
  },
  {
    title: "Daily Limit",
    description: "Maximum 10 notifications per day to avoid spam",
    icon: "speedometer-outline"
  },
  {
    title: "Batching",
    description: "Similar notifications grouped together when possible",
    icon: "layers-outline"
  },
  {
    title: "Priority System",
    description: "High priority alerts bypass quiet hours and limits",
    icon: "flash-outline"
  }
];

export default function NotificationSettingsHelpScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return colors.error.main;
      case 'Medium': return colors.warning.main;
      case 'Low': return colors.success.main;
      default: return colors.text.secondary;
    }
  };

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
              When You&apos;ll Get Notified
            </Text>
            <View style={{ width: 32 }} />
          </View>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <View
            style={[
              styles.introCard,
              { 
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={32}
              color={colors.primary.main}
              style={styles.introIcon}
            />
            <Text style={[styles.introTitle, { color: colors.text.primary }]}>
              Smart Financial Notifications
            </Text>
            <Text style={[styles.introDescription, { color: colors.text.secondary }]}>
              Expenzez uses intelligent algorithms to send you the right notifications at the right time. Here&apos;s exactly when and why you&apos;ll receive alerts.
            </Text>
          </View>
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Notification Types
          </Text>
          
          {notificationTypes.map((type, index) => (
            <View
              key={type.title}
              style={[
                styles.typeCard,
                { 
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
              ]}
            >
              <View style={styles.typeHeader}>
                <View
                  style={[
                    styles.typeIcon,
                    { backgroundColor: colors.primary.main[100] },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={type.icon as any}
                    size={28}
                    color={colors.primary.main}
                  />
                </View>
                <View style={styles.typeHeaderContent}>
                  <Text style={[styles.typeTitle, { color: colors.text.primary }]}>
                    {type.title}
                  </Text>
                  <View style={styles.priorityBadge}>
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: getPriorityColor(type.priority) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        { color: getPriorityColor(type.priority) },
                      ]}
                    >
                      {type.priority} Priority
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.typeDescription, { color: colors.text.secondary }]}>
                {type.description}
              </Text>

              <View style={styles.subsection}>
                <Text style={[styles.subsectionTitle, { color: colors.text.primary }]}>
                  Examples:
                </Text>
                {type.examples.map((example, idx) => (
                  <View key={idx} style={styles.exampleItem}>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={16}
                      color={colors.text.tertiary}
                    />
                    <Text style={[styles.exampleText, { color: colors.text.secondary }]}>
                      &quot;{example}&quot;
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.subsection}>
                <Text style={[styles.subsectionTitle, { color: colors.text.primary }]}>
                  Triggered by:
                </Text>
                {type.triggers.map((trigger, idx) => (
                  <View key={idx} style={styles.triggerItem}>
                    <MaterialCommunityIcons
                      name="circle-small"
                      size={20}
                      color={colors.primary.main[400]}
                    />
                    <Text style={[styles.triggerText, { color: colors.text.secondary }]}>
                      {trigger}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.timingSection}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color={colors.text.tertiary}
                  style={styles.timingIcon}
                />
                <Text style={[styles.timingText, { color: colors.text.secondary }]}>
                  <Text style={[styles.timingLabel, { color: colors.text.primary }]}>
                    Timing:{" "}
                  </Text>
                  {type.timing}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Timing Controls */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Smart Timing Controls
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
            We respect your time with intelligent notification timing
          </Text>

          {timingSettings.map((setting, index) => (
            <View
              key={setting.title}
              style={[
                styles.timingCard,
                { 
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
              ]}
            >
              <View
                style={[
                  styles.timingIcon,
                  { backgroundColor: colors.primary.main[100] },
                ]}
              >
                <MaterialCommunityIcons
                  name={setting.icon as any}
                  size={24}
                  color={colors.primary.main}
                />
              </View>
              <View style={styles.timingContent}>
                <Text style={[styles.timingTitle, { color: colors.text.primary }]}>
                  {setting.title}
                </Text>
                <Text style={[styles.timingDescription, { color: colors.text.secondary }]}>
                  {setting.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Call to Action */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.settingsButton,
              { backgroundColor: colors.primary.main },
            ]}
            onPress={() => router.push('/notifications/preferences')}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={24}
              color="white"
              style={styles.settingsButtonIcon}
            />
            <Text style={[styles.settingsButtonText, { color: "white" }]}>
              Customize Your Preferences
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="white"
            />
          </TouchableOpacity>
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
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: typography.fontSizes.sm,
    marginBottom: spacing.md,
  },
  introCard: {
    padding: spacing.lg,
    borderRadius: borderRadius["2xl"],
    borderWidth: 1,
    alignItems: "center",
    textAlign: "center" as const,
  },
  introIcon: {
    marginBottom: spacing.md,
  },
  introTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
    marginBottom: spacing.sm,
    textAlign: "center" as const,
  },
  introDescription: {
    fontSize: typography.fontSizes.base,
    textAlign: "center" as const,
    lineHeight: 22,
  },
  typeCard: {
    padding: spacing.lg,
    borderRadius: borderRadius["2xl"],
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  typeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  typeHeaderContent: {
    flex: 1,
  },
  typeTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    marginBottom: spacing.xs,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  priorityText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
  },
  typeDescription: {
    fontSize: typography.fontSizes.base,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  subsection: {
    marginBottom: spacing.md,
  },
  subsectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
    marginBottom: spacing.sm,
  },
  exampleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  exampleText: {
    fontSize: typography.fontSizes.sm,
    flex: 1,
    marginLeft: spacing.sm,
    fontStyle: "italic" as const,
  },
  triggerItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  triggerText: {
    fontSize: typography.fontSizes.sm,
    flex: 1,
    marginLeft: spacing.xs,
  },
  timingSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.sm,
  },
  timingIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  timingText: {
    fontSize: typography.fontSizes.sm,
    flex: 1,
  },
  timingLabel: {
    fontWeight: "600" as const,
  },
  timingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  timingIconSecondary: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  timingContent: {
    flex: 1,
  },
  timingTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    marginBottom: spacing.xs,
  },
  timingDescription: {
    fontSize: typography.fontSizes.sm,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    borderRadius: borderRadius["2xl"],
  },
  settingsButtonIcon: {
    marginRight: spacing.md,
  },
  settingsButtonText: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    flex: 1,
    textAlign: "center" as const,
  },
});