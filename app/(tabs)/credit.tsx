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

const creditOptions = [
  {
    icon: (
      <MaterialCommunityIcons
        name="bank-outline"
        size={28}
        color={colors.primary[500]}
      />
    ),
    name: "Loans",
    desc: "Flexible options for big dreams",
    bg: "#EBDFFC",
  },
  {
    icon: (
      <MaterialCommunityIcons
        name="car"
        size={28}
        color={colors.primary[500]}
      />
    ),
    name: "Auto finance",
    desc: "Drive now, pay later",
    bg: "#F3EDFC",
  },
  {
    icon: (
      <MaterialCommunityIcons
        name="home-roof"
        size={28}
        color={colors.primary[500]}
      />
    ),
    name: "Renovation credit",
    desc: "Upgrade your place",
    bg: "#EFF1F8",
  },
  {
    icon: (
      <MaterialCommunityIcons
        name="swap-horizontal"
        size={28}
        color={colors.primary[500]}
      />
    ),
    name: "Debt optimizer",
    desc: "Merge & manage debts",
    bg: "#F5F3FF",
  },
  {
    icon: (
      <MaterialCommunityIcons
        name="credit-card-outline"
        size={28}
        color={colors.primary[500]}
      />
    ),
    name: "Cards explorer",
    desc: "Find your perfect card",
    bg: "#F3F0FB",
  },
  {
    icon: (
      <MaterialCommunityIcons
        name="home-city-outline"
        size={28}
        color={colors.primary[500]}
      />
    ),
    name: "Mortgages",
    desc: "Unlock your new home",
    bg: "#F5F3FF",
  },
];

export default function CreditScreen() {
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
        <LinearGradient
          colors={["rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0.05)"]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={[colors.primary[500], "#8B5CF6"]}
                style={styles.headerAvatar}
              >
                <Text style={styles.headerAvatarText}>BA</Text>
              </LinearGradient>
              <View>
                <Text style={styles.headerTitle}>Credit & Offers</Text>
                <Text style={styles.headerSubtitle}>
                  Build your financial future
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.headerButton}>
              <Feather
                name="help-circle"
                size={24}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Credit options - vertical stack layout */}
        <View style={styles.verticalWrapper}>
          {creditOptions.map((opt) => (
            <TouchableOpacity
              key={opt.name}
              style={[styles.verticalCard, { backgroundColor: opt.bg }]}
            >
              <LinearGradient
                colors={["#FFFFFF", "#F8FAFC"]}
                style={styles.verticalCardIconBg}
              >
                {opt.icon}
              </LinearGradient>
              <View style={styles.verticalCardContent}>
                <Text style={styles.verticalCardTitle}>{opt.name}</Text>
                <Text style={styles.verticalCardDesc}>{opt.desc}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={22}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Offers section */}
        <View style={styles.offersWrapper}>
          <Text style={styles.offersTitle}>
            Exclusive Offers & Credit Boost
          </Text>
          <LinearGradient
            colors={["#FFFFFF", "#F8FAFC"]}
            style={styles.offersCard}
          >
            <View style={styles.offersStarsRow}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={30}
                color={colors.primary[500]}
                style={{ opacity: 0.8 }}
              />
              <MaterialCommunityIcons
                name="star-outline"
                size={30}
                color={colors.secondary[600]}
                style={{ marginHorizontal: 9, opacity: 0.63 }}
              />
              <MaterialCommunityIcons
                name="star-four-points"
                size={30}
                color={colors.primary[100]}
                style={{ opacity: 0.8 }}
              />
            </View>
            <Text style={styles.offersCardTitle}>
              Boost your credit with Rent Shield
            </Text>
            <Text style={styles.offersCardDesc}>
              Each new rent payment helps build your credit. We&apos;ll update
              Experian, Equifax, and TransUnion for you.
            </Text>
            <LinearGradient
              colors={[colors.primary[500], "#8B5CF6"]}
              style={styles.offersButton}
            >
              <Text style={styles.offersButtonText}>Get Started</Text>
              <Feather
                name="arrow-right"
                size={18}
                color="white"
                style={{ marginLeft: 8 }}
              />
            </LinearGradient>
          </LinearGradient>
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
    paddingVertical: spacing.lg,
    borderBottomLeftRadius: borderRadius["3xl"],
    borderBottomRightRadius: borderRadius["3xl"],
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  headerAvatarText: {
    color: "white",
    fontWeight: "700" as const,
    fontSize: typography.fontSizes.xl,
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
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },

  verticalWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  verticalCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius["3xl"],
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    width: "100%",
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  verticalCardIconBg: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    ...shadows.sm,
  },
  verticalCardContent: {
    flex: 1,
  },
  verticalCardTitle: {
    fontWeight: "700" as const,
    fontSize: typography.fontSizes.lg,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  verticalCardDesc: {
    color: colors.text.secondary,
    fontSize: typography.fontSizes.sm,
    fontWeight: "500" as const,
  },
  offersWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  offersTitle: {
    color: colors.text.primary,
    fontWeight: "700" as const,
    fontSize: typography.fontSizes.lg,
    marginBottom: spacing.md,
  },
  offersCard: {
    borderRadius: borderRadius["3xl"],
    padding: spacing.xl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  offersStarsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  offersCardTitle: {
    color: colors.text.primary,
    fontWeight: "700" as const,
    fontSize: typography.fontSizes.lg,
    textAlign: "center" as const,
    marginBottom: spacing.sm,
  },
  offersCardDesc: {
    color: colors.text.secondary,
    fontSize: typography.fontSizes.base,
    textAlign: "center" as const,
    marginBottom: spacing.lg,
    lineHeight: typography.fontSizes.base * 1.5,
  },
  offersButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  offersButtonText: {
    color: "white",
    fontWeight: "700" as const,
    fontSize: typography.fontSizes.base,
  },
});
