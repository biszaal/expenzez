import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAlert } from "../../hooks/useAlert";
import { bankingAPI } from "../../services/api";
import { spacing, borderRadius, shadows } from "../../constants/theme";

interface Bank {
  id: string;
  name: string;
  logo: string;
  isSupported: boolean;
}

export default function BankSelectScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showError, showSuccess } = useAlert();
  
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await bankingAPI.getInstitutions();
      setBanks(response.institutions || []);
    } catch (error: any) {
      console.error("Error fetching banks:", error);
      showError("Failed to load available banks");
      // Provide fallback banks
      setBanks([
        { id: "hsbc", name: "HSBC", logo: "", isSupported: true },
        { id: "barclays", name: "Barclays", logo: "", isSupported: true },
        { id: "lloyds", name: "Lloyds", logo: "", isSupported: true },
        { id: "natwest", name: "NatWest", logo: "", isSupported: true },
        { id: "santander", name: "Santander", logo: "", isSupported: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSelect = async (bank: Bank) => {
    if (!bank.isSupported) {
      showError(`${bank.name} is not supported yet`);
      return;
    }

    try {
      setConnecting(bank.id);
      const response = await bankingAPI.connectBankDirect(bank.id);
      
      if (response.authUrl) {
        showSuccess(`Connecting to ${bank.name}...`);
        // Navigate to bank connection flow
        router.push({
          pathname: "/banks/connect",
          params: { bankId: bank.id, authUrl: response.authUrl }
        });
      }
    } catch (error: any) {
      console.error("Error connecting bank:", error);
      showError(error.response?.data?.message || `Failed to connect to ${bank.name}`);
    } finally {
      setConnecting(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading banks...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Select Your Bank
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Bank List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Choose your bank to connect your account securely
        </Text>

        <View style={styles.bankList}>
          {banks.map((bank) => (
            <TouchableOpacity
              key={bank.id}
              style={[
                styles.bankItem,
                { 
                  backgroundColor: colors.background.primary,
                  opacity: bank.isSupported ? 1 : 0.6
                }
              ]}
              onPress={() => handleBankSelect(bank)}
              disabled={connecting === bank.id || !bank.isSupported}
            >
              <View style={styles.bankInfo}>
                <View
                  style={[
                    styles.bankIcon,
                    { backgroundColor: colors.primary[100] }
                  ]}
                >
                  <Text style={[styles.bankInitial, { color: colors.primary[500] }]}>
                    {bank.name.charAt(0)}
                  </Text>
                </View>
                <Text style={[styles.bankName, { color: colors.text.primary }]}>
                  {bank.name}
                </Text>
              </View>

              {connecting === bank.id ? (
                <ActivityIndicator size="small" color={colors.primary[500]} />
              ) : bank.isSupported ? (
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              ) : (
                <Text style={[styles.comingSoonText, { color: colors.text.tertiary }]}>
                  Coming Soon
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Help Section */}
        <View style={[styles.helpSection, { backgroundColor: colors.background.primary }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
          <Text style={[styles.helpText, { color: colors.text.secondary }]}>
            Your banking credentials are never stored on our servers. We use secure banking APIs to connect your accounts.
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    fontSize: 16,
    marginVertical: spacing.lg,
    textAlign: "center",
  },
  bankList: {
    marginTop: spacing.md,
  },
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  bankInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  bankInitial: {
    fontSize: 20,
    fontWeight: "700",
  },
  bankName: {
    fontSize: 18,
    fontWeight: "600",
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  helpSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: spacing.sm,
  },
});