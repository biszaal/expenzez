import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import { PurchasesPackage } from "react-native-purchases";

const PREMIUM_FEATURES = [
  "Unlimited AI queries & insights",
  "Unlimited budgets & goals",
  "Advanced analytics & trends",
  "Proactive alerts & daily briefs",
  "Export reports (PDF/CSV)",
  "Open Banking integration",
  "Ad-free experience",
  "Priority support",
];

export default function SubscriptionPlansScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const {
    isPremium,
    isLoading,
    subscriptionStatus,
    purchasePackage,
    restorePurchases,
    offerings,
    monthlyPackage,
    annualPackage,
    formatPrice,
    calculateSavings,
    isTrialEligible,
    trialMessage,
  } = useSubscription();

  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  // Auto-select annual package (most popular)
  useEffect(() => {
    if (!selectedPackage) {
      setSelectedPackage({ identifier: "annual" } as any);
    }
  }, []);

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert("Error", "Please select a subscription plan.");
      return;
    }

    setPurchasing(true);
    try {

      // Check if we have actual packages from RevenueCat
      const actualPackage =
        selectedPackage.identifier === "monthly"
          ? monthlyPackage
          : annualPackage;

      if (!actualPackage) {
        // We're in Expo Go or RevenueCat isn't configured
        Alert.alert(
          "Subscriptions Not Available",
          "Premium subscriptions are not available in Expo Go.\n\n" +
            "To test subscriptions:\n" +
            "1. Build a development version of the app\n" +
            "2. Use TestFlight or internal testing\n\n" +
            "All other features work normally in Expo Go.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }

      // Proceed with actual purchase
      const result = await purchasePackage(actualPackage);

      if (result.success) {
        Alert.alert(
          "Success!",
          "Welcome to Expenzez Premium! Enjoy all the premium features.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        if (result.error !== "Purchase cancelled") {
          Alert.alert(
            "Purchase Failed",
            result.error || "Something went wrong. Please try again."
          );
        }
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to complete purchase. Please try again."
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    setPurchasing(true);
    try {
      // Check if RevenueCat is available
      if (!monthlyPackage && !annualPackage) {
        Alert.alert(
          "Restore Not Available",
          "Purchase restoration is not available in Expo Go.\n\n" +
            "To restore purchases, please use a production build of the app.",
          [
            {
              text: "OK",
            },
          ]
        );
        return;
      }

      const result = await restorePurchases();

      if (result.success) {
        Alert.alert(
          "Purchases Restored",
          "Your premium subscription has been restored successfully!",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          result.error || "No previous purchases found to restore."
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Restore Failed",
        error.message || "Failed to restore purchases. Please try again."
      );
    } finally {
      setPurchasing(false);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  // Show loading state while fetching packages
  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading subscription options...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If already premium, show subscription status
  if (isPremium) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={colors.text.primary}
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Premium Subscription
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Premium Status */}
          <View style={styles.premiumStatusContainer}>
            <Ionicons
              name="checkmark-circle"
              size={64}
              color={colors.success[500]}
            />
            <Text
              style={[
                styles.premiumStatusTitle,
                { color: colors.text.primary },
              ]}
            >
              You're Premium!
            </Text>
            {subscriptionStatus.isInTrial && trialMessage && (
              <Text
                style={[styles.trialMessage, { color: colors.warning[500] }]}
              >
                {trialMessage}
              </Text>
            )}
            {subscriptionStatus.expiryDate && (
              <Text
                style={[styles.expiryText, { color: colors.text.secondary }]}
              >
                {subscriptionStatus.isCancelled
                  ? `Access until ${subscriptionStatus.expiryDate.toLocaleDateString()}`
                  : `Renews on ${subscriptionStatus.expiryDate.toLocaleDateString()}`}
              </Text>
            )}
          </View>

          {/* Premium Features */}
          <View style={styles.featuresSection}>
            <Text
              style={[
                styles.featuresSectionTitle,
                { color: colors.text.primary },
              ]}
            >
              Your Premium Features
            </Text>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.success[500]}
                />
                <Text
                  style={[styles.featureText, { color: colors.text.secondary }]}
                >
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Restore Purchases */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={purchasing}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color={colors.primary[500]} />
            <Text
              style={[styles.restoreButtonText, { color: colors.primary[500] }]}
            >
              {purchasing ? "Restoring..." : "Restore Purchases"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
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
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Choose Your Plan
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.text.primary }]}>
            Unlock Premium Features
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.text.secondary }]}>
            Get the most out of your financial tracking with our premium
            features
          </Text>
          <View
            style={[
              styles.trialBadge,
              { backgroundColor: colors.success[500] },
            ]}
          >
            <Text style={styles.trialBadgeText}>14-Day Free Trial</Text>
          </View>
        </View>

        {/* Pricing Plans */}
        <View style={styles.pricingSection}>
          {/* Monthly Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              {
                backgroundColor: colors.background.primary,
                borderColor:
                  selectedPackage?.identifier === "monthly"
                    ? colors.primary[500]
                    : colors.border.light,
              },
              selectedPackage?.identifier === "monthly" && styles.selectedPlan,
            ]}
            onPress={() => setSelectedPackage({ identifier: "monthly" } as any)}
          >
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: colors.text.primary }]}>
                Monthly Plan
              </Text>
              <View style={styles.priceContainer}>
                <Text style={[styles.price, { color: colors.text.primary }]}>
                  £4.99
                </Text>
                <Text style={[styles.period, { color: colors.text.secondary }]}>
                  /month
                </Text>
              </View>
            </View>

            <View style={styles.featuresContainer}>
              {PREMIUM_FEATURES.slice(0, 4).map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.success[500]}
                  />
                  <Text
                    style={[
                      styles.featureText,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {/* Annual Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              {
                backgroundColor: colors.background.primary,
                borderColor:
                  selectedPackage?.identifier === "annual"
                    ? colors.primary[500]
                    : colors.border.light,
              },
              selectedPackage?.identifier === "annual" && styles.selectedPlan,
            ]}
            onPress={() => setSelectedPackage({ identifier: "annual" } as any)}
          >
            <View
              style={[
                styles.popularBadge,
                { backgroundColor: colors.primary[500] },
              ]}
            >
              <Text style={styles.popularText}>Most Popular - Save 17%</Text>
            </View>

            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: colors.text.primary }]}>
                Annual Plan
              </Text>
              <View style={styles.priceContainer}>
                <Text style={[styles.price, { color: colors.text.primary }]}>
                  £49.99
                </Text>
                <Text style={[styles.period, { color: colors.text.secondary }]}>
                  /year
                </Text>
              </View>
              <View style={styles.savingsContainer}>
                <Text
                  style={[
                    styles.originalPrice,
                    { color: colors.text.tertiary },
                  ]}
                >
                  £59.88
                </Text>
                <Text style={[styles.savings, { color: colors.success[500] }]}>
                  Save £9.89
                </Text>
              </View>
            </View>

            <View style={styles.featuresContainer}>
              {PREMIUM_FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.success[500]}
                  />
                  <Text
                    style={[
                      styles.featureText,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* Purchase Button */}
        <TouchableOpacity
          style={[
            styles.purchaseButton,
            { backgroundColor: colors.primary[500] },
            purchasing && styles.purchaseButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={purchasing}
          activeOpacity={0.8}
        >
          <Text style={styles.purchaseButtonText}>
            {purchasing ? "Processing..." : "Start Premium"}
          </Text>
        </TouchableOpacity>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={16} color={colors.primary[500]} />
          <Text
            style={[styles.restoreButtonText, { color: colors.primary[500] }]}
          >
            Restore Purchases
          </Text>
        </TouchableOpacity>

        {/* Required Legal Links */}
        <View style={styles.legalSection}>
          <Text style={[styles.legalTitle, { color: colors.text.primary }]}>
            Legal Information
          </Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => Linking.openURL("https://expenzez.com/terms")}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color={colors.primary[500]}
              />
              <Text
                style={[styles.legalLinkText, { color: colors.text.primary }]}
              >
                Terms of Use (EULA)
              </Text>
              <Ionicons
                name="open-outline"
                size={14}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => Linking.openURL("https://expenzez.com/privacy")}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={colors.primary[500]}
              />
              <Text
                style={[styles.legalLinkText, { color: colors.text.primary }]}
              >
                Privacy Policy
              </Text>
              <Ionicons
                name="open-outline"
                size={14}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscription Terms */}
        <View style={styles.termsSection}>
          <Text style={[styles.termsText, { color: colors.text.tertiary }]}>
            Subscription automatically renews unless canceled at least 24 hours
            before the end of the current period. Payment charged to App Store
            account. Manage subscriptions in App Store settings.
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  premiumStatusContainer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: "center",
    gap: 12,
  },
  premiumStatusTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  trialMessage: {
    fontSize: 16,
    fontWeight: "500",
  },
  expiryText: {
    fontSize: 14,
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  featuresSectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  trialBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  trialBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  pricingSection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    position: "relative",
  },
  selectedPlan: {
    borderColor: "#3B82F6",
  },
  popularBadge: {
    position: "absolute",
    top: -8,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: "700",
  },
  period: {
    fontSize: 16,
    marginLeft: 4,
  },
  savingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  savings: {
    fontSize: 14,
    fontWeight: "600",
  },
  featuresContainer: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  purchaseButton: {
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  legalSection: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  legalLinks: {
    gap: 12,
  },
  legalLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  legalLinkText: {
    fontSize: 14,
    flex: 1,
  },
  termsSection: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  setupCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
    gap: 16,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  setupDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  setupSteps: {
    gap: 12,
    marginTop: 8,
    alignSelf: "stretch",
  },
  stepText: {
    fontSize: 13,
    lineHeight: 20,
  },
  setupFooter: {
    fontSize: 12,
    marginTop: 8,
  },
});
