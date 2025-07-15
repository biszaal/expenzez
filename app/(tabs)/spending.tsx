import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { useTheme } from "../../contexts/ThemeContext";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

const { width } = Dimensions.get("window");

const months = ["May", "Jun", "Jul"];
const totalBudget = 600;
const totalSpent = 366.28;
const leftToSpend = totalBudget - totalSpent;

const categoryData = [
  {
    id: 1,
    icon: <MaterialCommunityIcons name="bus-clock" size={22} color="#3B82F6" />,
    name: "Transport",
    spent: 346.2,
    budget: 350,
    upcoming: 0,
    color: "#3B82F6",
  },
  {
    id: 2,
    icon: (
      <MaterialCommunityIcons
        name="home-thermometer-outline"
        size={22}
        color="#7C3AED"
      />
    ),
    name: "Home & Comfort",
    spent: 0,
    budget: 50,
    upcoming: 42.08,
    color: "#7C3AED",
  },
  {
    id: 3,
    icon: (
      <MaterialCommunityIcons
        name="food-apple-outline"
        size={22}
        color="#3B82F6"
      />
    ),
    name: "Groceries",
    spent: 120,
    budget: 200,
    upcoming: 0,
    color: "#3B82F6",
  },
  {
    id: 4,
    icon: <MaterialCommunityIcons name="run" size={22} color="#8B5CF6" />,
    name: "Fitness",
    spent: 40,
    budget: 100,
    upcoming: 0,
    color: "#8B5CF6",
  },
];

export default function SpendingPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { colors } = useTheme();
  const [selectedTab, setSelectedTab] = useState<"summary" | "categories">(
    "summary"
  );
  const [selectedMonth, setSelectedMonth] = useState("Jul");

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/auth/Login");
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return null;
  }

  const spentPercentage = (totalSpent / totalBudget) * 100;

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
        <LinearGradient
          colors={["rgba(59, 130, 246, 0.1)", "rgba(59, 130, 246, 0.05)"]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text
                style={[styles.headerTitle, { color: colors.text.primary }]}
              >
                <Text style={{ color: colors.primary[500] }}>expenzez</Text>{" "}
                Dashboard
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: colors.text.secondary },
                ]}
              >
                Track your spending patterns
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.headerButton,
                { backgroundColor: colors.background.primary },
              ]}
            >
              <Feather name="info" size={24} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Tab Switch */}
        <View
          style={[
            styles.tabSwitchWrapper,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.border.light,
            },
          ]}
        >
          <View style={styles.tabSwitchRow}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === "summary" && {
                  backgroundColor: colors.primary[500],
                },
              ]}
              onPress={() => setSelectedTab("summary")}
            >
              <Ionicons
                name="pie-chart-sharp"
                size={17}
                color={selectedTab === "summary" ? "#FFF" : colors.primary[500]}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  {
                    color:
                      selectedTab === "summary" ? "#FFF" : colors.primary[500],
                  },
                ]}
              >
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === "categories" && {
                  backgroundColor: colors.primary[500],
                },
              ]}
              onPress={() => setSelectedTab("categories")}
            >
              <Ionicons
                name="list"
                size={17}
                color={
                  selectedTab === "categories" ? "#FFF" : colors.primary[500]
                }
              />
              <Text
                style={[
                  styles.tabButtonText,
                  {
                    color:
                      selectedTab === "categories"
                        ? "#FFF"
                        : colors.primary[500],
                  },
                ]}
              >
                Categories
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Picker */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.monthPicker}
        >
          {months.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.monthButton,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                },
                selectedMonth === m && {
                  backgroundColor: colors.primary[500],
                  borderColor: colors.primary[500],
                },
              ]}
              onPress={() => setSelectedMonth(m)}
            >
              <Text
                style={[
                  styles.monthButtonText,
                  { color: colors.text.secondary },
                  selectedMonth === m && { color: "#FFF" },
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Main Card */}
        {selectedTab === "summary" && (
          <View style={styles.mainCardWrapper}>
            <LinearGradient
              colors={["#FFFFFF", "#F8FAFC"]}
              style={[styles.mainCard, { borderColor: colors.border.light }]}
            >
              <Text
                style={[styles.mainCardLabel, { color: colors.text.secondary }]}
              >
                This Month
              </Text>
              <View style={styles.mainCardHeader}>
                <View style={styles.mainCardHeaderLeft}>
                  <LinearGradient
                    colors={[colors.primary[500], "#8B5CF6"]}
                    style={styles.walletIconBg}
                  >
                    <MaterialCommunityIcons
                      name="wallet-outline"
                      color="white"
                      size={20}
                    />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.mainCardAmount,
                      { color: colors.text.primary },
                    ]}
                  >
                    £{totalSpent.toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      styles.mainCardAmountLabel,
                      { color: colors.text.secondary },
                    ]}
                  >
                    spent
                  </Text>
                </View>
                <TouchableOpacity>
                  <Ionicons
                    name="settings-outline"
                    color={colors.secondary[600]}
                    size={20}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.donutChartRow}>
                {/* Custom Donut Chart */}
                <View
                  style={[
                    styles.donutChartWrapper,
                    { backgroundColor: colors.background.primary },
                  ]}
                >
                  <View
                    style={[
                      styles.donutChartOuter,
                      { borderColor: colors.background.secondary },
                    ]}
                  >
                    <View
                      style={[
                        styles.donutChartInner,
                        { backgroundColor: colors.background.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.donutChartCenterAmount,
                          { color: colors.text.primary },
                        ]}
                      >
                        £{leftToSpend.toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          styles.donutChartCenterLabelText,
                          { color: colors.text.secondary },
                        ]}
                      >
                        left to spend
                      </Text>
                    </View>
                  </View>
                  {/* Progress Ring */}
                  <View
                    style={[
                      styles.progressRing,
                      { borderColor: colors.background.secondary },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        { borderColor: colors.primary[500] },
                        {
                          transform: [
                            { rotate: `${(spentPercentage / 100) * 360}deg` },
                          ],
                        },
                      ]}
                    />
                  </View>
                </View>
                {/* Legends */}
                <View style={styles.donutChartLegends}>
                  <View style={styles.donutChartLegendRow}>
                    <View
                      style={[
                        styles.donutChartLegendDot,
                        { backgroundColor: colors.primary[500] },
                      ]}
                    />
                    <Text
                      style={[
                        styles.donutChartLegendLabel,
                        { color: colors.text.secondary },
                      ]}
                    >
                      Spent
                    </Text>
                  </View>
                  <View style={styles.donutChartLegendRow}>
                    <View
                      style={[
                        styles.donutChartLegendDot,
                        { backgroundColor: colors.gray[200] },
                      ]}
                    />
                    <Text
                      style={[
                        styles.donutChartLegendLabel,
                        { color: colors.text.secondary },
                      ]}
                    >
                      Left
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Categories Tab */}
        {selectedTab === "categories" && (
          <View style={styles.categoriesTabWrapper}>
            {categoryData.map((category) => (
              <LinearGradient
                key={category.id}
                colors={["#FFFFFF", "#F8FAFC"]}
                style={[
                  styles.categoryCard,
                  { borderColor: colors.border.light },
                ]}
              >
                <View style={styles.categoryCardHeader}>
                  <View style={styles.categoryCardHeaderLeft}>
                    <LinearGradient
                      colors={[category.color, category.color + "80"]}
                      style={styles.categoryIconBg}
                    >
                      {category.icon}
                    </LinearGradient>
                    <View>
                      <Text
                        style={[
                          styles.categoryName,
                          { color: colors.text.primary },
                        ]}
                      >
                        {category.name}
                      </Text>
                      <Text
                        style={[
                          styles.categoryBudget,
                          { color: colors.text.secondary },
                        ]}
                      >
                        £{category.spent} / £{category.budget}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryCardHeaderRight}>
                    <Text
                      style={[
                        styles.categorySpent,
                        { color: colors.text.primary },
                      ]}
                    >
                      £{category.spent}
                    </Text>
                    <Text
                      style={[
                        styles.categoryPercent,
                        { color: colors.text.secondary },
                      ]}
                    >
                      {Math.round((category.spent / category.budget) * 100)}%
                    </Text>
                  </View>
                </View>
                {/* Progress Bar */}
                <View
                  style={[
                    styles.categoryProgressBarBg,
                    { backgroundColor: colors.background.secondary },
                  ]}
                >
                  <LinearGradient
                    colors={[category.color, category.color + "80"]}
                    style={[
                      styles.categoryProgressBarFill,
                      { width: `${(category.spent / category.budget) * 100}%` },
                    ]}
                  />
                </View>
              </LinearGradient>
            ))}
          </View>
        )}
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
    paddingVertical: spacing.lg,
    borderBottomLeftRadius: borderRadius["3xl"],
    borderBottomRightRadius: borderRadius["3xl"],
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700" as const,
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.base,
    marginTop: spacing.xs,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  tabSwitchWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius["3xl"],
    padding: spacing.xs,
    ...shadows.lg,
    borderWidth: 1,
  },
  tabSwitchRow: {
    flexDirection: "row",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  tabButtonText: {
    fontWeight: "600" as const,
    fontSize: typography.fontSizes.sm,
    marginLeft: spacing.sm,
  },
  monthPicker: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  monthButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginRight: spacing.xs,
    borderWidth: 1,
  },
  monthButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
  },
  mainCardWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  mainCard: {
    padding: spacing.xl,
    borderRadius: borderRadius["3xl"],
    borderWidth: 1,
    ...shadows.lg,
  },
  mainCardLabel: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600" as const,
    marginBottom: spacing.md,
  },
  mainCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  mainCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletIconBg: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  mainCardAmount: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700" as const,
  },
  mainCardAmountLabel: {
    fontSize: typography.fontSizes.sm,
    marginLeft: spacing.xs,
  },
  donutChartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  donutChartWrapper: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 70,
    ...shadows.md,
  },
  donutChartOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  donutChartInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  donutChartCenterAmount: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700" as const,
  },
  donutChartCenterLabelText: {
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.xs,
  },
  progressRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  progressFill: {
    width: "100%",
    height: "100%",
    borderRadius: 70,
    borderWidth: 10,
    transformOrigin: "center",
  },
  donutChartLegends: {
    marginLeft: spacing.lg,
    justifyContent: "center",
  },
  donutChartLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  donutChartLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  donutChartLegendLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
  },
  categoriesTabWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  categoryCard: {
    padding: spacing.lg,
    borderRadius: borderRadius["3xl"],
    borderWidth: 1,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  categoryCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  categoryCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIconBg: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  categoryName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600" as const,
  },
  categoryBudget: {
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.xs,
  },
  categoryCardHeaderRight: {
    alignItems: "flex-end",
  },
  categorySpent: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
  },
  categoryPercent: {
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.xs,
  },
  categoryProgressBarBg: {
    height: 8,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  categoryProgressBarFill: {
    height: "100%",
    borderRadius: borderRadius.full,
  },
});
