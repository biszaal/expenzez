import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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
import { useAlert } from "../../hooks/useAlert";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";
import {
  getProfile,
  getCreditScore,
  getGoals,
} from "../../services/dataSource";

export default function AccountScreen() {
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const { showSuccess, showError } = useAlert();

  const [profile, setProfile] = useState<any>(null);
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [goalsMet, setGoalsMet] = useState<{
    completed: number;
    total: number;
  }>({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Fetch user profile
        const profileData = await getProfile();
        setProfile(profileData);

        // Fetch real credit score
        const creditScoreData = await getCreditScore();
        setCreditScore(creditScoreData.score);

        // Fetch real goals data
        const goalsData = await getGoals();
        setGoalsMet({
          completed: goalsData.completed,
          total: goalsData.total,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        showError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchUserData();
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            showSuccess("Logged out successfully");
            router.replace("/auth/Login");
          } catch (error) {
            showError("Failed to logout");
          }
        },
      },
    ]);
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    if (user?.name) {
      return user.name;
    }
    if (user?.username) {
      return user.username;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  // Get user email
  const getUserEmail = () => {
    if (profile?.email) {
      return profile.email;
    }
    if (user?.email) {
      return user.email;
    }
    return "";
  };

  // Get user initials
  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    if (displayName === "User") return "U";

    const names = displayName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName[0]?.toUpperCase() || "U";
  };

  // Get member since date
  const getMemberSince = () => {
    // TODO: Get from user profile or auth context
    return "2024";
  };

  const getStatColors = () => {
    return {
      creditScore: {
        gradient: ["#FEF3C7", "#FDE68A"],
        text: "#92400E",
        icon: "#F59E0B",
      },
      goals: {
        gradient: ["#DBEAFE", "#BFDBFE"],
        text: "#1E40AF",
        icon: "#3B82F6",
      },
    };
  };

  const profileOptions = [
    {
      title: "Personal Information",
      subtitle: "Update your details",
      icon: (
        <Ionicons name="person-outline" size={24} color={colors.primary[500]} />
      ),
      route: "/profile/personal",
    },
    {
      title: "Security",
      subtitle: "Password, 2FA, and more",
      icon: (
        <Ionicons name="shield-outline" size={24} color={colors.primary[500]} />
      ),
      route: "/security",
    },
    {
      title: "Notifications",
      subtitle: "Manage your alerts",
      icon: (
        <Ionicons
          name="notifications-outline"
          size={24}
          color={colors.primary[500]}
        />
      ),
      route: "/notifications",
    },
  ];

  const statColors = getStatColors();

  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
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
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Account
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.text.secondary }]}
          >
            Manage your account.
          </Text>
          <TouchableOpacity
            style={[
              styles.settingsButton,
              { backgroundColor: colors.background.primary },
              shadows.sm,
            ]}
            onPress={() => router.push("/settings")}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={colors.primary[500]}
            />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileSection}>
          <LinearGradient
            colors={[colors.primary[500], "#8B5CF6"]}
            style={[styles.profileCard, shadows.lg]}
          >
            <View style={styles.profileContent}>
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.2)",
                  "rgba(255, 255, 255, 0.1)",
                ]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{getUserInitials()}</Text>
              </LinearGradient>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>{getUserDisplayName()}</Text>
                <Text style={styles.profileEmail}>{getUserEmail()}</Text>
                <View style={styles.profileBadges}>
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                  <Text style={styles.memberText}>
                    Member since {getMemberSince()}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push("/profile/personal")}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color="white"
                style={styles.editButtonIcon}
              />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={statColors.creditScore.gradient as [string, string]}
              style={[styles.statGradient, shadows.md]}
            >
              <View style={styles.statIconContainer}>
                <Feather
                  name="trending-up"
                  size={20}
                  color={statColors.creditScore.icon}
                />
              </View>
              <Text
                style={[
                  styles.statLabel,
                  { color: statColors.creditScore.text },
                ]}
              >
                Credit Score
              </Text>
              <Text
                style={[
                  styles.statValue,
                  { color: statColors.creditScore.text },
                ]}
              >
                {creditScore !== null ? creditScore : "N/A"}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={statColors.goals.gradient as [string, string]}
              style={[styles.statGradient, shadows.md]}
            >
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons
                  name="target"
                  size={20}
                  color={statColors.goals.icon}
                />
              </View>
              <Text
                style={[styles.statLabel, { color: statColors.goals.text }]}
              >
                Goals Met
              </Text>
              <Text
                style={[styles.statValue, { color: statColors.goals.text }]}
              >
                {goalsMet.total > 0
                  ? `${goalsMet.completed}/${goalsMet.total}`
                  : "N/A"}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Account Settings
          </Text>
          <View
            style={[
              styles.menuCard,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              },
              shadows.lg,
            ]}
          >
            {profileOptions.map((option, index) => (
              <TouchableOpacity
                key={option.title}
                style={[
                  styles.menuItem,
                  index !== profileOptions.length - 1 && {
                    borderBottomColor: colors.border.light,
                    borderBottomWidth: 1,
                  },
                ]}
                onPress={() => router.push(option.route as any)}
              >
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: colors.primary[100] },
                  ]}
                >
                  {option.icon}
                </View>
                <View style={styles.menuContent}>
                  <Text
                    style={[styles.menuTitle, { color: colors.text.primary }]}
                  >
                    {option.title}
                  </Text>
                  <Text
                    style={[
                      styles.menuSubtitle,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {option.subtitle}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.primary[500]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            onPress={handleLogout}
            style={[
              styles.logoutButton,
              {
                backgroundColor: isDark ? "#7F1D1D" : "#FEF2F2",
                borderColor: isDark ? "#991B1B" : "#FECACA",
              },
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={isDark ? "#FCA5A5" : "#DC2626"}
            />
            <Text
              style={[
                styles.logoutText,
                { color: isDark ? "#FCA5A5" : "#DC2626" },
              ]}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <LinearGradient
            colors={[colors.primary[500], "#8B5CF6"]}
            style={styles.appLogo}
          >
            <Text style={styles.appLogoText}>expenzez</Text>
          </LinearGradient>
          <Text style={[styles.appVersion, { color: colors.text.secondary }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.appCopyright, { color: colors.text.tertiary }]}>
            © 2024 expenzez. All rights reserved.
          </Text>
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
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
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
  },
  profileCard: {
    borderRadius: borderRadius["3xl"],
    overflow: "hidden",
    padding: spacing.lg,
  },
  profileGradient: {
    borderRadius: borderRadius["3xl"],
    padding: spacing.lg,
  },
  profileInfo: {
    marginBottom: spacing.md,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700" as const,
    color: "white",
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
    color: "white",
  },
  profileEmail: {
    fontSize: typography.fontSizes.base,
    color: "rgba(255, 255, 255, 0.9)",
  },
  profileBadges: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  premiumBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  premiumText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: "600" as const,
    color: "white",
  },
  memberText: {
    fontSize: typography.fontSizes.sm,
    color: "rgba(255, 255, 255, 0.8)",
  },
  editButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    color: "white",
    fontWeight: "600" as const,
    fontSize: typography.fontSizes.base,
  },
  editButtonIcon: {
    marginLeft: spacing.sm,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  statGradient: {
    borderRadius: borderRadius["3xl"],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  statIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  statValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
  },
  menuSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    marginBottom: spacing.md,
  },
  menuCard: {
    borderRadius: borderRadius["3xl"],
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuIconContainer: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginRight: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
  },
  menuSubtitle: {
    fontSize: typography.fontSizes.sm,
  },
  logoutSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  logoutButton: {
    borderRadius: borderRadius["3xl"],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  logoutText: {
    fontWeight: "600" as const,
    fontSize: typography.fontSizes.base,
    marginLeft: spacing.md,
  },
  appInfo: {
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing["2xl"],
  },
  appLogo: {
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  appLogoText: {
    color: "white",
    fontWeight: "700" as const,
    fontSize: typography.fontSizes.lg,
  },
  appVersion: {
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.sm,
  },
  appCopyright: {
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  loadingText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600" as const,
  },
  profileSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
});
