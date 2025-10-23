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
  { icon: "sparkles", label: "Unlimited AI queries & insights", free: false },
  { icon: "wallet-outline", label: "Unlimited budgets & goals", free: false },
  { icon: "analytics", label: "Advanced analytics & trends", free: false },
  { icon: "notifications", label: "Proactive alerts & daily briefs", free: false },
  { icon: "document-outline", label: "Export reports (CSV)", free: false },
  { icon: "shield-checkmark-outline", label: "Advanced security features", free: false },
  { icon: "flash", label: "Priority support", free: false },
  { icon: "trending-up", label: "Custom spending insights", free: false },
];

const FREE_FEATURES = [
  { icon: "chatbubble-outline", label: "10 AI chats per day", free: true },
  { icon: "wallet-outline", label: "5 budgets maximum", free: true },
  { icon: "analytics", label: "Basic analytics", free: true },
  { icon: "notifications", label: "Standard notifications", free: true },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Small Business Owner",
    text: "Premium helped me track expenses like never before. The unlimited budgets alone are worth it!",
    rating: 5,
  },
  {
    name: "James T.",
    role: "Freelancer",
    text: "The AI insights are incredible. It's like having a personal finance advisor in my pocket.",
    rating: 5,
  },
  {
    name: "Emma L.",
    role: "Student",
    text: "Best investment ever. The advanced analytics helped me save £500 last month!",
    rating: 5,
  },
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
            Upgrade to Premium
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Hero Section - Simplified */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.trialBadge,
              { backgroundColor: colors.success[500] + "20" },
            ]}
          >
            <Ionicons name="star" size={16} color={colors.success[500]} />
            <Text style={[styles.trialBadgeText, { color: colors.success[500] }]}>
              Start Your 14-Day Free Trial Now
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text.primary }]}>
            Unlock Unlimited Potential
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.text.secondary }]}>
            Unlimited budgets · 50+ AI chats daily · Advanced analytics · No limits
          </Text>
        </View>

        {/* Pricing Plans - Simplified Selector */}
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
          </TouchableOpacity>
        </View>

        {/* Shared Features List */}
        <View style={[styles.sharedFeaturesSection, { backgroundColor: colors.background.primary }]}>
          <Text style={[styles.featuresSectionTitle, { color: colors.text.primary }]}>
            All Premium Features Included
          </Text>
          <View style={styles.featuresContainer}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary[500] + "20" }]}>
                  <Ionicons
                    name={feature.icon}
                    size={14}
                    color={colors.primary[500]}
                  />
                </View>
                <Text
                  style={[
                    styles.featureText,
                    { color: colors.text.secondary },
                  ]}
                >
                  {feature.label}
                </Text>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success[500]}
                />
              </View>
            ))}
          </View>
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
            {purchasing ? "Processing..." : "Start 14-Day Free Trial"}
          </Text>
        </TouchableOpacity>

        {/* Trial Note */}
        <Text style={[styles.trialNote, { color: colors.text.tertiary }]}>
          Your payment method will be charged £4.99/month after trial ends. Cancel anytime from App Store settings.
        </Text>

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

        {/* Key Benefits - Compact */}
        <View style={[styles.keyBenefitsSection, { backgroundColor: colors.background.primary + "80" }]}>
          <View style={styles.benefitRow}>
            <Ionicons name="sparkles" size={20} color={colors.primary[500]} />
            <Text style={[styles.benefitRowText, { color: colors.text.secondary }]}>
              50+ AI chats every single day
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="wallet-outline" size={20} color={colors.primary[500]} />
            <Text style={[styles.benefitRowText, { color: colors.text.secondary }]}>
              Unlimited budgets & goals
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="analytics" size={20} color={colors.primary[500]} />
            <Text style={[styles.benefitRowText, { color: colors.text.secondary }]}>
              Advanced analytics & reports
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="shield-outline" size={20} color={colors.primary[500]} />
            <Text style={[styles.benefitRowText, { color: colors.text.secondary }]}>
              Secure & private always
            </Text>
          </View>
        </View>

        {/* Money Back Guarantee - Early */}
        <View
          style={[
            styles.guaranteeCard,
            { borderColor: colors.success[500], backgroundColor: colors.success[500] + "10" },
          ]}
        >
          <View style={styles.guaranteeContent}>
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={colors.success[500]}
            />
            <View style={styles.guaranteeText}>
              <Text style={[styles.guaranteeTitle, { color: colors.text.primary }]}>
                30-Day Money Back
              </Text>
              <Text style={[styles.guaranteeDescription, { color: colors.text.secondary }]}>
                Not satisfied? Get a full refund, no questions asked.
              </Text>
            </View>
          </View>
        </View>

        {/* Testimonials Section */}
        <View style={styles.testimonialsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            💬 Users Love Premium
          </Text>
          {TESTIMONIALS.map((testimonial, index) => (
            <View
              key={index}
              style={[
                styles.testimonialCard,
                { backgroundColor: colors.background.primary },
              ]}
            >
              <View style={styles.testimonialHeader}>
                <View>
                  <Text style={[styles.testimonialName, { color: colors.text.primary }]}>
                    {testimonial.name}
                  </Text>
                  <Text style={[styles.testimonialRole, { color: colors.text.tertiary }]}>
                    {testimonial.role}
                  </Text>
                </View>
                <View style={styles.stars}>
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Ionicons key={i} name="star" size={12} color="#FCD34D" />
                  ))}
                </View>
              </View>
              <Text style={[styles.testimonialText, { color: colors.text.secondary }]}>
                "{testimonial.text}"
              </Text>
            </View>
          ))}
        </View>

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
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
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
    paddingVertical: 28,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: "500",
  },
  trialBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
  },
  trialBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  pricingSection: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 8,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    position: "relative",
    opacity: 0.7,
  },
  selectedPlan: {
    borderColor: "#8B5CF6",
    opacity: 1,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  popularText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  planHeader: {
    marginBottom: 0,
  },
  planName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 0,
  },
  price: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  period: {
    fontSize: 15,
    marginLeft: 6,
    fontWeight: "500",
  },
  savingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
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
    gap: 14,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
    fontWeight: "500",
  },
  sharedFeaturesSection: {
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  purchaseButton: {
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  trialNote: {
    fontSize: 11,
    textAlign: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    lineHeight: 16,
    fontWeight: "400",
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
    marginBottom: 20,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
    letterSpacing: 0.1,
  },
  legalLinks: {
    gap: 12,
  },
  legalLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  legalLinkText: {
    fontSize: 14,
    flex: 1,
    fontWeight: "500",
  },
  termsSection: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  termsText: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    fontWeight: "400",
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
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    backgroundColor: "rgba(59, 130, 246, 0.05)",
  },
  statItem: {
    alignItems: "center",
    gap: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  upgradeHint: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
  keyBenefitsSection: {
    marginHorizontal: 20,
    marginVertical: 20,
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderRadius: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  benefitRowText: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  testimonialsSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  testimonialCard: {
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  testimonialHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  testimonialName: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  stars: {
    flexDirection: "row",
    gap: 3,
  },
  testimonialRole: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
  },
  testimonialText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
  },
  whyPremiumSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  benefitsGrid: {
    gap: 16,
  },
  benefitItem: {
    alignItems: "center",
    gap: 12,
  },
  benefitIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  benefitText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  guaranteeCard: {
    marginHorizontal: 20,
    marginVertical: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  guaranteeContent: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  guaranteeText: {
    flex: 1,
    gap: 6,
  },
  guaranteeTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  guaranteeDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "400",
  },
});
