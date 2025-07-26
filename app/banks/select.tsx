import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAlert } from "../../hooks/useAlert";
import { useTheme } from "../../contexts/ThemeContext";
import { Header, Section } from "../../components/ui";
import { bankingAPI } from "../../services/api";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

interface Institution {
  id: string;
  name: string;
  logo?: string;
  bic?: string;
  transaction_total_days?: number;
}

export default function SelectBankScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuthGuard();
  const { showAlert, showError } = useAlert();
  const { colors } = useTheme();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState<
    Institution[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("gb");

  const countries = [
    { code: "gb", name: "United Kingdom", flag: "🇬🇧" },
    { code: "de", name: "Germany", flag: "🇩🇪" },
    { code: "fr", name: "France", flag: "🇫🇷" },
    { code: "es", name: "Spain", flag: "🇪🇸" },
    { code: "it", name: "Italy", flag: "🇮🇹" },
    { code: "nl", name: "Netherlands", flag: "🇳🇱" },
  ];

  useEffect(() => {
    loadInstitutions();
  }, [selectedCountry]);

  useEffect(() => {
    filterInstitutions();
  }, [searchQuery, institutions]);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const institutions = await bankingAPI.getInstitutions();
      setInstitutions(institutions || []);
    } catch (error: any) {
      console.error("Error loading institutions:", error);
      showError(
        error.response?.data?.message ||
          "Failed to load banks. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const filterInstitutions = () => {
    if (!searchQuery.trim()) {
      setFilteredInstitutions(institutions);
      return;
    }

    const filtered = institutions.filter((institution) =>
      institution.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInstitutions(filtered);
  };

  const handleBankSelection = async (institution: Institution) => {
    try {
      const response = await bankingAPI.connectBank({
        redirectUrl: "expenzez://banks/callback",
      });

      if (response.link) {
        Alert.alert(
          "Connect Bank",
          `You'll be redirected to ${institution.name} to authorize the connection. Continue?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Continue",
              onPress: () => {
                // In a real app, you would open the link in a WebView or external browser
                showAlert(
                  "Bank Connection",
                  `Redirecting to ${institution.name}...\n\nLink: ${response.link}`
                );
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Bank connection error:", error);
      showError(
        error.response?.data?.message ||
          "Failed to connect bank account. Please try again."
      );
    }
  };

  const getBankLogo = (institution: Institution, colors: any) => {
    if (institution.logo) {
      return (
        <Image
          source={{ uri: institution.logo }}
          style={styles.bankLogo}
          resizeMode="contain"
        />
      );
    }
    // Fallback: use a vector icon if no logo
    return (
      <Ionicons
        name="business-outline"
        size={32}
        color={colors.primary[500]}
        style={styles.bankLogo}
      />
    );
  };

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
      <Header
        title="Select Bank"
        subtitle="Choose your bank to connect"
        showBackButton={true}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Country Selection */}
        <Section title="Select Country">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.countryScroll}
            contentContainerStyle={styles.countryContainer}
          >
            {countries.map((country) => (
              <TouchableOpacity
                key={country.code}
                style={[
                  styles.countryButton,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  },
                  selectedCountry === country.code && {
                    backgroundColor: colors.primary[500],
                    borderColor: colors.primary[500],
                  },
                ]}
                onPress={() => setSelectedCountry(country.code)}
              >
                <Text style={styles.countryFlag}>{country.flag}</Text>
                <Text
                  style={[
                    styles.countryName,
                    { color: colors.text.primary },
                    selectedCountry === country.code && { color: "white" },
                  ]}
                >
                  {country.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Section>

        {/* Search Bar */}
        <Section title="Search Banks">
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={colors.text.secondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text.primary }]}
              placeholder="Search for your bank..."
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </Section>

        {/* Banks List */}
        <Section title="Available Banks">
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text
                style={[styles.loadingText, { color: colors.text.secondary }]}
              >
                Loading banks...
              </Text>
            </View>
          ) : filteredInstitutions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={48}
                color={colors.text.tertiary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                No banks found
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.text.secondary }]}
              >
                {searchQuery
                  ? "Try a different search term"
                  : "No banks available in this country"}
              </Text>
            </View>
          ) : (
            <View style={styles.banksContainer}>
              {filteredInstitutions.map((institution) => (
                <TouchableOpacity
                  key={institution.id}
                  style={[
                    styles.bankItem,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.light,
                    },
                    shadows.sm,
                  ]}
                  onPress={() => handleBankSelection(institution)}
                >
                  <View style={styles.bankInfo}>
                    <View style={styles.bankLogoContainer}>
                      {getBankLogo(institution, colors)}
                    </View>
                    <View style={styles.bankDetails}>
                      <Text
                        style={[
                          styles.bankName,
                          { color: colors.text.primary },
                        ]}
                      >
                        {institution.name}
                      </Text>
                      {institution.bic && (
                        <Text
                          style={[
                            styles.bankBic,
                            { color: colors.text.secondary },
                          ]}
                        >
                          BIC: {institution.bic}
                        </Text>
                      )}
                      {institution.transaction_total_days && (
                        <Text
                          style={[
                            styles.bankDays,
                            { color: colors.text.secondary },
                          ]}
                        >
                          {institution.transaction_total_days} days of history
                        </Text>
                      )}
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
          )}
        </Section>

        {/* Info Card */}
        <Section>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.primary[50],
                borderColor: colors.primary[200],
              },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={24}
              color={colors.primary[500]}
            />
            <Text style={[styles.infoText, { color: colors.text.primary }]}>
              Your bank credentials are never stored. We use secure Open Banking
              APIs to access your data.
            </Text>
          </View>
        </Section>
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
    paddingBottom: spacing["2xl"],
  },
  countryScroll: {
    marginBottom: spacing.md,
  },
  countryContainer: {
    paddingHorizontal: spacing.lg,
  },
  countryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    marginRight: spacing.md,
    borderWidth: 1,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  countryName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.base,
  },
  clearButton: {
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.base,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
  },
  emptyTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.base,
    textAlign: "center",
  },
  banksContainer: {
    gap: spacing.md,
  },
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  bankInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bankLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  bankLogo: {
    width: 32,
    height: 32,
  },
  bankDetails: {
    flex: 1,
  },
  bankName: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  bankBic: {
    fontSize: typography.fontSizes.sm,
    marginBottom: spacing.xs,
  },
  bankDays: {
    fontSize: typography.fontSizes.sm,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.fontSizes.sm * 1.4,
    marginLeft: spacing.sm,
  },
});
