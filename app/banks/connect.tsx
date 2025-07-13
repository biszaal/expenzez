import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import { bankingAPI } from "../../services/api";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

const popularBanks = [
  {
    id: "REVOLUT_REVOLUT",
    name: "Revolut",
    logo: "🟣",
    description: "Digital banking",
    color: "#5F3DC4",
  },
  {
    id: "MONZO_BANK_LTD",
    name: "Monzo",
    logo: "🟠",
    description: "Digital banking",
    color: "#FF6B35",
  },
  {
    id: "BARCLAYS_BANK",
    name: "Barclays",
    logo: "🔵",
    description: "Traditional banking",
    color: "#1E40AF",
  },
  {
    id: "HSBC_BANK_PLC",
    name: "HSBC",
    logo: "🔴",
    description: "Traditional banking",
    color: "#DC2626",
  },
  {
    id: "LLOYDS_BANK_PLC",
    name: "Lloyds Bank",
    logo: "🟢",
    description: "Traditional banking",
    color: "#059669",
  },
  {
    id: "NATWEST",
    name: "NatWest",
    logo: "🟡",
    description: "Traditional banking",
    color: "#D97706",
  },
  {
    id: "SANTANDER_UK",
    name: "Santander",
    logo: "🔴",
    description: "Traditional banking",
    color: "#DC2626",
  },
  {
    id: "TSB_BANK",
    name: "TSB",
    logo: "🟢",
    description: "Traditional banking",
    color: "#059669",
  },
  {
    id: "NATIONWIDE",
    name: "Nationwide",
    logo: "🏠",
    description: "Building society",
    color: "#7C3AED",
  },
  {
    id: "CO_OPERATIVE_BANK",
    name: "Co-op Bank",
    logo: "🤝",
    description: "Ethical banking",
    color: "#059669",
  },
  {
    id: "FIRST_DIRECT",
    name: "First Direct",
    logo: "📱",
    description: "Digital banking",
    color: "#1E40AF",
  },
  {
    id: "METRO_BANK",
    name: "Metro Bank",
    logo: "🏛️",
    description: "Traditional banking",
    color: "#DC2626",
  },
];

export default function ConnectBankScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleBankConnection = async (bankId: string, bankName: string) => {
    if (!user) {
      Alert.alert("Error", "Please log in to connect your bank account");
      return;
    }

    setIsConnecting(true);
    try {
      const response = await bankingAPI.connectBank({
        institutionId: bankId,
        redirectUrl: "expenzez://banks/callback",
      });

      if (response.link) {
        Alert.alert(
          "Bank Connection",
          `You'll be redirected to ${bankName} to authorize the connection. Continue?`,
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Continue",
              onPress: () => {
                // In a real app, you'd open the URL in a WebView or browser
                Alert.alert(
                  "Connection Started",
                  `Redirecting to ${bankName}...\n\nIn a real app, this would open the bank's authorization page.`
                );
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Bank connection error:", error);
      Alert.alert(
        "Connection Failed",
        error.response?.data?.message ||
          "Failed to connect bank account. Please try again."
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Connect Bank</Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              try {
                const result = await bankingAPI.testNordigen();
                Alert.alert(
                  "Nordigen Test",
                  `Connection successful!\n\nFound ${result.result.institutionsCount} UK banks available.\n\nSample banks:\n${result.result.sampleInstitutions.map((bank: any) => `• ${bank.name}`).join("\n")}`
                );
              } catch (error: any) {
                Alert.alert(
                  "Nordigen Test Failed",
                  error.response?.data?.error ||
                    "Failed to connect to Nordigen. Check your credentials."
                );
              }
            }}
          >
            <Ionicons
              name="bug-outline"
              size={20}
              color={colors.primary[500]}
            />
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={[colors.primary[500], "#8B5CF6"]}
            style={styles.infoGradient}
          >
            <MaterialCommunityIcons
              name="shield-check"
              size={32}
              color="white"
            />
            <Text style={styles.infoTitle}>Secure Connection</Text>
            <Text style={styles.infoDescription}>
              Your bank credentials are never stored. We use secure APIs to
              access your financial data.
            </Text>
          </LinearGradient>
        </View>

        {/* Bank Selection */}
        <View style={styles.banksSection}>
          <Text style={styles.sectionTitle}>Popular Banks</Text>
          <Text style={styles.sectionSubtitle}>
            Select your bank to connect your account
          </Text>

          <View style={styles.banksGrid}>
            {popularBanks.map((bank) => (
              <TouchableOpacity
                key={bank.id}
                style={styles.bankCard}
                onPress={() => handleBankConnection(bank.id, bank.name)}
                disabled={isConnecting}
              >
                <View style={styles.bankLogoContainer}>
                  <Text style={styles.bankLogo}>{bank.logo}</Text>
                </View>
                <Text style={styles.bankName}>{bank.name}</Text>
                <Text style={styles.bankDescription}>{bank.description}</Text>
                {isConnecting && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator color={colors.primary[500]} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons
            name="lock-closed"
            size={20}
            color={colors.text.secondary}
          />
          <Text style={styles.securityText}>
            Your data is protected with bank-level security
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  testButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  infoCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoGradient: {
    borderRadius: borderRadius["3xl"],
    padding: spacing.xl,
    alignItems: "center",
    ...shadows.lg,
  },
  infoTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    color: "white",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  infoDescription: {
    fontSize: typography.fontSizes.base,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center" as const,
    lineHeight: typography.fontSizes.base * 1.5,
  },
  banksSection: {
    marginHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  banksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  bankCard: {
    width: "48%",
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["3xl"],
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: "center",
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    position: "relative",
  },
  bankLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  bankLogo: {
    fontSize: 32,
  },
  bankName: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    color: colors.text.primary,
    textAlign: "center" as const,
    marginBottom: spacing.xs,
  },
  bankDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    textAlign: "center" as const,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: borderRadius["3xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  securityText: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
});
 