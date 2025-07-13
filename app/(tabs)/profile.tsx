import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Alert,
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

const profileOptions = [
  {
    icon: (
      <Ionicons name="person-outline" size={24} color={colors.primary[500]} />
    ),
    title: "Personal Information",
    subtitle: "Update your details",
    route: "/profile",
  },
  {
    icon: (
      <Ionicons name="shield-outline" size={24} color={colors.primary[500]} />
    ),
    title: "Security",
    subtitle: "Password, 2FA, and more",
    route: "/security",
  },
  {
    icon: (
      <Ionicons
        name="notifications-outline"
        size={24}
        color={colors.primary[500]}
      />
    ),
    title: "Notifications",
    subtitle: "Manage your alerts",
    route: "/notifications",
  },
  {
    icon: (
      <Ionicons name="card-outline" size={24} color={colors.primary[500]} />
    ),
    title: "Payment Methods",
    subtitle: "Cards and bank accounts",
    route: "/payment",
  },
  {
    icon: (
      <Ionicons
        name="help-circle-outline"
        size={24}
        color={colors.primary[500]}
      />
    ),
    title: "Help & Support",
    subtitle: "Get help when you need it",
    route: "/help",
  },
  {
    icon: (
      <Ionicons
        name="document-text-outline"
        size={24}
        color={colors.primary[500]}
      />
    ),
    title: "Terms & Privacy",
    subtitle: "Legal information",
    route: "/terms",
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/auth/Login");
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/auth/Login");
        },
      },
    ]);
  };

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
              <Text style={styles.headerTitle}>Profile</Text>
              <Text style={styles.headerSubtitle}>Manage your account</Text>
            </View>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons
                name="settings-outline"
                size={24}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={[colors.primary[500], "#8B5CF6"]}
            style={styles.profileGradient}
          >
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={[
                    "rgba(255, 255, 255, 0.2)",
                    "rgba(255, 255, 255, 0.1)",
                  ]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>B</Text>
                </LinearGradient>
                <View style={styles.profileDetails}>
                  <Text style={styles.profileName}>Bishal Aryal</Text>
                  <Text style={styles.profileEmail}>bishal@expenzez.com</Text>
                  <View style={styles.profileBadges}>
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumText}>Premium</Text>
                    </View>
                    <Text style={styles.memberText}>Member since 2024</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="white"
                  style={styles.editButtonIcon}
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["#FEF3C7", "#FDE68A"]}
              style={styles.statGradient}
            >
              <View style={styles.statIconContainer}>
                <Feather name="trending-up" size={20} color="#D97706" />
              </View>
              <Text style={styles.statLabel}>Credit Score</Text>
              <Text style={styles.statValue}>720</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={["#DBEAFE", "#BFDBFE"]}
              style={styles.statGradient}
            >
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons
                  name="target"
                  size={20}
                  color="#1D4ED8"
                />
              </View>
              <Text style={styles.statLabel}>Goals Met</Text>
              <Text style={styles.statValue}>3/5</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.menuCard}>
            {profileOptions.map((option, index) => (
              <TouchableOpacity
                key={option.title}
                style={[
                  styles.menuItem,
                  index !== profileOptions.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => router.push(option.route as any)}
              >
                <View style={styles.menuIconContainer}>{option.icon}</View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{option.title}</Text>
                  <Text style={styles.menuSubtitle}>{option.subtitle}</Text>
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
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text style={styles.logoutText}>Logout</Text>
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
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appCopyright}>
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
    backgroundColor: colors.background.secondary,
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
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  profileCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  profileGradient: {
    borderRadius: borderRadius["3xl"],
    padding: spacing.lg,
    ...shadows.lg,
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
    ...shadows.md,
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
    color: "#92400E",
  } as import("react-native").TextStyle,
  statValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
    color: "#92400E",
  } as import("react-native").TextStyle,
  menuSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  menuCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["3xl"],
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuIconContainer: {
    backgroundColor: colors.primary[500] + "20",
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
    color: colors.text.primary,
  } as import("react-native").TextStyle,
  menuSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
  } as import("react-native").TextStyle,
  logoutSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  logoutButton: {
    backgroundColor: "#FEF2F2",
    borderRadius: borderRadius["3xl"],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: {
    color: "#DC2626",
    fontWeight: "600" as const,
    fontSize: typography.fontSizes.base,
    marginLeft: spacing.md,
  } as import("react-native").TextStyle,
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
  } as import("react-native").TextStyle,
  appVersion: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  } as import("react-native").TextStyle,
  appCopyright: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  } as import("react-native").TextStyle,
});
