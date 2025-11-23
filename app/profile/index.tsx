import React from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAlert } from "../../hooks/useAlert";
import {
  Header,
  Section,
  ListItem,
  EmptyState,
} from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

/**
 * Profile Screen - Main profile management screen
 *
 * Features:
 * - Personal information management
 * - Account settings
 * - Security settings
 * - Notification preferences
 * - Help and support
 * - Legal information
 * - Theme customization
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuthGuard();
  const { showConfirmation } = useAlert();
  const { colors, isDark, toggleTheme } = useTheme();

  // Handle logout with confirmation
  const handleLogout = () => {
    showConfirmation("Logout", "Are you sure you want to logout?", () => {
      // TODO: Implement logout logic
      router.replace("/auth/Login");
    });
  };

  // Handle account deletion with confirmation
  const handleDeleteAccount = () => {
    showConfirmation(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      () => {
        // TODO: Implement account deletion logic
        router.replace("/auth/Login");
      },
      undefined,
      "Delete",
      "Cancel"
    );
  };

  // If not logged in, don't render anything (auth guard will handle redirect)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      {/* Custom Header with back button */}
      <View
        style={[styles.header, { backgroundColor: colors.background.primary }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.replace("/(tabs)");
              }
            }}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.primary.main}
            />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Profile
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.text.secondary }]}
            >
              Manage your account settings
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Information Section */}
        <Section title="Account Information">
          <ListItem
            icon={{
              name: "person-outline",
              backgroundColor: colors.primary.main[100],
            }}
            title="Personal Information"
            subtitle="Update your profile details"
            onPress={() => router.push("/profile/personal")}
          />

          <ListItem
            icon={{
              name: "notifications-outline",
              backgroundColor: colors.warning[100],
            }}
            title="Notifications"
            subtitle="Manage your notification preferences"
            onPress={() => router.push("/notifications")}
          />

          <ListItem
            icon={{
              name: "card-outline",
              backgroundColor: colors.success[100],
            }}
            title="Payment Methods"
            subtitle="Manage your payment options"
            onPress={() => router.push("/payment")}
          />
        </Section>

        {/* Appearance Section */}
        <Section title="Appearance">
          <ListItem
            icon={{
              name: "color-palette-outline",
              backgroundColor: colors.secondary.main[100],
            }}
            title="Theme"
            subtitle="Choose your preferred theme"
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary.main }}
                thumbColor={isDark ? colors.background.primary : colors.background.secondary}
              />
            }
          />
        </Section>

        {/* Security Section */}
        <Section title="Security">
          <ListItem
            icon={{
              name: "shield-outline",
              backgroundColor: colors.error[100],
            }}
            title="Security Settings"
            subtitle="Manage your account security"
            onPress={() => router.push("/security")}
          />

          <ListItem
            icon={{
              name: "key-outline",
              backgroundColor: colors.secondary.main[100],
            }}
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => {
              // TODO: Implement password change
            }}
          />

          <ListItem
            icon={{
              name: "finger-print-outline",
              backgroundColor: colors.primary.main[100],
            }}
            title="Biometric Login"
            subtitle="Use fingerprint or face ID"
            rightElement={
              <View style={styles.switchContainer}>
                {/* TODO: Add Switch component */}
              </View>
            }
          />
        </Section>

        {/* Support Section */}
        <Section title="Support">
          <ListItem
            icon={{
              name: "help-circle-outline",
              backgroundColor: colors.warning[100],
            }}
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => router.push("/help")}
          />

          <ListItem
            icon={{
              name: "document-text-outline",
              backgroundColor: colors.primary.main[100],
            }}
            title="Terms & Privacy"
            subtitle="Read our terms and privacy policy"
            onPress={() => router.push("/terms")}
          />

          <ListItem
            icon={{
              name: "information-circle-outline",
              backgroundColor: colors.primary.main[100],
            }}
            title="About Expenzez"
            subtitle="App version and information"
            onPress={() => {
              // TODO: Show about modal
            }}
          />
        </Section>

        {/* Account Actions Section */}
        <Section title="Account Actions">
          <ListItem
            icon={{
              name: "log-out-outline",
              backgroundColor: colors.error[100],
            }}
            title="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            variant="danger"
          />

          <ListItem
            icon={{ name: "trash-outline", backgroundColor: colors.error[100] }}
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
            variant="danger"
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.base,
    marginTop: spacing.xs,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["2xl"],
  },
  switchContainer: {
    // Placeholder for switch component
    width: 20,
    height: 20,
  },
});
