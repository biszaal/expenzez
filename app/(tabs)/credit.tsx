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
  Alert,
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
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { getProfile } from "../../services/dataSource";

const SCREEN_WIDTH = Dimensions.get("window").width;

const getCreditOptions = (colors: any) => [
  {
    icon: "bank-outline",
    name: "Loans",
    desc: "Flexible options for big dreams",
    status: "Coming Soon",
    gradient: [colors.primary[100], colors.primary[50]],
    iconColor: colors.primary[500],
  },
  {
    icon: "car",
    name: "Auto Finance",
    desc: "Drive now, pay later",
    status: "Coming Soon",
    gradient: [colors.secondary?.[100] || colors.primary[100], colors.secondary?.[50] || colors.primary[50]],
    iconColor: colors.secondary?.[500] || colors.primary[500],
  },
  {
    icon: "home-roof",
    name: "Renovation Credit",
    desc: "Upgrade your place",
    status: "Coming Soon",
    gradient: [colors.success?.[100] || colors.primary[100], colors.success?.[50] || colors.primary[50]],
    iconColor: colors.success?.[500] || colors.primary[500],
  },
  {
    icon: "swap-horizontal",
    name: "Debt Optimizer",
    desc: "Merge & manage debts",
    status: "Coming Soon",
    gradient: [colors.warning?.[100] || colors.primary[100], colors.warning?.[50] || colors.primary[50]],
    iconColor: colors.warning?.[500] || colors.primary[500],
  },
  {
    icon: "credit-card-outline",
    name: "Cards Explorer",
    desc: "Find your perfect card",
    status: "Coming Soon",
    gradient: [colors.primary[100], colors.primary[50]],
    iconColor: colors.primary[500],
  },
  {
    icon: "home-city-outline",
    name: "Mortgages",
    desc: "Unlock your new home",
    status: "Coming Soon",
    gradient: [colors.secondary?.[100] || colors.primary[100], colors.secondary?.[50] || colors.primary[50]],
    iconColor: colors.secondary?.[500] || colors.primary[500],
  },
];

export default function CreditScreen() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const {
    isLoggedIn: authLoggedIn,
    hasBank,
    checkingBank,
  } = useAuthGuard(undefined, true);
  const { colors } = useTheme();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Handle coming soon features
  const showComingSoon = (featureName: string) => {
    Alert.alert(
      "Coming Soon",
      `${featureName} feature is currently under development and will be available in a future update.`,
      [{ text: "OK", style: "default" }]
    );
  };

  const creditOptions = getCreditOptions(colors);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const profileData = await getProfile();
        setProfile(profileData);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchUserData();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!authLoggedIn) {
      router.replace("/auth/Login");
    }
  }, [authLoggedIn, hasBank, checkingBank]);

  if (!authLoggedIn || checkingBank) {
    return null;
  }

  // Get user initials
  const getUserInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      const firstName = profile.firstName;
      const lastName = profile.lastName;
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user?.name) {
      const names = user.name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return user.name[0]?.toUpperCase() || "U";
    }
    if (user?.email) {
      return user.email[0]?.toUpperCase() || "U";
    }
    return "U";
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
        {/* Premium Header */}
        <View style={styles.premiumHeader}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={[styles.premiumHeaderTitle, { color: colors.text.primary }]}>
                Credit & Loans
              </Text>
              <Text style={[styles.premiumHeaderSubtitle, { color: colors.text.secondary }]}>
                Build your financial future
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.premiumHelpButton, { backgroundColor: colors.background.primary, ...shadows.sm }]}
              onPress={() => showComingSoon("Help & Support")}
            >
              <Ionicons name="help-circle-outline" size={20} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Credit Score Card */}
        <View style={styles.creditScoreSection}>
          <LinearGradient
            colors={[colors.primary[500], '#8B5CF6']}
            style={[styles.creditScoreCard, shadows.lg]}
          >
            <View style={styles.creditScoreContent}>
              <View style={styles.creditScoreHeader}>
                <View style={styles.creditScoreAvatar}>
                  <Text style={styles.creditScoreAvatarText}>{getUserInitials()}</Text>
                </View>
                <View style={styles.creditScoreBadge}>
                  <Ionicons name="trending-up" size={16} color="white" />
                  <Text style={styles.creditScoreBadgeText}>Premium</Text>
                </View>
              </View>
              <Text style={styles.creditScoreTitle}>Your Credit Score</Text>
              <Text style={styles.creditScoreValue}>Coming Soon</Text>
              <Text style={styles.creditScoreSubtext}>
                We&apos;ll help you track and improve your credit score
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.creditScoreButton}
              onPress={() => showComingSoon("Credit Score Tracking")}
            >
              <Text style={styles.creditScoreButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Premium Credit Options */}
        <View style={styles.premiumOptionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Credit Products
          </Text>
          <View style={styles.optionsGrid}>
            {creditOptions.map((opt, index) => (
              <TouchableOpacity
                key={opt.name}
                style={styles.optionCard}
                onPress={() => showComingSoon(opt.name)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={opt.gradient as any}
                  style={[styles.optionCardGradient, shadows.md]}
                >
                  <View style={[styles.optionIcon, { backgroundColor: opt.iconColor }]}>
                    <MaterialCommunityIcons 
                      name={opt.icon as any} 
                      size={24} 
                      color="white" 
                    />
                  </View>
                  <Text style={[styles.optionTitle, { color: colors.text.primary }]}>
                    {opt.name}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.text.secondary }]}>
                    {opt.desc}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: colors.background.secondary }]}>
                    <Text style={[styles.statusText, { color: colors.text.tertiary }]}>
                      {opt.status}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Premium Offers Section */}
        <View style={styles.premiumOffersSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Exclusive Offers
          </Text>
          <LinearGradient
            colors={[colors.background.primary, colors.background.secondary]}
            style={[styles.premiumOffersCard, shadows.lg]}
          >
            <View style={styles.offersIconRow}>
              <View style={[styles.offerIcon, { backgroundColor: colors.primary[500] }]}>
                <Ionicons name="star" size={20} color="white" />
              </View>
              <View style={[styles.offerIcon, { backgroundColor: colors.secondary?.[500] || colors.primary[500] }]}>
                <Ionicons name="trending-up" size={20} color="white" />
              </View>
              <View style={[styles.offerIcon, { backgroundColor: colors.success?.[500] || colors.primary[500] }]}>
                <Ionicons name="shield-checkmark" size={20} color="white" />
              </View>
            </View>
            <Text style={[styles.premiumOffersTitle, { color: colors.text.primary }]}>
              Credit Building Program
            </Text>
            <Text style={[styles.premiumOffersDesc, { color: colors.text.secondary }]}>
              Build your credit score with our comprehensive program. 
              Get personalized tips and track your progress.
            </Text>
            <View style={[styles.comingSoonBadge, { backgroundColor: colors.primary[100] }]}>
              <Text style={[styles.comingSoonText, { color: colors.primary[500] }]}>
                Coming Soon
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.premiumOffersButton, { backgroundColor: colors.primary[500] }]}
              onPress={() => showComingSoon("Credit Building Program")}
            >
              <View style={styles.premiumOffersButtonContent}>
                <Text style={styles.premiumOffersButtonText}>Learn More</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </View>
            </TouchableOpacity>
          </LinearGradient>
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
  // Premium Header
  premiumHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
  },
  premiumHeaderTitle: {
    fontSize: typography.fontSizes["3xl"],
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  premiumHeaderSubtitle: {
    fontSize: typography.fontSizes.base,
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  premiumHelpButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  // Credit Score Card
  creditScoreSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  creditScoreCard: {
    borderRadius: borderRadius["4xl"],
    padding: spacing.xl,
  },
  creditScoreContent: {
    marginBottom: spacing.lg,
  },
  creditScoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  creditScoreAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  creditScoreAvatarText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    color: "white",
  },
  creditScoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  creditScoreBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: "600" as const,
    color: "white",
  },
  creditScoreTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600" as const,
    color: "rgba(255,255,255,0.9)",
    marginBottom: spacing.xs,
  },
  creditScoreValue: {
    fontSize: typography.fontSizes["3xl"],
    fontWeight: "800" as const,
    color: "white",
    marginBottom: spacing.sm,
  },
  creditScoreSubtext: {
    fontSize: typography.fontSizes.sm,
    color: "rgba(255,255,255,0.8)",
  },
  creditScoreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius["2xl"],
    gap: spacing.sm,
  },
  creditScoreButtonText: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    color: "white",
  },

  // Premium Options
  premiumOptionsSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
    marginBottom: spacing.lg,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  optionCard: {
    width: "47%",
    marginBottom: spacing.md,
  },
  optionCardGradient: {
    borderRadius: borderRadius["4xl"],
    padding: spacing.lg,
    alignItems: "center",
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  optionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginBottom: spacing.xs,
  },
  optionDesc: {
    fontSize: typography.fontSizes.sm,
    textAlign: "center" as const,
    marginBottom: spacing.md,
    opacity: 0.8,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  // Premium Offers
  premiumOffersSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  premiumOffersCard: {
    borderRadius: borderRadius["4xl"],
    padding: spacing.xl,
  },
  offersIconRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  offerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumOffersTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginBottom: spacing.sm,
  },
  premiumOffersDesc: {
    fontSize: typography.fontSizes.base,
    textAlign: "center" as const,
    marginBottom: spacing.lg,
    lineHeight: typography.fontSizes.base * 1.5,
    opacity: 0.9,
  },
  comingSoonBadge: {
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  comingSoonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
  },
  premiumOffersButton: {
    borderRadius: borderRadius["2xl"],
    overflow: "hidden",
  },
  premiumOffersButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  premiumOffersButtonText: {
    fontSize: typography.fontSizes.base,
    fontWeight: "700" as const,
    color: "white",
  },
});
