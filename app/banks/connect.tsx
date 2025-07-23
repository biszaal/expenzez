import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAlert } from "../../hooks/useAlert";
import { useAuth } from "../../app/auth/AuthContext";
import { Header, Section, BankLogo } from "../../components/ui";
import { getInstitutions } from "../../services/dataSource";
import { BANK_LOGOS, BANK_CATEGORIES } from "../../constants/data";
import { useTheme } from "../../contexts/ThemeContext";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";
import * as Constants from "expo-constants";
import { bankingAPI } from "../../services/api";
import * as Linking from "expo-linking";

/**
 * Bank Connect Screen - Connect bank accounts
 *
 * Features:
 * - Browse available banks by category
 * - Connect to selected banks
 * - Secure authentication flow
 * - Bank information display
 */
export default function ConnectBankScreen() {
  const router = useRouter();
  const authGuard = useAuthGuard();
  const { isLoggedIn = false, loading = false } = authGuard || {};
  const { user } = useAuth();
  const { showAlert, showError } = useAlert();
  const { colors } = useTheme();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingBankId, setConnectingBankId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [banksList, setBanksList] = useState<any[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch supported banks from API on mount
  useEffect(() => {
    // Clear any old requisition or bank connection state on mount
    AsyncStorage.removeItem("requisitionId");
    AsyncStorage.removeItem("bankConnectionState");
    console.log(
      "[ConnectBankScreen] Cleared old requisition and bank connection state"
    );

    const fetchBanks = async () => {
      try {
        setLoadingBanks(true);
        const institutions = await getInstitutions();
        setBanksList(institutions || []);
      } catch (error) {
        console.error("Error loading institutions:", error);
        showError("Failed to load supported banks");
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);

  // Filter banks by search query and selected category
  const filteredBanks = banksList.filter((bank) => {
    const matchesCategory = selectedCategory
      ? bank.category === selectedCategory
      : true;
    const matchesSearch = bank.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  /**
   * Handle bank connection
   */
  const handleBankConnection = async (bankId: string) => {
    if (!isLoggedIn) {
      showError("Please log in to connect your bank account");
      return;
    }

    const bank = banksList.find((b) => b.id === bankId);
    if (!bank) {
      showError("Bank not found");
      return;
    }

    setIsConnecting(true);
    setConnectingBankId(bankId);
    try {
      // Call backend to start connection flow
      console.log("[ConnectBankScreen] Connecting bank with payload:", {
        institutionId: bank.id,
        redirectUrl:
          Platform.OS === "web"
            ? window.location.origin + "/banks/callback"
            : Linking.createURL("/banks/callback"),
      });
      const response = await bankingAPI.connectBank({
        institutionId: bank.id,
        redirectUrl: `exp://192.168.0.93:8081/--/banks/callback`,
      });
      console.log("[ConnectBankScreen] Bank connect response:", response);

      if (response.link) {
        // Store the requisition ID for the callback
        if (response.requisitionId) {
          await AsyncStorage.setItem("requisitionId", response.requisitionId);
          console.log(
            "[ConnectBankScreen] Stored requisitionId:",
            response.requisitionId
          );
        }

        if (Platform.OS === "web") {
          window.location.href = response.link;
        } else {
          try {
            await Linking.openURL(response.link);
          } catch (err) {
            showError("Bank connection cancelled.");
            return;
          }
        }
      } else {
        showError("Failed to get bank authentication link");
      }
    } catch (error: any) {
      console.error("[ConnectBankScreen] Connect bank error (full):", error);
      console.error("Connect bank error:", error);
      showError(
        error.response?.data?.message ||
          "Failed to start bank connection. Please try again."
      );
    } finally {
      setIsConnecting(false);
      setConnectingBankId(null);
    }
  };

  /**
   * Get category display info
   */
  const getCategoryInfo = (categoryKey: string) => {
    return (
      BANK_CATEGORIES[categoryKey as keyof typeof BANK_CATEGORIES] || {
        name: "Other",
        description: "Other banks",
        icon: "🏦",
        color: colors.primary[500],
      }
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
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background.secondary }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <Header
          title="Connect Bank"
          subtitle="Choose your bank to connect"
          rightButton={{
            icon: "bug-outline",
            onPress: async () => {
              try {
                // Debug: Show current auth state
                console.log("Auth Debug:", { isLoggedIn, user });

                const result = await bankingAPI.testNordigen();
                showAlert(
                  "Nordigen Test",
                  `Connection successful!\n\nFound ${result.result.institutionsCount} UK banks available.\n\nBanks:\n${result.result.sampleInstitutions.map((bank: any) => `• ${bank.name}`).join("\n")}`
                );
              } catch (error: any) {
                console.error("Nordigen test error:", error);
                showError(
                  error.response?.data?.message ||
                    "Failed to connect to Nordigen. Check your credentials."
                );
              }
            },
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Bank Categories */}
          <Section title="Bank Categories">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryContainer}
            >
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  },
                  !selectedCategory && {
                    backgroundColor: colors.primary[500],
                    borderColor: colors.primary[500],
                  },
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    { color: colors.text.primary },
                    !selectedCategory && { color: "white" },
                  ]}
                >
                  All Banks
                </Text>
              </TouchableOpacity>

              {Object.keys(BANK_CATEGORIES || {}).map((category) => {
                const categoryInfo = getCategoryInfo(category);
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: colors.background.primary,
                        borderColor: colors.border.light,
                      },
                      selectedCategory === category && {
                        backgroundColor: colors.primary[500],
                        borderColor: colors.primary[500],
                      },
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        { color: colors.text.primary },
                        selectedCategory === category && { color: "white" },
                      ]}
                    >
                      {categoryInfo.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Section>

          {/* Bank Selection */}
          <Section title="Available Banks">
            <Text
              style={[styles.sectionSubtitle, { color: colors.text.secondary }]}
            >
              Select your bank to connect your account
            </Text>

            {/* Search Bar */}
            <View style={{ marginBottom: spacing.md }}>
              <TextInput
                style={{
                  backgroundColor: colors.background.primary,
                  color: colors.text.primary,
                  borderRadius: borderRadius.xl,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.border.light,
                  fontSize: 16,
                }}
                placeholder="Search banks..."
                placeholderTextColor={colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>

            {loadingBanks ? (
              <View style={{ alignItems: "center", padding: spacing.lg }}>
                <ActivityIndicator color={colors.primary[500]} />
                <Text
                  style={{
                    color: colors.text.secondary,
                    marginTop: spacing.md,
                  }}
                >
                  Loading banks...
                </Text>
              </View>
            ) : (
              <View style={styles.banksList}>
                {filteredBanks.map((bank) => (
                  <TouchableOpacity
                    key={bank.id}
                    style={[
                      styles.bankCard,
                      {
                        backgroundColor: colors.background.primary,
                        borderColor: colors.border.light,
                      },
                    ]}
                    onPress={() => handleBankConnection(bank.id)}
                    disabled={isConnecting}
                    activeOpacity={0.7}
                  >
                    <BankLogo
                      bankName={bank.name}
                      logoUrl={bank.logo}
                      size="medium"
                      showName={false}
                      variant="default"
                    />

                    <View style={styles.bankCardContent}>
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
                          styles.bankType,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {bank.bic || bank.id}
                      </Text>
                    </View>

                    <View style={styles.bankCardRight}>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.text.tertiary}
                      />
                    </View>

                    {isConnecting && connectingBankId === bank.id && (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator color={colors.primary[500]} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Section>

          {/* Security Notice */}
          <Section title="Security & Privacy">
            <View style={styles.securityCard}>
              <View style={styles.securityItem}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                <Text
                  style={[styles.securityText, { color: colors.text.primary }]}
                >
                  Bank-level encryption protects your data
                </Text>
              </View>
              <View style={styles.securityItem}>
                <Ionicons name="lock-closed" size={20} color="#10B981" />
                <Text
                  style={[styles.securityText, { color: colors.text.primary }]}
                >
                  Your credentials are never stored
                </Text>
              </View>
              <View style={styles.securityItem}>
                <Ionicons name="eye-off" size={20} color="#10B981" />
                <Text
                  style={[styles.securityText, { color: colors.text.primary }]}
                >
                  Read-only access to your accounts
                </Text>
              </View>
            </View>
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
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
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoGradient: {
    borderRadius: borderRadius["3xl"],
    padding: spacing.xl,
    alignItems: "center",
    ...shadows.lg,
  },
  infoTitle: {
    color: "white",
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  infoDescription: {
    color: "white",
    fontSize: typography.fontSizes.base,
    textAlign: "center" as const,
    lineHeight: typography.fontSizes.base * 1.5,
    marginBottom: spacing.lg,
  },
  connectButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    marginTop: spacing.md,
  },
  connectButtonText: {
    color: "white",
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  debugButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  debugButtonText: {
    color: "white",
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
  },
  categoryScroll: {
    marginBottom: spacing.md,
  },
  categoryContainer: {
    paddingHorizontal: spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    marginRight: spacing.sm,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.base,
    marginBottom: spacing.lg,
  },
  banksList: {
    gap: spacing.sm,
  },
  bankCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    ...shadows.sm,
    position: "relative",
  },
  bankCardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  bankName: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    marginBottom: spacing.xs,
  },
  bankType: {
    fontSize: typography.fontSizes.sm,
  },
  bankCardRight: {
    marginLeft: spacing.sm,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.xl,
  },
  securityCard: {
    gap: spacing.md,
  },
  securityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  securityText: {
    fontSize: typography.fontSizes.sm,
    flex: 1,
  },
});
