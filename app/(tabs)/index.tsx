import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function HomeScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/auth/Login");
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Good morning, Bishal</Text>
              <Text style={styles.headerSubtitle}>
                Let&apos;s check your finances
          </Text>
            </View>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.gray[700]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCardWrapper}>
          <LinearGradient
            colors={[colors.primary[500], "#8B5CF6"]}
            style={styles.balanceCard}
          >
            <View style={styles.balanceCardHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <TouchableOpacity>
                <Ionicons name="eye-outline" size={20} color="white" />
          </TouchableOpacity>
            </View>
            <Text style={styles.balanceValue}>£2,847.50</Text>
            <View style={styles.balanceChangeRow}>
              <View style={styles.balanceChangeBadge}>
                <Text style={styles.balanceChangeText}>+12.5%</Text>
              </View>
              <Text style={styles.balanceChangeLabel}>from last month</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Add Bank Card */}
        <View style={styles.addBankCardWrapper}>
          <LinearGradient
            colors={["#FEF3C7", "#FDE68A"]}
            style={styles.addBankCard}
          >
            <View style={styles.addBankCardContent}>
              <View style={styles.addBankCardLeft}>
                <View style={styles.addBankIconContainer}>
            <MaterialCommunityIcons
                    name="bank-plus"
                    size={24}
                    color="#D97706"
            />
          </View>
                <View style={styles.addBankTextContainer}>
                  <Text style={styles.addBankTitle}>Connect Your Bank</Text>
                  <Text style={styles.addBankSubtitle}>
                    Link accounts for real-time data
          </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addBankButton}
                onPress={() => router.push("/banks/connect" as any)}
              >
                <Text style={styles.addBankButtonText}>Connect</Text>
                <Ionicons name="chevron-forward" size={16} color="#D97706" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionCard, { marginRight: spacing.md }]}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={colors.primary[500]}
                />
              </View>
              <Text style={styles.quickActionLabel}>Add Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionCard, { marginLeft: spacing.md }]}
              onPress={() => router.push("/banks/connect" as any)}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: colors.secondary[100] },
                ]}
              >
                <Ionicons
                  name="card-outline"
                  size={24}
                  color={colors.secondary[600]}
                />
          </View>
              <Text style={styles.quickActionLabel}>Connect Bank</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spending Overview */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>This Month</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
          </View>
          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <View>
                <Text style={styles.overviewLabel}>Spent</Text>
                <Text style={styles.overviewValue}>£1,247.80</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.overviewLabel}>Budget</Text>
                <Text style={styles.overviewValue}>£2,000</Text>
              </View>
            </View>
            {/* Progress Bar */}
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBarRow}>
                <Text style={styles.progressBarLabel}>62% used</Text>
                <Text style={styles.progressBarLabel}>£752.20 left</Text>
              </View>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={[colors.primary[500], "#8B5CF6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: "62%" }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transactionsList}>
            <View style={styles.transactionItem}>
              <View
                style={[
                  styles.transactionIcon,
                  { backgroundColor: colors.error[100] },
                ]}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={20}
                  color={colors.error[500]}
                />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>Restaurant</Text>
                <Text style={styles.transactionSubtitle}>Today, 2:30 PM</Text>
              </View>
              <Text style={styles.transactionAmountNegative}>-£45.20</Text>
            </View>
            <View style={styles.transactionItem}>
              <View
                style={[
                  styles.transactionIcon,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <Ionicons
                  name="car-outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>Uber</Text>
                <Text style={styles.transactionSubtitle}>
                  Yesterday, 8:15 AM
                </Text>
              </View>
              <Text style={styles.transactionAmountNegative}>-£12.50</Text>
            </View>
            <View style={styles.transactionItem}>
              <View
                style={[
                  styles.transactionIcon,
                  { backgroundColor: colors.secondary[100] },
                ]}
              >
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={colors.secondary[600]}
                />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>Salary</Text>
                <Text style={styles.transactionSubtitle}>Mar 1, 9:00 AM</Text>
              </View>
              <Text style={styles.transactionAmountPositive}>+£3,200.00</Text>
            </View>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          <View style={styles.categoriesRow}>
            <View style={[styles.categoryCard, { marginRight: spacing.md }]}>
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: colors.error[100] },
                ]}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={24}
                  color={colors.error[500]}
                />
              </View>
              <Text style={styles.categoryLabel}>Food</Text>
              <Text style={styles.categoryAmount}>£320</Text>
            </View>
            <View
              style={[styles.categoryCard, { marginHorizontal: spacing.sm }]}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <Ionicons
                  name="car-outline"
                  size={24}
                  color={colors.primary[500]}
                />
              </View>
              <Text style={styles.categoryLabel}>Transport</Text>
              <Text style={styles.categoryAmount}>£180</Text>
            </View>
            <View style={[styles.categoryCard, { marginLeft: spacing.md }]}>
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
            <Ionicons
                  name="shirt-outline"
                  size={24}
                  color={colors.primary[400]}
                />
              </View>
              <Text style={styles.categoryLabel}>Shopping</Text>
              <Text style={styles.categoryAmount}>£150</Text>
            </View>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
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
    backgroundColor: colors.background.primary,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700" as const,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.base,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  headerButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  balanceCardWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  balanceCard: {
    borderRadius: borderRadius["3xl"],
    padding: spacing.lg,
    ...shadows.lg,
  },
  balanceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: typography.fontSizes.sm,
    fontWeight: "500" as const,
  },
  balanceValue: {
    color: "white",
    fontSize: typography.fontSizes["3xl"],
    fontWeight: "700" as const,
    marginBottom: spacing.sm,
  },
  balanceChangeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceChangeBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  balanceChangeText: {
    color: "white",
    fontSize: typography.fontSizes.xs,
    fontWeight: "600" as const,
  },
  balanceChangeLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: typography.fontSizes.sm,
  },
  addBankCardWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  addBankCard: {
    borderRadius: borderRadius["3xl"],
    padding: spacing.lg,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  addBankCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addBankCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  addBankIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    ...shadows.sm,
  },
  addBankTextContainer: {
    flex: 1,
  },
  addBankTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    color: "#92400E",
    marginBottom: spacing.xs,
  },
  addBankSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: "#A16207",
    lineHeight: typography.fontSizes.sm * 1.4,
  },
  addBankButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  addBankButtonText: {
    color: "#D97706",
    fontWeight: "600" as const,
    fontSize: typography.fontSizes.sm,
    marginRight: spacing.xs,
  },
  sectionWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionLink: {
    color: colors.primary[500],
    fontWeight: "600" as const,
    fontSize: typography.fontSizes.sm,
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["2xl"],
    padding: spacing.lg,
    alignItems: "center",
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  quickActionLabel: {
    color: colors.text.primary,
    fontWeight: "500" as const,
    fontSize: typography.fontSizes.sm,
  },
  overviewCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["2xl"],
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  overviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  overviewLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSizes.sm,
  },
  overviewValue: {
    color: colors.text.primary,
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700" as const,
  },
  progressBarWrapper: {
    marginBottom: spacing.md,
  },
  progressBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  progressBarLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSizes.sm,
  },
  progressBarBg: {
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    height: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 12,
    borderRadius: borderRadius.full,
  },
  transactionsList: {
    gap: spacing.md,
  },
  transactionItem: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["2xl"],
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },
  transactionTitle: {
    color: colors.text.primary,
    fontWeight: "500" as const,
    fontSize: typography.fontSizes.base,
  },
  transactionSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSizes.sm,
  },
  transactionAmountNegative: {
    color: colors.error[600],
    fontWeight: "600" as const,
    fontSize: typography.fontSizes.base,
  },
  transactionAmountPositive: {
    color: colors.secondary[600],
    fontWeight: "600" as const,
    fontSize: typography.fontSizes.base,
  },
  categoriesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["2xl"],
    padding: spacing.lg,
    alignItems: "center",
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  categoryLabel: {
    color: colors.text.primary,
    fontWeight: "500" as const,
    fontSize: typography.fontSizes.sm,
  },
  categoryAmount: {
    color: colors.text.secondary,
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.xs,
  },
});
