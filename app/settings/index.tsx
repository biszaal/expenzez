import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Switch, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, ColorScheme } from "../../contexts/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import { spacing, borderRadius, shadows } from "../../constants/theme";

export default function SettingsPage() {
  const router = useRouter();
  const { colors, colorScheme, setColorScheme, isDark } = useTheme();
  const { logout } = useAuth();

  // Local state for settings
  const [currency, setCurrency] = useState("GBP");

  const themeOptions = [
    {
      key: "light" as ColorScheme,
      label: "Light Mode",
      icon: "sunny-outline",
      description: "Always use light theme"
    },
    {
      key: "dark" as ColorScheme,
      label: "Dark Mode", 
      icon: "moon-outline",
      description: "Always use dark theme"
    },
    {
      key: "system" as ColorScheme,
      label: "System Default",
      icon: "phone-portrait-outline",
      description: "Follow your phone's setting"
    }
  ];

  const currencyOptions = [
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  ];

  const handleCurrencyPress = () => {
    Alert.alert(
      "Select Currency",
      "Choose your preferred currency",
      [
        ...currencyOptions.map(option => ({
          text: `${option.symbol} ${option.name}`,
          onPress: () => setCurrency(option.code),
          style: currency === option.code ? 'default' as const : 'default' as const
        })),
        { text: "Cancel", style: "cancel" as const }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "Export your financial data as CSV or PDF?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "CSV", onPress: () => exportData("csv") },
        { text: "PDF", onPress: () => exportData("pdf") }
      ]
    );
  };

  const exportData = async (format: string) => {
    // TODO: Implement actual data export
    Alert.alert("Export Started", `Your data export in ${format.toUpperCase()} format will be ready shortly.`);
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
              Alert.alert("Data Deleted", "All your data has been permanently deleted.");
            } catch (error) {
              Alert.alert("Error", "Failed to delete data. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "How would you like to get in touch?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Email", onPress: () => Linking.openURL("mailto:support@expenzez.com") },
        { text: "Help Center", onPress: () => router.push("/help") }
      ]
    );
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
            shadows.sm,
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
          <Ionicons name="chevron-back" size={26} color={colors.primary[500]} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text.primary }]}>
          Settings
        </Text>
        <View style={{ width: 32 }} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Theme Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Appearance
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Choose how expenzez looks on your device
            </Text>
            
            <View style={[styles.themeContainer, { backgroundColor: colors.background.primary, borderColor: colors.border.light }, shadows.sm]}>
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
                      backgroundColor: colors.primary[100] || 'rgba(124, 58, 237, 0.1)',
                    }
                  ]}
                  onPress={() => setColorScheme(option.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.themeOptionLeft}>
                    <View style={[
                      styles.themeIconContainer,
                      { backgroundColor: colorScheme === option.key ? colors.primary[500] : colors.background.tertiary }
                    ]}>
                      <Ionicons
                        name={option.icon as any}
                        size={20}
                        color={colorScheme === option.key ? "#fff" : colors.text.secondary}
                      />
                    </View>
                    <View style={styles.themeTextContainer}>
                      <Text style={[
                        styles.themeLabel,
                        { color: colors.text.primary },
                        colorScheme === option.key && { fontWeight: '600' }
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={[styles.themeDescription, { color: colors.text.secondary }]}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  {colorScheme === option.key && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.primary[500]}
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
              onPress={handleCurrencyPress}
            >
              <Ionicons
                name="card-outline"
                size={22}
                color={colors.primary[500]}
                style={{ marginRight: 14 }}
              />
              <Text style={[styles.settingText, { color: colors.text.primary }]}>
                Currency
              </Text>
              <View style={styles.settingValue}>
                <Text style={[styles.settingValueText, { color: colors.text.secondary }]}>
                  {currencyOptions.find(c => c.code === currency)?.symbol} {currency}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </View>
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
              onPress={() => router.push("/budgets/edit")}
            >
              <Ionicons
                name="wallet-outline"
                size={22}
                color={colors.primary[500]}
                style={{ marginRight: 14 }}
              />
              <Text style={[styles.settingText, { color: colors.text.primary }]}>
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
                color={colors.primary[500]}
                style={{ marginRight: 14 }}
              />
              <Text style={[styles.settingText, { color: colors.text.primary }]}>
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
                color={colors.primary[500]}
                style={{ marginRight: 14 }}
              />
              <Text style={[styles.settingText, { color: colors.text.primary }]}>
                Security & Privacy
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
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
                color={colors.primary[500]}
                style={{ marginRight: 14 }}
              />
              <Text style={[styles.settingText, { color: colors.text.primary }]}>
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
                  backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2',
                  borderColor: isDark ? '#991B1B' : '#FECACA',
                },
                shadows.sm,
              ]}
              onPress={handleDeleteData}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color={isDark ? '#FCA5A5' : '#DC2626'}
                style={{ marginRight: 14 }}
              />
              <Text style={[styles.settingText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                Delete All Data
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
                color={colors.primary[500]}
                style={{ marginRight: 14 }}
              />
              <Text style={[styles.settingText, { color: colors.text.primary }]}>
                Help & Support
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Sign Out */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2',
                  borderColor: isDark ? '#991B1B' : '#FECACA',
                },
                shadows.sm,
              ]}
              onPress={() => {
                Alert.alert(
                  "Sign Out",
                  "Are you sure you want to sign out?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Sign Out", 
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await logout();
                          router.replace("/auth/Login");
                        } catch (error) {
                          Alert.alert("Error", "Failed to sign out. Please try again.");
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons
                name="log-out-outline"
                size={22}
                color={isDark ? '#FCA5A5' : '#DC2626'}
                style={{ marginRight: 14 }}
              />
              <Text style={[styles.settingText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
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
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 14,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 20,
  },
  themeContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  themeOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  themeTextContainer: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  settingText: {
    fontWeight: "500",
    fontSize: 16,
    flex: 1,
  },
  settingValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValueText: {
    fontSize: 15,
    marginRight: 8,
  },
});
