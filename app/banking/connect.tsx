import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import { finexerAPI, SupportedBank } from "../../services/finexerAPI";
import {
  spacing,
  borderRadius,
  typography,
  shadows,
} from "../../constants/theme";

export default function ConnectBankScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [banks, setBanks] = useState<SupportedBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSupportedBanks();
  }, []);

  const loadSupportedBanks = async () => {
    try {
      setLoading(true);
      const supportedBanks = await finexerAPI.getSupportedBanks();
      setBanks(supportedBanks);
    } catch (error) {
      console.error("Error loading banks:", error);
      // Don't show error alert if we have mock data
      if (banks.length === 0) {
        Alert.alert("Error", "Failed to load supported banks");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (bankId: string) => {
    setImageErrors((prev) => new Set(prev).add(bankId));
  };

  // Test banks that we can actually test with
  const testBanks: SupportedBank[] = [
    {
      id: "test-natwest",
      name: "NatWest (Test)",
      logoUrl: "https://logo.clearbit.com/natwest.com",
      country: "UK",
      supportedFeatures: ["accounts", "transactions", "balance", "payments"],
    },
    {
      id: "test-hsbc",
      name: "HSBC (Test)",
      logoUrl: "https://logo.clearbit.com/hsbc.co.uk",
      country: "UK",
      supportedFeatures: ["accounts", "transactions", "balance", "payments"],
    },
    {
      id: "test-barclays",
      name: "Barclays (Test)",
      logoUrl: "https://logo.clearbit.com/barclays.co.uk",
      country: "UK",
      supportedFeatures: ["accounts", "transactions", "balance", "payments"],
    },
  ];

  const handleConnectBank = async (bankId?: string) => {
    if (!user?.id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      setConnecting(true);

      // Find bank name from either testBanks or banks array
      const bank =
        testBanks.find((b) => b.id === bankId) ||
        banks.find((b) => b.id === bankId);
      const bankName = bank?.name || "Bank";

      // Navigate to OAuth WebView screen instead of opening Safari
      router.push({
        pathname: "/banking/oauth",
        params: {
          bankId: bankId || "default",
          bankName: bankName,
        },
      });
    } catch (error) {
      console.error("Error connecting bank:", error);
      Alert.alert("Error", "Failed to initiate bank connection");
    } finally {
      setConnecting(false);
    }
  };

  const handleBankSelection = (bank: SupportedBank) => {
    Alert.alert(
      "Connect Bank Account",
      `Connect your ${bank.name} account to automatically sync transactions and balances?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Connect",
          onPress: () => handleConnectBank(bank.id),
          style: "default",
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.default },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading supported banks...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.default }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Connect Bank Account
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Securely connect your bank account to automatically sync
            transactions and balances
          </Text>
        </View>

        {/* Benefits */}
        <View
          style={[
            styles.benefitsCard,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.border.light,
            },
            shadows.sm,
          ]}
        >
          <Text style={[styles.benefitsTitle, { color: colors.text.primary }]}>
            Why connect your bank?
          </Text>
          <View style={styles.benefitsList}>
            {[
              "Automatic transaction sync",
              "Real-time balance updates",
              "Better spending insights",
              "Reduced manual entry",
              "Enhanced security",
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.success[500]}
                />
                <Text
                  style={[styles.benefitText, { color: colors.text.primary }]}
                >
                  {benefit}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Test Banks Section */}
        <View style={styles.bankSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            🧪 Test Banks (Recommended)
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: colors.text.secondary }]}
          >
            These banks are optimized for testing and development
          </Text>

          <View style={styles.bankList}>
            {testBanks.map((bank) => (
              <TouchableOpacity
                key={bank.id}
                style={[
                  styles.bankItem,
                  styles.testBankItem,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.primary[200],
                  },
                  shadows.sm,
                ]}
                onPress={() => handleBankSelection(bank)}
                disabled={connecting}
              >
                <View style={styles.bankInfo}>
                  <View
                    style={[
                      styles.bankLogo,
                      { backgroundColor: colors.primary[100] },
                    ]}
                  >
                    {bank.logoUrl && !imageErrors.has(bank.id) ? (
                      <Image
                        source={{ uri: bank.logoUrl }}
                        style={styles.bankLogoImage}
                        resizeMode="contain"
                        onError={() => handleImageError(bank.id)}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.bankLogoText,
                          { color: colors.primary[600] },
                        ]}
                      >
                        {bank.name.charAt(0)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.bankDetails}>
                    <Text
                      style={[styles.bankName, { color: colors.text.primary }]}
                    >
                      {bank.name}
                    </Text>
                    <Text
                      style={[
                        styles.bankCountry,
                        { color: colors.text.secondary },
                      ]}
                    >
                      {bank.country} • Test Environment
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* All Banks Section */}
        <View style={styles.bankSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            All Supported Banks
          </Text>

          {banks.length > 0 ? (
            <View style={styles.bankList}>
              {banks.map((bank) => (
                <TouchableOpacity
                  key={bank.id}
                  style={[
                    styles.bankItem,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.light,
                    },
                    shadows.sm,
                  ]}
                  onPress={() => handleBankSelection(bank)}
                  disabled={connecting}
                >
                  <View style={styles.bankInfo}>
                    <View
                      style={[
                        styles.bankLogo,
                        { backgroundColor: colors.background.secondary },
                      ]}
                    >
                      {bank.logoUrl && !imageErrors.has(bank.id) ? (
                        <Image
                          source={{ uri: bank.logoUrl }}
                          style={styles.bankLogoImage}
                          resizeMode="contain"
                          onError={() => handleImageError(bank.id)}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.bankLogoText,
                            { color: colors.primary[500] },
                          ]}
                        >
                          {bank.name.charAt(0)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.bankDetails}>
                      <Text
                        style={[
                          styles.bankName,
                          { color: colors.text.primary },
                        ]}
                      >
                        {bank.name}
                      </Text>
                      <Text
                        style={[
                          styles.bankCountry,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {bank.country}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.text.tertiary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noBanksContainer}>
              <Ionicons
                name="card-outline"
                size={48}
                color={colors.text.tertiary}
              />
              <Text
                style={[styles.noBanksText, { color: colors.text.secondary }]}
              >
                No supported banks available
              </Text>
            </View>
          )}
        </View>

        {/* Connect Any Bank Button */}
        <TouchableOpacity
          style={[
            styles.connectAnyButton,
            { backgroundColor: colors.primary[500] },
            shadows.md,
          ]}
          onPress={() => handleConnectBank()}
          disabled={connecting}
        >
          {connecting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="link" size={20} color="white" />
              <Text style={styles.connectAnyText}>Connect Any Bank</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Security Notice */}
        <View
          style={[
            styles.securityNotice,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.light,
            },
          ]}
        >
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={colors.success[500]}
          />
          <Text style={[styles.securityText, { color: colors.text.secondary }]}>
            Your bank credentials are never stored. We use bank-level security
            to protect your data.
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
  scrollContent: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  header: {
    marginBottom: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    lineHeight: 22,
  },
  benefitsCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  benefitsTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  benefitsList: {
    marginTop: spacing.sm,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  benefitText: {
    ...typography.body,
    flex: 1,
  },
  bankSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.caption,
    marginBottom: spacing.md,
    fontStyle: "italic",
  },
  bankList: {
    gap: spacing.sm,
  },
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  testBankItem: {
    borderWidth: 2,
    borderStyle: "dashed",
  },
  bankInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bankLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  bankLogoText: {
    ...typography.h4,
    fontWeight: "bold",
  },
  bankLogoImage: {
    width: 32,
    height: 32,
  },
  bankDetails: {
    flex: 1,
  },
  bankName: {
    ...typography.body,
    fontWeight: "600",
  },
  bankCountry: {
    ...typography.caption,
    marginTop: 2,
  },
  noBanksContainer: {
    alignItems: "center",
    padding: spacing.xl,
  },
  noBanksText: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  connectAnyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  connectAnyText: {
    ...typography.body,
    color: "white",
    fontWeight: "600",
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  securityText: {
    ...typography.caption,
    flex: 1,
    lineHeight: 18,
  },
});
