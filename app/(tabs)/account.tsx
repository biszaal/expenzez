import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useAlert } from "../../hooks/useAlert";
import { useRevenueCat } from "../../contexts/RevenueCatContext";
import { ProfileSkeleton } from "../../components/ui/SkeletonLoader";
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
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} from "../../services/dataSource";
import SavingsGoals, { SavingsGoal } from "../../components/SavingsGoals";
import SupportSystem from "../../components/SupportSystem";
import ExportSystem from "../../components/ExportSystem";

export default function AccountScreen() {
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const { showError } = useAlert();
  const { isPro, isInTrialPeriod, subscriptionExpiryDate } = useRevenueCat();

  const [profile, setProfile] = useState<any>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [showSavingsGoals, setShowSavingsGoals] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingsGoalsLoading, setSavingsGoalsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Clear data when user logs out
  useEffect(() => {
    if (!isLoggedIn || !user) {
      console.log("🔄 [Account] User logged out, clearing all data");
      setProfile(null);
      setSavingsGoals([]);
      setLoading(false);
      setCurrentUserId(null);
    }
  }, [isLoggedIn, user]);

  // Fetch data when logged in - triggers on user change
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userId = user?.sub || user?.id || user?.email || user?.username;
        console.log("📥 [Account] Fetching profile data for user:", userId);

        // Clear AsyncStorage cache before fetching
        try {
          const AsyncStorage = (
            await import("@react-native-async-storage/async-storage")
          ).default;
          const keys = await AsyncStorage.getAllKeys();
          const cacheKeys = keys.filter(
            (key) =>
              key.includes("profile") ||
              key.includes("@expenzez_cache_/api/profile") ||
              key.includes("user_data")
          );
          if (cacheKeys.length > 0) {
            await AsyncStorage.multiRemove(cacheKeys);
            console.log("🧹 [Account] Cleared cache keys:", cacheKeys.length);
          }
        } catch (cacheError) {
          console.warn("⚠️ [Account] Cache clear warning:", cacheError);
        }

        // Fetch profile data
        const profileData = await getProfile().catch((err) => {
          console.error("❌ Error fetching profile:", err);
          return null;
        });

        // Set profile data
        if (profileData) {
          console.log("✅ [Account] Loaded profile:", profileData.email);
          setProfile(profileData);
        } else {
          console.log("⚠️ [Account] No profile data returned");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        showError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn && user) {
      // Clear old data immediately
      setProfile(null);
      setSavingsGoals([]);

      // Fetch new data
      console.log("🔄 [Account] User detected, fetching data for:", user.email);
      fetchUserData();
    }
  }, [isLoggedIn, user?.id, user?.email, user?.username, showError]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
      router.replace("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLogoutError("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    console.log(
      "📝 [Account] getUserDisplayName - profile:",
      profile,
      "user:",
      user
    );
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
    console.log(
      "📧 [Account] getUserEmail - profile:",
      profile?.email,
      "user:",
      user?.email
    );
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
    if (profile?.createdAt) {
      return new Date(profile.createdAt).getFullYear().toString();
    }
    if (user && "createdAt" in user && user.createdAt) {
      return new Date(user.createdAt).getFullYear().toString();
    }
    // If no creation date available, show current year as fallback
    return new Date().getFullYear().toString();
  };

  // Handle support and export
  const openSupport = () => {
    setShowSupport(true);
  };

  const openExport = () => {
    setShowExport(true);
  };

  // Fetch savings goals
  const fetchSavingsGoals = async () => {
    try {
      setSavingsGoalsLoading(true);
      const goals = await getSavingsGoals();
      setSavingsGoals(goals);
    } catch (error) {
      console.error("Error fetching savings goals:", error);
      showError("Failed to load savings goals");
    } finally {
      setSavingsGoalsLoading(false);
    }
  };

  // Handle savings goals actions
  const handleCreateGoal = async (
    goalData: Omit<SavingsGoal, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      await createSavingsGoal(goalData);
      await fetchSavingsGoals(); // Refresh the list
    } catch (error) {
      throw error; // Let the component handle the error
    }
  };

  const handleUpdateGoal = async (
    goalId: string,
    updates: Partial<SavingsGoal>
  ) => {
    try {
      await updateSavingsGoal(goalId, updates);
      await fetchSavingsGoals(); // Refresh the list
    } catch (error) {
      throw error; // Let the component handle the error
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteSavingsGoal(goalId);
      await fetchSavingsGoals(); // Refresh the list
    } catch (error) {
      throw error; // Let the component handle the error
    }
  };

  // Open savings goals modal
  const openSavingsGoals = () => {
    if (savingsGoals.length === 0 && !savingsGoalsLoading) {
      fetchSavingsGoals();
    }
    setShowSavingsGoals(true);
  };

  const profileOptions = [
    {
      title: "Personal Information",
      subtitle: "Update your details",
      icon: (
        <Ionicons
          name="person-outline"
          size={24}
          color={colors?.primary?.main || "#3B82F6"}
        />
      ),
      route: "/profile/personal",
    },
    {
      title: "Security",
      subtitle: "Password, 2FA, and more",
      icon: (
        <Ionicons
          name="shield-outline"
          size={24}
          color={colors?.primary?.main || "#3B82F6"}
        />
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
          color={colors?.primary?.main || "#3B82F6"}
        />
      ),
      route: "/notifications/preferences",
    },
  ];

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
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      key={user?.sub || user?.id || user?.email || user?.username || "default"}
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
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text
                style={[styles.headerTitle, { color: colors.text.primary }]}
              >
                Profile
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: colors.text.secondary },
                ]}
              >
                Manage your account
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.headerButton,
                { backgroundColor: colors.background.primary, ...shadows.sm },
              ]}
              onPress={() => router.push("/settings")}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={colors.primary.main}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View
            style={[
              styles.profileCard,
              { backgroundColor: colors.background.primary, ...shadows.lg },
            ]}
          >
            <View style={styles.profileContent}>
              <View style={styles.avatarContainer}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.primary.main },
                  ]}
                >
                  <Text style={styles.avatarText}>{getUserInitials()}</Text>
                </View>
              </View>
              <View style={styles.profileDetails}>
                <Text
                  style={[styles.profileName, { color: colors.text.primary }]}
                >
                  {getUserDisplayName()}
                </Text>
                <Text
                  style={[
                    styles.profileEmail,
                    { color: colors.text.secondary },
                  ]}
                >
                  {getUserEmail()}
                </Text>
                <View style={styles.profileBadges}>
                  {isPro && (
                    <View
                      style={[
                        styles.premiumBadge,
                        {
                          backgroundColor: isDark ? "#92400E" : "#FEF3C7",
                          borderColor: isDark ? "#D97706" : "#F59E0B",
                        },
                      ]}
                    >
                      <Ionicons
                        name="sparkles"
                        size={12}
                        color={isDark ? "#FCD34D" : "#92400E"}
                      />
                      <Text
                        style={[
                          styles.premiumBadgeText,
                          {
                            color: isDark ? "#FCD34D" : "#92400E",
                          },
                        ]}
                      >
                        {isInTrialPeriod ? "Premium Trial" : "Premium Member"}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.memberText,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Member since {getMemberSince()}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.editButton,
                { backgroundColor: colors.primary.main + "20" },
              ]}
              onPress={() => router.push("/profile/personal")}
            >
              <Ionicons name="pencil" size={16} color={colors.primary.main} />
              <Text
                style={[styles.editButtonText, { color: colors.primary.main }]}
              >
                Edit
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Savings Goals Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[
              styles.statCard,
              { backgroundColor: colors.background.primary },
            ]}
            onPress={openSavingsGoals}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary.main + "20", colors.primary.main + "10"]}
              style={[styles.statGradient, shadows.md]}
            >
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: colors.primary.main || "#3B82F6" },
                ]}
              >
                <Ionicons name="trophy" size={20} color="white" />
              </View>
              <Text
                style={[styles.statLabel, { color: colors.text.secondary }]}
              >
                Savings Goals
              </Text>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {savingsGoals.length}
              </Text>
              <Text
                style={[styles.statChange, { color: colors.text.secondary }]}
              >
                {savingsGoals.filter((g) => g.isCompleted).length} completed
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Quick Actions
          </Text>

          {/* Quick Action Cards */}
          <View style={styles.quickActionGrid}>
            <TouchableOpacity
              style={[
                styles.quickActionCard,
                { backgroundColor: colors.background.primary },
              ]}
              onPress={() => router.push("/transactions")}
            >
              <LinearGradient
                colors={[
                  colors.primary.main + "20",
                  colors.primary.main + "10",
                ]}
                style={[styles.quickActionGradient, shadows.sm]}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: colors.primary.main },
                  ]}
                >
                  <Ionicons name="receipt-outline" size={20} color="white" />
                </View>
                <Text
                  style={[
                    styles.quickActionTitle,
                    { color: colors.text.primary },
                  ]}
                >
                  Transactions
                </Text>
                <Text
                  style={[
                    styles.quickActionSubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  Manage & categorize
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                { backgroundColor: colors.background.primary },
              ]}
              onPress={openExport}
            >
              <LinearGradient
                colors={[
                  colors.success.main + "20",
                  colors.success.main + "10",
                ]}
                style={[styles.quickActionGradient, shadows.sm]}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    {
                      backgroundColor: colors.success.main,
                    },
                  ]}
                >
                  <Ionicons name="download-outline" size={20} color="white" />
                </View>
                <Text
                  style={[
                    styles.quickActionTitle,
                    { color: colors.text.primary },
                  ]}
                >
                  Export
                </Text>
                <Text
                  style={[
                    styles.quickActionSubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  Download your data
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                { backgroundColor: colors.background.primary },
              ]}
              onPress={openSupport}
            >
              <LinearGradient
                colors={[
                  colors.warning.main + "20",
                  colors.warning.main + "10",
                ]}
                style={[styles.quickActionGradient, shadows.sm]}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    {
                      backgroundColor: colors.warning.main,
                    },
                  ]}
                >
                  <Ionicons
                    name="help-circle-outline"
                    size={20}
                    color="white"
                  />
                </View>
                <Text
                  style={[
                    styles.quickActionTitle,
                    { color: colors.text.primary },
                  ]}
                >
                  Support
                </Text>
                <Text
                  style={[
                    styles.quickActionSubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  Get help & FAQ
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                { backgroundColor: colors.background.primary },
              ]}
              onPress={() => router.push("/settings")}
            >
              <LinearGradient
                colors={[
                  colors.secondary.main + "20",
                  colors.secondary.main + "10",
                ]}
                style={[styles.quickActionGradient, shadows.sm]}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    {
                      backgroundColor: colors.secondary.main,
                    },
                  ]}
                >
                  <Ionicons name="settings-outline" size={20} color="white" />
                </View>
                <Text
                  style={[
                    styles.quickActionTitle,
                    { color: colors.text.primary },
                  ]}
                >
                  Settings
                </Text>
                <Text
                  style={[
                    styles.quickActionSubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  Preferences & more
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Settings Menu */}
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text.primary, marginTop: spacing.xl },
            ]}
          >
            Account Settings
          </Text>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: colors.background.primary, ...shadows.lg },
            ]}
          >
            {profileOptions?.map((option, index) => (
              <TouchableOpacity
                key={option.title}
                style={[
                  styles.menuItem,
                  index !== profileOptions.length - 1 && {
                    borderBottomColor: colors.border.light,
                    borderBottomWidth: 0.5,
                  },
                  (option as any).isSpecial && {
                    backgroundColor: (option as any).title.includes("Get")
                      ? "rgba(245, 158, 11, 0.1)"
                      : "rgba(16, 185, 129, 0.1)",
                  },
                ]}
                onPress={() => {
                  router.push(option.route as any);
                }}
              >
                <View
                  style={[
                    styles.menuIconContainer,
                    (option as any).isSpecial
                      ? {
                          backgroundColor: (option as any).title.includes("Get")
                            ? "rgba(245, 158, 11, 0.2)"
                            : "rgba(16, 185, 129, 0.2)",
                        }
                      : { backgroundColor: colors.primary.main + "20" },
                  ]}
                >
                  {option.icon}
                </View>
                <View style={styles.menuContent}>
                  <Text
                    style={[
                      styles.menuTitle,
                      { color: colors.text.primary },
                      (option as any).isSpecial && { fontWeight: "600" },
                    ]}
                  >
                    {option.title}
                    {(option as any).isSpecial && (
                      <Text style={{ color: "#F59E0B", marginLeft: 8 }}>
                        ✨
                      </Text>
                    )}
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
                  size={16}
                  color={colors.primary.main}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Error Display */}
        {logoutError && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error.main }]}>
              {logoutError}
            </Text>
          </View>
        )}

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            onPress={handleLogout}
            style={[
              styles.logoutButton,
              {
                backgroundColor: isDark ? "#7F1D1D" : "#FEF2F2",
                borderColor: isDark ? "#991B1B" : "#FECACA",
                opacity: isLoggingOut ? 0.7 : 1,
                ...shadows.sm,
              },
            ]}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator
                size="small"
                color={isDark ? "#FCA5A5" : "#DC2626"}
              />
            ) : (
              <Ionicons
                name="log-out-outline"
                size={20}
                color={isDark ? "#FCA5A5" : "#DC2626"}
              />
            )}
            <Text
              style={[
                styles.logoutText,
                { color: isDark ? "#FCA5A5" : "#DC2626" },
              ]}
            >
              {isLoggingOut ? "Signing Out..." : "Sign Out"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appCopyright, { color: colors.text.tertiary }]}>
            Expenzez v1.0.0 - © {new Date().getFullYear()}
          </Text>
        </View>
      </ScrollView>

      {/* Savings Goals Modal */}
      <Modal
        visible={showSavingsGoals}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowSavingsGoals(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background.secondary },
          ]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSavingsGoals(false)}>
              <Text
                style={[styles.modalClose, { color: colors.text.secondary }]}
              >
                Close
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Savings Goals
            </Text>
            <View style={{ width: 50 }} />
          </View>
          <SavingsGoals
            goals={savingsGoals}
            onGoalCreate={handleCreateGoal}
            onGoalUpdate={handleUpdateGoal}
            onGoalDelete={handleDeleteGoal}
            loading={savingsGoalsLoading}
          />
        </View>
      </Modal>

      {/* Support System Modal */}
      <SupportSystem
        isVisible={showSupport}
        onClose={() => setShowSupport(false)}
      />

      {/* Export System Modal */}
      <ExportSystem
        isVisible={showExport}
        onClose={() => setShowExport(false)}
      />
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
  // Simple Header Styles
  simpleHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  simpleTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  // Simple Profile Styles
  simpleProfileSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  simpleProfileCard: {
    borderRadius: 20,
    padding: spacing.lg,
  },
  simpleProfileContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  simpleAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  simpleAvatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  simpleProfileDetails: {
    flex: 1,
  },
  simpleProfileName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  simpleProfileEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  simpleMemberText: {
    fontSize: 12,
  },
  simpleEditButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  simpleEditText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Simple Stats Styles
  simpleStatsContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  simpleStatCard: {
    flex: 1,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: "center",
  },
  simpleStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  simpleStatLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: "center",
  },
  simpleStatValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  // Simple Menu Styles
  simpleMenuSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  simpleSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  simpleActionList: {
    gap: 8,
    marginBottom: spacing.lg,
  },
  simpleActionItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: spacing.md,
  },
  simpleActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  simpleActionContent: {
    flex: 1,
  },
  simpleActionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  simpleActionSubtitle: {
    fontSize: 12,
  },
  simpleMenuCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  simpleMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  simpleMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  simpleMenuContent: {
    flex: 1,
  },
  simpleMenuTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  simpleMenuSubtitle: {
    fontSize: 12,
  },
  // Simple Logout Styles
  simpleLogoutSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  simpleLogoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: spacing.md,
    gap: 8,
  },
  simpleLogoutText: {
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileCard: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  profileGradient: {
    borderRadius: borderRadius["4xl"],
    padding: spacing.lg,
  },
  profileInfo: {
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: "relative" as const,
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "white",
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "white",
  },
  profileEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  profileBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  premiumBadgeOld: {
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
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: "white",
    fontWeight: "500" as const,
    fontSize: 14,
  },
  editButtonIcon: {
    marginLeft: spacing.sm,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  statGradient: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  statIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    textAlign: "center" as const,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statChange: {
    fontSize: 12,
    fontWeight: "400" as const,
    opacity: 0.7,
  },
  menuSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 16,
  },
  menuCard: {
    borderRadius: 20,
    marginHorizontal: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuIconContainer: {
    borderRadius: 10,
    padding: 10,
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  logoutSection: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  logoutButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  logoutText: {
    fontWeight: "500" as const,
    fontSize: 15,
    marginLeft: 8,
  },
  appInfo: {
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
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
    fontSize: 11,
    marginTop: 4,
    opacity: 0.6,
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
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  // Premium Styles
  premiumHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
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
  premiumSettingsButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  premiumProfileSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  premiumProfileCard: {
    borderRadius: borderRadius["4xl"],
    padding: spacing.xl,
  },
  premiumProfileContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  premiumAvatarContainer: {
    alignItems: "center",
    marginRight: spacing.lg,
  },
  premiumAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  premiumAvatarText: {
    fontSize: typography.fontSizes["3xl"],
    fontWeight: "800" as const,
    color: "white",
  },
  premiumProfileDetails: {
    flex: 1,
  },
  premiumProfileName: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700" as const,
    color: "white",
    marginBottom: spacing.xs,
  },
  premiumProfileEmail: {
    fontSize: typography.fontSizes.base,
    color: "rgba(255,255,255,0.8)",
    marginBottom: spacing.sm,
  },
  premiumMemberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  premiumMemberText: {
    fontSize: typography.fontSizes.sm,
    color: "rgba(255,255,255,0.8)",
  },
  premiumEditButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius["2xl"],
    gap: spacing.sm,
  },
  premiumEditText: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    color: "white",
  },
  premiumStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  premiumStatCard: {
    flex: 1,
  },
  premiumStatGradient: {
    borderRadius: borderRadius["4xl"],
    padding: spacing.lg,
    alignItems: "center",
  },
  premiumStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  premiumStatLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
    marginBottom: spacing.xs,
  },
  premiumStatValue: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "800" as const,
    marginBottom: spacing.xs,
  },
  premiumStatChange: {
    fontSize: typography.fontSizes.xs,
    fontWeight: "500" as const,
  },
  premiumMenuSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  premiumSectionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
    marginBottom: spacing.lg,
  },
  quickActionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  quickActionCard: {
    width: "47%",
    minHeight: 100,
    borderRadius: 20,
    marginHorizontal: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  quickActionGradient: {
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 4,
    textAlign: "center",
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontWeight: "400" as const,
    opacity: 0.8,
    textAlign: "center",
  },
  premiumMenuCard: {
    borderRadius: borderRadius["4xl"],
    overflow: "hidden",
  },
  premiumMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  premiumMenuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius["2xl"],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  premiumMenuContent: {
    flex: 1,
  },
  premiumMenuTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    marginBottom: spacing.xs,
  },
  premiumMenuSubtitle: {
    fontSize: typography.fontSizes.sm,
    opacity: 0.7,
  },
  premiumMenuArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumLogoutSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  premiumLogoutButton: {
    borderRadius: borderRadius["4xl"],
    overflow: "hidden",
  },
  premiumLogoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  premiumLogoutText: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
  },
  premiumAppInfo: {
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  appInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  premiumAppLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumAppLogoText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "800" as const,
    color: "white",
  },
  appInfoDetails: {
    alignItems: "flex-start",
  },
  premiumAppName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
  },
  premiumAppVersion: {
    fontSize: typography.fontSizes.sm,
    opacity: 0.7,
  },
  premiumAppCopyright: {
    fontSize: typography.fontSizes.xs,
    textAlign: "center" as const,
    marginBottom: spacing.md,
  },
  socialLinks: {
    flexDirection: "row",
    gap: spacing.md,
  },
  socialButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalClose: {
    fontSize: typography.fontSizes.base,
    fontWeight: "500",
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600",
  },
  // Error container styles
  errorContainer: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.3)",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
