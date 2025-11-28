import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, ColorScheme } from "../../contexts/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import { spacing, borderRadius, shadows } from "../../constants/theme";
import { useSubscription } from "../../hooks/useSubscription";
import { useRevenueCat } from "../../contexts/RevenueCatContext";

export default function SettingsPage() {
  const router = useRouter();
  const { colors, colorScheme, setColorScheme, isDark } = useTheme();
  const { logout } = useAuth();
  const {
    isPremium,
    isLoading: subscriptionLoading,
    subscriptionStatus,
    restorePurchases,
    trialMessage,
  } = useSubscription();
  const { refreshCustomerInfo } = useRevenueCat();

  // Local state for settings
  const [restoringPurchases, setRestoringPurchases] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  // Load userId from AsyncStorage on mount
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const AsyncStorage = (
          await import("@react-native-async-storage/async-storage")
        ).default;
        const SecureStoreModule = await import("expo-secure-store");
        const SecureStore = SecureStoreModule.default || SecureStoreModule;

        // Try to get the idToken which contains the actual UUID in the 'sub' claim
        const idToken = await SecureStore.getItemAsync("idToken", {
          keychainService: "expenzez-tokens",
        });

        if (idToken) {
          try {
            // Decode JWT (just the payload, no signature verification needed for display)
            const parts = idToken.split(".");
            if (parts.length === 3) {
              // Add padding if needed
              const payload = parts[1];
              const padded = payload + "===".substring(0, (4 - (payload.length % 4)) % 4);
              // Use atob for base64 decoding (works in React Native)
              const decoded = JSON.parse(atob(padded));
              const userId = decoded.sub;
              if (userId) {
                console.log("[Settings] Extracted userId from idToken:", userId);
                setUserId(userId);
                return;
              }
            }
          } catch (decodeError) {
            console.error("[Settings] Failed to decode idToken:", decodeError);
          }
        }

        // Fallback: try to get from user object if idToken decode fails
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          const id = user?.sub || user?.id;
          if (id) {
            setUserId(id);
          }
        }
      } catch (error) {
        console.error("Error loading userId:", error);
      }
    };
    loadUserId();
  }, []);

  const themeOptions = [
    {
      key: "light" as ColorScheme,
      label: "Light Mode",
      icon: "sunny-outline",
      description: "Always use light theme",
    },
    {
      key: "dark" as ColorScheme,
      label: "Dark Mode",
      icon: "moon-outline",
      description: "Always use dark theme",
    },
    {
      key: "system" as ColorScheme,
      label: "System Default",
      icon: "phone-portrait-outline",
      description: "Follow your phone's setting",
    },
  ];

  const handleExportData = () => {
    Alert.alert("Export Data", "Export your financial data as CSV or PDF?", [
      { text: "Cancel", style: "cancel" },
      { text: "CSV", onPress: () => exportData("csv") },
      { text: "PDF", onPress: () => exportData("pdf") },
    ]);
  };

  const exportData = async (format: string) => {
    // TODO: Implement actual data export
    Alert.alert(
      "Export Started",
      `Your data export in ${format.toUpperCase()} format will be ready shortly.`
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all your financial data, including transactions, accounts, and budgets. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // TODO: Implement actual data deletion
              Alert.alert(
                "Data Deleted",
                "All your data has been permanently deleted."
              );
            } catch (error) {
              Alert.alert("Error", "Failed to delete data. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and ALL associated data:\n\n• Profile and credentials\n• All transactions\n• Budgets and preferences\n• AI chat history\n• Notification data\n\nThis action CANNOT be undone and you will be logged out immediately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            // Second confirmation
            Alert.alert(
              "Final Confirmation",
              "Are you absolutely sure? This will permanently delete your account and all data. You cannot recover your account after this.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete My Account",
                  style: "destructive",
                  onPress: deleteAccountConfirmed,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const deleteAccountConfirmed = async () => {
    try {
      console.log("Deleting account...");

      // Import API client and auth
      const { apiClient } = await import("../services/config/apiClient");
      const { logout } = useAuth();

      // Call backend delete-account endpoint
      const response = await apiClient.delete("/auth/delete-account");

      if (response.status === 200) {
        console.log("Account deletion successful");

        Alert.alert(
          "Account Deleted",
          "Your account and all associated data have been permanently deleted.\n\nThank you for using Expenzez.",
          [
            {
              text: "OK",
              onPress: async () => {
                // Logout and clear all local data
                await logout();
                router.replace("/auth/login");
              },
            },
          ]
        );
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error: any) {
      console.error("Error deleting account:", error);

      let errorMessage = "Failed to delete account. Please try again later.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    }
  };

  const handleContactSupport = () => {
    Alert.alert("Contact Support", "How would you like to get in touch?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Email",
        onPress: () => Linking.openURL("mailto:support@expenzez.com"),
      },
      { text: "Help Center", onPress: () => router.push("/help") },
    ]);
  };

  const handleRestorePurchases = async () => {
    setRestoringPurchases(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        Alert.alert(
          "Success",
          "Your premium subscription has been successfully restored!"
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any previous purchases to restore."
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to restore purchases.");
    } finally {
      setRestoringPurchases(false);
    }
  };

  const handleCopyAccountId = async () => {
    if (userId) {
      try {
        await Clipboard.setString(userId);
        Alert.alert("Copied", "Account ID copied to clipboard");
      } catch (error) {
        Alert.alert("Error", "Failed to copy Account ID");
      }
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: colors.background.primary },
          ]}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text.primary }]}>
          Settings
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Theme Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Appearance
            </Text>
            <Text
              style={[
                styles.sectionDescription,
                { color: colors.text.secondary },
              ]}
            >
              Choose how expenzez looks on your device
            </Text>

            <View
              style={[
                styles.themeContainer,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
            >
              {themeOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.themeOption,
                    index !== themeOptions.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border.light,
                    },
                    colorScheme === option.key && {
                      backgroundColor:
                        colors.primary.main[100] || "rgba(124, 58, 237, 0.1)",
                    },
                  ]}
                  onPress={() => setColorScheme(option.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.themeOptionLeft}>
                    <View
                      style={[
                        styles.themeIconContainer,
                        {
                          backgroundColor:
                            colorScheme === option.key
                              ? colors.primary.main
                              : colors.background.tertiary,
                        },
                      ]}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={20}
                        color={
                          colorScheme === option.key
                            ? "#fff"
                            : colors.text.secondary
                        }
                      />
                    </View>
                    <View style={styles.themeTextContainer}>
                      <Text
                        style={[
                          styles.themeLabel,
                          { color: colors.text.primary },
                          colorScheme === option.key && { fontWeight: "600" },
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.themeDescription,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  {colorScheme === option.key && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.primary.main}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* App Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              App Settings
            </Text>

            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
              onPress={() => router.push("/budgets/edit")}
            >
              <Ionicons
                name="wallet-outline"
                size={22}
                color={colors.primary.main}
                style={{ marginRight: 14 }}
              />
              <Text
                style={[styles.settingText, { color: colors.text.primary }]}
              >
                Budget Settings
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Preferences
            </Text>

            {/* Notifications */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
              onPress={() => router.push("/notifications/preferences")}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.primary.main}
                style={{ marginRight: 14 }}
              />
              <Text
                style={[styles.settingText, { color: colors.text.primary }]}
              >
                Notifications
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
              onPress={() => router.push("/security")}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={colors.primary.main}
                style={{ marginRight: 14 }}
              />
              <Text
                style={[styles.settingText, { color: colors.text.primary }]}
              >
                Security & Privacy
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Subscription */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Subscription
            </Text>

            {/* Subscription Status Card */}
            <View
              style={[
                styles.subscriptionCard,
                {
                  backgroundColor: isPremium
                    ? colors.primary.main[50] || "rgba(124, 58, 237, 0.05)"
                    : colors.background.primary,
                  borderColor: isPremium
                    ? colors.primary.main[200] || "rgba(124, 58, 237, 0.2)"
                    : colors.border.light,
                },
                shadows.sm,
              ]}
            >
              <View style={styles.subscriptionHeader}>
                <View style={styles.subscriptionTitleRow}>
                  <Ionicons
                    name={isPremium ? "diamond" : "diamond-outline"}
                    size={24}
                    color={isPremium ? colors.primary.main : colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.subscriptionTitle,
                      { color: colors.text.primary },
                    ]}
                  >
                    {subscriptionLoading ? (
                      <ActivityIndicator size="small" color={colors.primary.main} />
                    ) : isPremium ? (
                      "Premium"
                    ) : (
                      "Free Plan"
                    )}
                  </Text>
                  {isPremium && subscriptionStatus.isInTrial && (
                    <View
                      style={[
                        styles.trialBadge,
                        { backgroundColor: colors.warning.main },
                      ]}
                    >
                      <Text style={styles.trialBadgeText}>TRIAL</Text>
                    </View>
                  )}
                </View>

                {isPremium ? (
                  <View style={styles.subscriptionDetails}>
                    {subscriptionStatus.isInTrial && trialMessage && (
                      <Text
                        style={[
                          styles.subscriptionDetailText,
                          { color: colors.warning[600] || colors.text.secondary },
                        ]}
                      >
                        {trialMessage}
                      </Text>
                    )}
                    {subscriptionStatus.expiryDate && (
                      <Text
                        style={[
                          styles.subscriptionDetailText,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {subscriptionStatus.isCancelled
                          ? `Access until ${subscriptionStatus.expiryDate.toLocaleDateString()}`
                          : `Renews ${subscriptionStatus.expiryDate.toLocaleDateString()}`}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.subscriptionDescription,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Unlock unlimited AI queries, budgets, analytics, and more
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.subscriptionActions}>
                {!isPremium ? (
                  <TouchableOpacity
                    style={[
                      styles.upgradeButton,
                      { backgroundColor: colors.primary.main },
                    ]}
                    onPress={() => router.push("/subscription/plans")}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="diamond" size={18} color="white" />
                    <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.manageButton,
                      {
                        backgroundColor: colors.background.secondary,
                        borderColor: colors.border.light,
                      },
                    ]}
                    onPress={() => router.push("/subscription/plans")}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="settings-outline"
                      size={18}
                      color={colors.text.primary}
                    />
                    <Text
                      style={[
                        styles.manageButtonText,
                        { color: colors.text.primary },
                      ]}
                    >
                      Manage Subscription
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.restoreLink}
                  onPress={handleRestorePurchases}
                  disabled={restoringPurchases}
                  activeOpacity={0.7}
                >
                  {restoringPurchases ? (
                    <ActivityIndicator size="small" color={colors.primary.main} />
                  ) : (
                    <>
                      <Ionicons
                        name="refresh"
                        size={14}
                        color={colors.primary.main}
                      />
                      <Text
                        style={[
                          styles.restoreLinkText,
                          { color: colors.primary.main },
                        ]}
                      >
                        Restore Purchases
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Account */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Account
            </Text>

            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
              onPress={handleExportData}
            >
              <Ionicons
                name="download-outline"
                size={22}
                color={colors.primary.main}
                style={{ marginRight: 14 }}
              />
              <Text
                style={[styles.settingText, { color: colors.text.primary }]}
              >
                Export Data
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: isDark ? "#7F1D1D" : "#FEF2F2",
                  borderColor: isDark ? "#991B1B" : "#FECACA",
                },
                shadows.sm,
              ]}
              onPress={handleDeleteData}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color={isDark ? "#FCA5A5" : "#DC2626"}
                style={{ marginRight: 14 }}
              />
              <Text
                style={[
                  styles.settingText,
                  { color: isDark ? "#FCA5A5" : "#DC2626" },
                ]}
              >
                Delete All Data
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: isDark ? "#7F1D1D" : "#FEF2F2",
                  borderColor: isDark ? "#991B1B" : "#FECACA",
                  marginTop: 10,
                },
                shadows.sm,
              ]}
              onPress={handleDeleteAccount}
            >
              <Ionicons
                name="close-circle-outline"
                size={22}
                color={isDark ? "#FCA5A5" : "#DC2626"}
                style={{ marginRight: 14 }}
              />
              <Text
                style={[
                  styles.settingText,
                  { color: isDark ? "#FCA5A5" : "#DC2626" },
                ]}
              >
                Delete Account
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Support
            </Text>

            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
              onPress={handleContactSupport}
            >
              <Ionicons
                name="help-circle-outline"
                size={22}
                color={colors.primary.main}
                style={{ marginRight: 14 }}
              />
              <Text
                style={[styles.settingText, { color: colors.text.primary }]}
              >
                Help & Support
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Legal */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Legal
            </Text>

            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
              onPress={() => Linking.openURL("https://expenzez.com/privacy")}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={colors.primary.main}
                style={{ marginRight: 14 }}
              />
              <Text
                style={[styles.settingText, { color: colors.text.primary }]}
              >
                Privacy Policy
              </Text>
              <Ionicons
                name="open-outline"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
              onPress={() => Linking.openURL("https://expenzez.com/terms")}
            >
              <Ionicons
                name="document-text-outline"
                size={22}
                color={colors.primary.main}
                style={{ marginRight: 14 }}
              />
              <Text
                style={[styles.settingText, { color: colors.text.primary }]}
              >
                Terms of Use (EULA)
              </Text>
              <Ionicons
                name="open-outline"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              About
            </Text>
            <View
              style={[
                styles.aboutContainer,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
            >
              <View style={styles.aboutItem}>
                <Text
                  style={[styles.aboutLabel, { color: colors.text.secondary }]}
                >
                  App Version
                </Text>
                <Text
                  style={[styles.aboutValue, { color: colors.text.primary }]}
                >
                  1.0.0
                </Text>
              </View>
              <View
                style={[
                  styles.aboutDivider,
                  { backgroundColor: colors.border.light },
                ]}
              />
              <View style={styles.aboutItem}>
                <Text
                  style={[styles.aboutLabel, { color: colors.text.secondary }]}
                >
                  Company
                </Text>
                <Text
                  style={[styles.aboutValue, { color: colors.text.primary }]}
                >
                  Biszaal Tech Ltd.
                </Text>
              </View>
            </View>
          </View>

          {/* Advanced */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
              onPress={() => setAdvancedExpanded(!advancedExpanded)}
            >
              <Ionicons
                name="settings-outline"
                size={22}
                color={colors.primary.main}
                style={{ marginRight: 14 }}
              />
              <Text
                style={[styles.settingText, { color: colors.text.primary }]}
              >
                Advanced Settings
              </Text>
              <Ionicons
                name={advancedExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>

            {advancedExpanded && (
              <View
                style={[
                  styles.advancedContainer,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  },
                  shadows.sm,
                ]}
              >
                <View style={styles.advancedItem}>
                  <View style={styles.advancedItemLeft}>
                    <Text
                      style={[
                        styles.advancedLabel,
                        { color: colors.text.secondary },
                      ]}
                    >
                      Account ID
                    </Text>
                    {userId && (
                      <Text
                        style={[
                          styles.advancedValue,
                          { color: colors.text.primary },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {userId}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.copyButton,
                      { backgroundColor: colors.primary.main },
                    ]}
                    onPress={handleCopyAccountId}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="copy"
                      size={16}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.advancedDivider,
                    { backgroundColor: colors.border.light },
                  ]}
                />

                <View style={styles.advancedNote}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.advancedNoteText,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Share this ID with support if you need help
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Sign Out */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: isDark ? "#7F1D1D" : "#FEF2F2",
                  borderColor: isDark ? "#991B1B" : "#FECACA",
                },
                shadows.sm,
              ]}
              onPress={() => {
                Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await logout();
                        router.replace("/auth/login");
                      } catch (error) {
                        Alert.alert(
                          "Error",
                          "Failed to sign out. Please try again."
                        );
                      }
                    },
                  },
                ]);
              }}
            >
              <Ionicons
                name="log-out-outline"
                size={22}
                color={isDark ? "#FCA5A5" : "#DC2626"}
                style={{ marginRight: 14 }}
              />
              <Text
                style={[
                  styles.settingText,
                  { color: isDark ? "#FCA5A5" : "#DC2626" },
                ]}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 18,
    opacity: 0.7,
  },
  trialBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trialBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  themeContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  themeOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  themeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  themeTextContainer: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.7,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  settingText: {
    fontWeight: "500",
    fontSize: 15,
    flex: 1,
  },
  settingItemContent: {
    flex: 1,
    marginRight: 12,
  },
  settingSubtext: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  settingValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValueText: {
    fontSize: 15,
    marginRight: 8,
  },
  aboutContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  aboutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  aboutLabel: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.7,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  aboutDivider: {
    height: 1,
    marginHorizontal: 20,
  },
  subscriptionNote: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  trialValueContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  trialEndDate: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  manageSubscriptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
  },
  manageSubscriptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  subscriptionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  subscriptionHeader: {
    marginBottom: 16,
  },
  subscriptionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  subscriptionDetails: {
    marginTop: 8,
    gap: 4,
  },
  subscriptionDetailText: {
    fontSize: 14,
    lineHeight: 20,
  },
  subscriptionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  subscriptionActions: {
    gap: 12,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  upgradeButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  manageButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  restoreLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  restoreLinkText: {
    fontSize: 13,
    fontWeight: "500",
  },
  advancedContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 8,
  },
  advancedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  advancedItemLeft: {
    flex: 1,
    marginRight: 8,
  },
  advancedLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    opacity: 0.7,
  },
  advancedValue: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Courier New",
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  advancedDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  advancedNote: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  advancedNoteText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
    opacity: 0.7,
  },
});
