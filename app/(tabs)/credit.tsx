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
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { getProfile } from "../../services/dataSource";

const SCREEN_WIDTH = Dimensions.get("window").width;

const creditOptions = [
  {
    icon: (
      <MaterialCommunityIcons name="bank-outline" size={28} color="#3B82F6" />
    ),
    name: "Loans",
    desc: "Flexible options for big dreams",
    bg: "#EBDFFC",
  },
  {
    icon: <MaterialCommunityIcons name="car" size={28} color="#3B82F6" />,
    name: "Auto finance",
    desc: "Drive now, pay later",
    bg: "#F3EDFC",
  },
  {
    icon: <MaterialCommunityIcons name="home-roof" size={28} color="#3B82F6" />,
    name: "Renovation credit",
    desc: "Upgrade your place",
    bg: "#EFF1F8",
  },
  {
    icon: (
      <MaterialCommunityIcons
        name="swap-horizontal"
        size={28}
        color="#3B82F6"
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
        color="#3B82F6"
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
        color="#3B82F6"
      />
    ),
    name: "Mortgages",
    desc: "Unlock your new home",
    bg: "#F5F3FF",
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
    // Disabled: Do not redirect to /banks/connect when hasBank is false
    // if (hasBank === false && !checkingBank) {
    //   router.replace("/banks/connect");
    // }
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
                <Text style={styles.headerAvatarText}>{getUserInitials()}</Text>
              </LinearGradient>
              <View>
                <Text
                  style={[styles.headerTitle, { color: colors.text.primary }]}
                >
                  Credit & Offers
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  Build your financial future
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.headerButton,
                { backgroundColor: colors.background.primary },
              ]}
            >
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
              style={[
                styles.verticalCard,
                { backgroundColor: colors.background.primary },
              ]}
            >
              <LinearGradient
                colors={["#FFFFFF", "#F8FAFC"]}
                style={styles.verticalCardIconBg}
              >
                {opt.icon}
              </LinearGradient>
              <View style={styles.verticalCardContent}>
                <Text
                  style={[
                    styles.verticalCardTitle,
                    { color: colors.text.primary },
                  ]}
                >
                  {opt.name}
                </Text>
                <Text
                  style={[
                    styles.verticalCardDesc,
                    { color: colors.text.secondary },
                  ]}
                >
                  {opt.desc}
                </Text>
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
          <Text style={[styles.offersTitle, { color: colors.text.primary }]}>
            Exclusive Offers & Credit Boost
          </Text>
          <LinearGradient
            colors={["#FFFFFF", "#F8FAFC"]}
            style={[styles.offersCard, { borderColor: colors.border.light }]}
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
            <Text
              style={[styles.offersCardTitle, { color: colors.text.primary }]}
            >
              Boost your credit with Rent Shield
            </Text>
            <Text
              style={[styles.offersCardDesc, { color: colors.text.secondary }]}
            >
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
    borderColor: "#E5E7EB",
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
    marginBottom: spacing.xs,
  },
  verticalCardDesc: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "500" as const,
  },
  offersWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  offersTitle: {
    fontWeight: "700" as const,
    fontSize: typography.fontSizes.lg,
    marginBottom: spacing.md,
  },
  offersCard: {
    borderRadius: borderRadius["3xl"],
    padding: spacing.xl,
    ...shadows.lg,
    borderWidth: 1,
  },
  offersStarsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  offersCardTitle: {
    fontWeight: "700" as const,
    fontSize: typography.fontSizes.lg,
    textAlign: "center" as const,
    marginBottom: spacing.sm,
  },
  offersCardDesc: {
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
