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
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useAlert } from "../../hooks/useAlert";
import { TabLoadingScreen } from "../../components/ui";
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
  const { showSuccess, showError } = useAlert();

  const [profile, setProfile] = useState<any>(null);
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [goalsMet, setGoalsMet] = useState<{
    completed: number;
    total: number;
  }>({ completed: 0, total: 0 });
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [showSavingsGoals, setShowSavingsGoals] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingsGoalsLoading, setSavingsGoalsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // 🚀 PERFORMANCE: Fetch all user data in parallel
        const [profileData, creditScoreData, goalsData] = await Promise.all([
          getProfile().catch((err) => {
            console.error("❌ Error fetching profile:", err);
            return null;
          }),
          getCreditScore().catch((err) => {
            console.error("❌ Error fetching credit score:", err);
            return { score: null };
          }),
          getGoals().catch((err) => {
            console.error("❌ Error fetching goals:", err);
            return { completed: 0, total: 0 };
          }),
        ]);

        // Set profile data
        if (profileData) {
          setProfile(profileData);
        }

        // Set credit score
        setCreditScore(creditScoreData.score);

        // Set goals data
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    
    try {
      await logout();
      router.replace("/auth/Login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLogoutError("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
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
    if (profile?.createdAt) {
      return new Date(profile.createdAt).getFullYear().toString();
    }
    if (user && 'createdAt' in user && user.createdAt) {
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

  // Handle coming soon features (for other features)
  const showComingSoon = (featureName: string) => {
    Alert.alert(
      "Coming Soon",
      `${featureName} feature is currently under development and will be available in a future update.`,
      [{ text: "OK", style: "default" }]
    );
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
        <Ionicons
          name="person-outline"
          size={24}
          color={colors?.primary?.[500] || "#3B82F6"}
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
          color={colors?.primary?.[500] || "#3B82F6"}
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
          color={colors?.primary?.[500] || "#3B82F6"}
        />
      ),
      route: "/notifications/preferences",
    },
  ];

  const statColors = getStatColors();

  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return <TabLoadingScreen message="Loading account details..." />;
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
        {/* Premium Header */}
        <View style={styles.premiumHeader}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text
                style={[
                  styles.premiumHeaderTitle,
                  { color: colors.text.primary },
                ]}
              >
                Profile
              </Text>
              <Text
                style={[
                  styles.premiumHeaderSubtitle,
                  { color: colors.text.secondary },
                ]}
              >
                Manage your account
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.premiumSettingsButton,
                { backgroundColor: colors.background.primary, ...shadows.sm },
              ]}
              onPress={() => router.push("/settings")}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Premium Profile Card */}
        <View style={styles.premiumProfileSection}>
          <LinearGradient
            colors={[colors.primary[500], "#8B5CF6"]}
            style={[styles.premiumProfileCard, shadows.lg]}
          >
            <View style={styles.premiumProfileContent}>
              <View style={styles.premiumAvatarContainer}>
                <View style={styles.premiumAvatar}>
                  <Text style={styles.premiumAvatarText}>
                    {getUserInitials()}
                  </Text>
                </View>
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={12} color="white" />
                  <Text style={styles.premiumBadgeText}>Premium</Text>
                </View>
              </View>
              <View style={styles.premiumProfileDetails}>
                <Text style={styles.premiumProfileName}>
                  {getUserDisplayName()}
                </Text>
                <Text style={styles.premiumProfileEmail}>{getUserEmail()}</Text>
                <View style={styles.premiumMemberInfo}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color="rgba(255,255,255,0.8)"
                  />
                  <Text style={styles.premiumMemberText}>
                    Member since {getMemberSince()}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.premiumEditButton}
              onPress={() => router.push("/profile/personal")}
            >
              <Ionicons name="pencil" size={16} color="white" />
              <Text style={styles.premiumEditText}>Edit Profile</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Premium Stats */}
        <View style={styles.premiumStatsContainer}>
          <TouchableOpacity
            style={styles.premiumStatCard}
            onPress={() => showComingSoon("Credit Score")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary[100], colors.primary[50]]}
              style={[styles.premiumStatGradient, shadows.md]}
            >
              <View
                style={[
                  styles.premiumStatIcon,
                  { backgroundColor: colors.primary[500] },
                ]}
              >
                <Ionicons name="trending-up" size={24} color="white" />
              </View>
              <Text
                style={[
                  styles.premiumStatLabel,
                  { color: colors.text.secondary },
                ]}
              >
                Credit Score
              </Text>
              <Text
                style={[
                  styles.premiumStatValue,
                  { color: colors.text.tertiary },
                ]}
              >
                Coming
              </Text>
              <Text
                style={[
                  styles.premiumStatChange,
                  { color: colors.text.tertiary },
                ]}
              >
                Soon
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.premiumStatCard}
            onPress={openSavingsGoals}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[
                colors.secondary?.[100] || "#DBEAFE",
                colors.secondary?.[50] || "#BFDBFE",
              ]}
              style={[styles.premiumStatGradient, shadows.md]}
            >
              <View
                style={[
                  styles.premiumStatIcon,
                  { backgroundColor: colors.secondary?.[500] || "#3B82F6" },
                ]}
              >
                <Ionicons name="trophy" size={24} color="white" />
              </View>
              <Text
                style={[
                  styles.premiumStatLabel,
                  { color: colors.text.secondary },
                ]}
              >
                Savings Goals
              </Text>
              <Text
                style={[
                  styles.premiumStatValue,
                  { color: colors.text.primary },
                ]}
              >
                {savingsGoals.length}
              </Text>
              <Text
                style={[
                  styles.premiumStatChange,
                  { color: colors.text.secondary },
                ]}
              >
                {savingsGoals.filter((g) => g.isCompleted).length} completed
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Premium Menu Options */}
        <View style={styles.premiumMenuSection}>
          <Text
            style={[styles.premiumSectionTitle, { color: colors.text.primary }]}
          >
            Quick Actions
          </Text>

          {/* Quick Action Cards */}
          <View style={styles.quickActionGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push("/transactions")}
            >
              <LinearGradient
                colors={[colors.primary[100], colors.primary[50]]}
                style={[styles.quickActionGradient, shadows.sm]}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: colors.primary[500] },
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
              style={styles.quickActionCard}
              onPress={openExport}
            >
              <LinearGradient
                colors={[
                  colors.success?.[100] || colors.primary[100],
                  colors.success?.[50] || colors.primary[50],
                ]}
                style={[styles.quickActionGradient, shadows.sm]}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    {
                      backgroundColor:
                        colors.success?.[500] || colors.primary[500],
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
              style={styles.quickActionCard}
              onPress={openSupport}
            >
              <LinearGradient
                colors={[
                  colors.warning?.[100] || colors.primary[100],
                  colors.warning?.[50] || colors.primary[50],
                ]}
                style={[styles.quickActionGradient, shadows.sm]}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    {
                      backgroundColor:
                        colors.warning?.[500] || colors.primary[500],
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
              style={styles.quickActionCard}
              onPress={() => router.push("/settings")}
            >
              <LinearGradient
                colors={[
                  colors.secondary?.[100] || colors.primary[100],
                  colors.secondary?.[50] || colors.primary[50],
                ]}
                style={[styles.quickActionGradient, shadows.sm]}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    {
                      backgroundColor:
                        colors.secondary?.[500] || colors.primary[500],
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
                  Available
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Settings Menu */}
          <Text
            style={[
              styles.premiumSectionTitle,
              { color: colors.text.primary, marginTop: spacing.xl },
            ]}
          >
            Account Settings
          </Text>
          <View
            style={[
              styles.premiumMenuCard,
              { backgroundColor: colors.background.primary, ...shadows.lg },
            ]}
          >
            {profileOptions?.map((option, index) => (
              <TouchableOpacity
                key={option.title}
                style={[
                  styles.premiumMenuItem,
                  index !== profileOptions.length - 1 && {
                    borderBottomColor: colors.border.light,
                    borderBottomWidth: 0.5,
                  },
                ]}
                onPress={() => {
                  const implementedRoutes = [
                    "/settings",
                    "/profile/personal",
                    "/security",
                    "/notifications",
                    "/notifications/preferences",
                  ];
                  if (implementedRoutes.includes(option.route)) {
                    router.push(option.route as any);
                  } else {
                    showComingSoon(option.title);
                  }
                }}
              >
                <View
                  style={[
                    styles.premiumMenuIconContainer,
                    { backgroundColor: colors.primary[100] },
                  ]}
                >
                  {option.icon}
                </View>
                <View style={styles.premiumMenuContent}>
                  <Text
                    style={[
                      styles.premiumMenuTitle,
                      { color: colors.text.primary },
                    ]}
                  >
                    {option.title}
                  </Text>
                  <Text
                    style={[
                      styles.premiumMenuSubtitle,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {option.subtitle}
                  </Text>
                </View>
                <View
                  style={[
                    styles.premiumMenuArrow,
                    { backgroundColor: colors.primary[100] },
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.primary[500]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>


        {/* Logout Error Display */}
        {logoutError && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error[500] }]}>
              {logoutError}
            </Text>
          </View>
        )}

        {/* Premium Logout Button */}
        <View style={styles.premiumLogoutSection}>
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.premiumLogoutButton, { opacity: isLoggingOut ? 0.7 : 1 }]}
            disabled={isLoggingOut}
          >
            <LinearGradient
              colors={isDark ? ["#7F1D1D", "#991B1B"] : ["#FEF2F2", "#FECACA"]}
              style={[styles.premiumLogoutGradient, shadows.sm]}
            >
              {isLoggingOut ? (
                <ActivityIndicator size="small" color={isDark ? "#FCA5A5" : "#DC2626"} />
              ) : (
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={isDark ? "#FCA5A5" : "#DC2626"}
                />
              )}
              <Text
                style={[
                  styles.premiumLogoutText,
                  { color: isDark ? "#FCA5A5" : "#DC2626" },
                ]}
              >
                {isLoggingOut ? "Signing Out..." : "Sign Out"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Premium App Info */}
        <View style={styles.premiumAppInfo}>
          <View style={styles.appInfoCard}>
            <LinearGradient
              colors={[colors.primary[500], "#8B5CF6"]}
              style={styles.premiumAppLogo}
            >
              <Text style={styles.premiumAppLogoText}>E</Text>
            </LinearGradient>
            <View style={styles.appInfoDetails}>
              <Text
                style={[styles.premiumAppName, { color: colors.text.primary }]}
              >
                Expenzez
              </Text>
              <Text
                style={[
                  styles.premiumAppVersion,
                  { color: colors.text.secondary },
                ]}
              >
                Version 1.0.0
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.premiumAppCopyright,
              { color: colors.text.tertiary },
            ]}
          >
            © {new Date().getFullYear()} Expenzez. All rights reserved.
          </Text>
          <View style={styles.socialLinks}>
            <TouchableOpacity
              style={[
                styles.socialButton,
                { backgroundColor: colors.background.primary, ...shadows.sm },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.socialButton,
                { backgroundColor: colors.background.primary, ...shadows.sm },
              ]}
            >
              <Ionicons
                name="globe-outline"
                size={16}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.socialButton,
                { backgroundColor: colors.background.primary, ...shadows.sm },
              ]}
            >
              <Ionicons
                name="logo-twitter"
                size={16}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
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
    borderRadius: borderRadius["4xl"],
    overflow: "hidden",
    padding: spacing.lg,
  },
  profileGradient: {
    borderRadius: borderRadius["4xl"],
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
    borderRadius: borderRadius["4xl"],
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
    borderRadius: borderRadius["4xl"],
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
    borderRadius: borderRadius["4xl"],
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
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  premiumBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: "600" as const,
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
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickActionCard: {
    width: "47%",
  },
  quickActionGradient: {
    borderRadius: borderRadius["2xl"],
    padding: spacing.lg,
    alignItems: "center",
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
    marginBottom: spacing.xs,
  },
  quickActionSubtitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: "500" as const,
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
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
