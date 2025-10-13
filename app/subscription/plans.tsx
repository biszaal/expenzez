import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useTheme } from "../../contexts/ThemeContext";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { spacing, borderRadius, typography } from "../../constants/theme";

interface PremiumFeature {
  icon: string;
  title: string;
  description: string;
  freeLimit?: string;
  premiumLimit: string;
}

const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    icon: "cash",
    title: "Save £200+ Monthly",
    description: "AI insights that help you cut unnecessary spending",
    freeLimit: "No savings insights",
    premiumLimit: "Average user saves £2,400/year",
  },
  {
    icon: "shield-checkmark",
    title: "Bank-Level Security",
    description: "Protect your financial data with military-grade encryption",
    freeLimit: "Basic security",
    premiumLimit: "Never worry about data breaches",
  },
  {
    icon: "trending-up",
    title: "Smart Bill Predictions",
    description: "Never miss a payment or pay late fees again",
    freeLimit: "Manual tracking",
    premiumLimit: "Save £50+ on late fees monthly",
  },
  {
    icon: "analytics",
    title: "Personalized Budgets",
    description: "AI creates budgets that actually work for your lifestyle",
    freeLimit: "Generic budgets",
    premiumLimit: "Stick to budgets 3x better than manual tracking",
  },
  {
    icon: "analytics",
    title: "Advanced Analytics & Insights",
    description: "Detailed spending patterns, trends, and predictive analytics",
    freeLimit: "Basic charts only",
    premiumLimit: "Full analytics suite",
  },
  {
    icon: "pricetags",
    title: "AI Transaction Categorization",
    description: "Automatic smart categorization of all your transactions",
    freeLimit: "Basic categories",
    premiumLimit: "AI-powered categorization",
  },
];

const PRICING_PLANS = [
  {
    id: "premium-monthly",
    name: "Monthly",
    price: 4.99,
    originalPrice: null,
    interval: "month",
    popular: false,
    savings: null,
  },
  {
    id: "premium-annual",
    name: "Annual",
    price: 49.99,
    originalPrice: 59.88,
    interval: "year",
    popular: true,
    savings: "17% off",
  },
];

export default function SubscriptionPlansScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    subscription,
    isPremium,
    isTrialActive,
    daysUntilTrialExpires,
    purchaseSubscription,
    restorePurchases,
    refreshSubscription,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState("premium-annual");
  const [purchasing, setPurchasing] = useState(false);
  const showTrialButton = false; // Disable separate trial button - trials handled through regular purchase flow

  // Log subscription screen load
  useEffect(() => {
    console.log("📱 [SubscriptionPlans] Subscription screen loaded");
  }, []);

  const handleStartTrial = async () => {
    setPurchasing(true);
    try {
      // Use RevenueCat to start trial - this will go through Apple's payment system
      // and set up automatic recurring subscription after trial ends
      const success = await handlePurchase(); // Use the same purchase flow as regular subscription

      // No need for separate trial logic - RevenueCat handles trial period automatically
      // if your subscription products in App Store Connect are configured with free trials
    } catch (error) {
      console.error("❌ [SubscriptionPlans] Trial error:", error);
      Alert.alert("Error", "Failed to start trial. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    setPurchasing(true);
    try {
      const success = await restorePurchases();
      if (success) {
        Alert.alert(
          "✅ Purchases Restored!",
          "Your previous purchases have been successfully restored.",
          [
            {
              text: "Continue",
              onPress: () => router.push("/(tabs)"),
              style: "default",
            },
          ]
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          "We could not find any previous purchases to restore.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      // Map local plan ID to RevenueCat package ID (must match App Store Connect product IDs)
      const packageId =
        selectedPlan === "premium-annual"
          ? "expenzez_premium_annual"
          : "expenzez_premium_monthly";

      console.log(
        "🛒 [SubscriptionPlans] Starting native purchase:",
        packageId
      );

      const success = await purchaseSubscription(packageId);

      if (success) {
        // Force refresh subscription state
        console.log(
          "🔄 [SubscriptionPlans] Purchase successful, refreshing subscription state..."
        );
        await refreshSubscription();

        // Small delay to ensure state propagates
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log(
          "✅ [SubscriptionPlans] Subscription refreshed, showing success message"
        );

        Alert.alert(
          "🚀 Welcome to Premium!",
          "Thank you for your purchase! You now have unlimited access to all premium features.",
          [
            {
              text: "Get Started",
              onPress: () => {
                // Reload the subscription page when user returns
                router.push("/(tabs)");
              },
              style: "default",
            },
          ]
        );
      } else {
        Alert.alert(
          "Purchase Failed",
          "There was an issue processing your purchase. Please try again.",
          [{ text: "Try Again" }]
        );
      }
    } catch (error: any) {
      console.error("❌ [SubscriptionPlans] Purchase error:", error);
      const errorMessage =
        error?.userFriendlyMessage ||
        error?.message ||
        "Failed to process purchase. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setPurchasing(false);
    }
  };

  const selectedPlanData = PRICING_PLANS.find((p) => p.id === selectedPlan);

  // Helper functions
  const formatExpirationDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "today";
    } else if (diffDays === 1) {
      return "tomorrow";
    } else if (diffDays <= 7) {
      return `in ${diffDays} days`;
    } else if (diffDays <= 30) {
      return `on ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    } else {
      return `on ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium Membership</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.heroContent}>
              <View style={styles.heroIconContainer}>
                <Ionicons
                  name="diamond"
                  size={48}
                  color={colors.primary[500]}
                />
              </View>
              <Text style={styles.heroTitle}>Save £2,400+ Per Year</Text>
              <Text style={styles.heroSubtitle}>
                Take control of your finances with AI-powered insights
              </Text>
              <View
                style={[
                  styles.guaranteeBadge,
                  { backgroundColor: colors.background.secondary },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color={colors.success[600]}
                />
                <Text
                  style={[
                    styles.guaranteeText,
                    { color: colors.text.secondary },
                  ]}
                >
                  30-day money-back guarantee
                </Text>
              </View>
            </View>
          </View>

          {/* Pricing Section - Moved to top */}
          {!isPremium && (
            <View style={styles.pricingSection}>
              <Text style={styles.sectionTitle}>
                Less Than a Coffee Per Day
              </Text>
              <Text style={styles.pricingSectionSubtitle}>
                Start your free trial - cancel anytime
              </Text>

              <View style={styles.pricingCards}>
                {PRICING_PLANS.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.pricingCard,
                      selectedPlan === plan.id && styles.selectedPricingCard,
                      plan.popular && styles.popularCard,
                    ]}
                    onPress={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <Ionicons
                          name="star"
                          size={12}
                          color="white"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.popularBadgeText}>Best Value</Text>
                      </View>
                    )}

                    <View style={styles.pricingCardHeader}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {plan.savings && (
                        <View style={styles.savingsContainer}>
                          <Text style={styles.savingsText}>{plan.savings}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.priceContainer}>
                      <Text style={styles.currencySymbol}>£</Text>
                      <Text style={styles.price}>{plan.price}</Text>
                      <Text style={styles.priceInterval}>/{plan.interval}</Text>
                    </View>

                    {plan.originalPrice && (
                      <View style={styles.originalPriceContainer}>
                        <Text style={styles.originalPrice}>
                          £{plan.originalPrice}
                        </Text>
                        <Text style={styles.savingsAmount}>
                          Save £{plan.originalPrice - plan.price}
                        </Text>
                      </View>
                    )}

                    <Text style={styles.monthlyEquivalent}>
                      £{plan.id === "premium-annual" ? "4.17" : "4.99"}/month
                    </Text>

                    {selectedPlan === plan.id && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={colors.primary[500]}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Current Status Banner */}
          {isPremium && !isTrialActive && (
            <View
              style={[
                styles.statusBanner,
                { backgroundColor: colors.success[100] },
              ]}
            >
              <View style={styles.statusContent}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success[600]}
                />
                <View style={styles.statusTextContainer}>
                  <Text
                    style={[styles.statusText, { color: colors.success[700] }]}
                  >
                    You&apos;re Premium! Enjoy unlimited access 🎉
                  </Text>
                  {subscription.endDate && (
                    <Text
                      style={[
                        styles.statusSubtext,
                        { color: colors.success[600] },
                      ]}
                    >
                      {subscription.tier === "premium-annual"
                        ? "Annual"
                        : "Monthly"}{" "}
                      plan • Renews {formatExpirationDate(subscription.endDate)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {isTrialActive && (
            <View
              style={[
                styles.statusBanner,
                {
                  backgroundColor:
                    daysUntilTrialExpires <= 3
                      ? colors.error[100]
                      : colors.warning[100],
                },
              ]}
            >
              <View style={styles.statusContent}>
                <Ionicons
                  name={daysUntilTrialExpires <= 3 ? "warning" : "time"}
                  size={24}
                  color={
                    daysUntilTrialExpires <= 3
                      ? colors.error[600]
                      : colors.warning[600]
                  }
                />
                <View style={styles.statusTextContainer}>
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          daysUntilTrialExpires <= 3
                            ? colors.error[700]
                            : colors.warning[700],
                      },
                    ]}
                  >
                    {daysUntilTrialExpires <= 3
                      ? "⚠️ Trial Ending Soon"
                      : "🆓 Free Trial Active"}
                  </Text>
                  <Text
                    style={[
                      styles.statusSubtext,
                      {
                        color:
                          daysUntilTrialExpires <= 3
                            ? colors.error[600]
                            : colors.warning[600],
                      },
                    ]}
                  >
                    {daysUntilTrialExpires === 0
                      ? "Expires today"
                      : daysUntilTrialExpires === 1
                        ? "Expires tomorrow"
                        : `${daysUntilTrialExpires} days remaining`}{" "}
                    •{" "}
                    {subscription.trialEndDate
                      ? formatExpirationDate(subscription.trialEndDate)
                      : "No end date"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Urgent Trial Expiration Warning */}
          {isTrialActive && daysUntilTrialExpires <= 3 && (
            <View
              style={[
                styles.urgentBanner,
                { backgroundColor: colors.error[100] },
              ]}
            >
              <View style={styles.statusContent}>
                <Ionicons name="flash" size={24} color={colors.error[600]} />
                <View style={styles.statusTextContainer}>
                  <Text
                    style={[styles.urgentText, { color: colors.error[700] }]}
                  >
                    Don&apos;t Lose Your Premium Features!
                  </Text>
                  <Text
                    style={[styles.urgentSubtext, { color: colors.error[600] }]}
                  >
                    Your trial ends{" "}
                    {daysUntilTrialExpires === 0
                      ? "today"
                      : daysUntilTrialExpires === 1
                        ? "tomorrow"
                        : `in ${daysUntilTrialExpires} days`}
                    . Upgrade now to continue unlimited access to all features.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Risk Reversal */}
          <View style={styles.riskReversal}>
            <View
              style={[
                styles.guaranteeCard,
                { backgroundColor: colors.background.secondary },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={24}
                color={colors.success[600]}
              />
              <View style={styles.guaranteeContent}>
                <Text
                  style={[
                    styles.guaranteeTitle,
                    { color: colors.text.primary },
                  ]}
                >
                  30-Day Money-Back Guarantee
                </Text>
                <Text
                  style={[
                    styles.guaranteeDescription,
                    { color: colors.text.secondary },
                  ]}
                >
                  If you don't save at least £50 in your first month, we'll
                  refund you completely.
                </Text>
              </View>
            </View>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>How You'll Save Money</Text>
            <Text style={styles.sectionSubtitle}>
              Real benefits that put money back in your pocket
            </Text>

            <View style={styles.featuresGrid}>
              {PREMIUM_FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={styles.featureIcon}>
                    <Ionicons
                      name={feature.icon as any}
                      size={24}
                      color={colors.primary[500]}
                    />
                  </View>

                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>
                      {feature.description}
                    </Text>

                    <View style={styles.featureLimits}>
                      <View style={styles.limitRow}>
                        <View style={styles.freeTag}>
                          <Text style={styles.freeTagText}>Free</Text>
                        </View>
                        <Text style={styles.limitText}>
                          {feature.freeLimit || "Not available"}
                        </Text>
                      </View>

                      <View style={styles.limitRow}>
                        <View style={styles.premiumTag}>
                          <Text style={styles.premiumTagText}>Premium</Text>
                        </View>
                        <Text style={styles.limitText}>
                          {feature.premiumLimit}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Required Legal Links */}
          <View style={styles.legalSection}>
            <Text style={styles.legalTitle}>Legal Information</Text>
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
                <Text style={styles.legalLinkText}>Terms of Use (EULA)</Text>
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
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
                <Ionicons
                  name="open-outline"
                  size={14}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      {!isPremium && (
        <View style={styles.floatingFooter}>
          {showTrialButton && (
            <TouchableOpacity
              style={[
                styles.trialButton,
                { backgroundColor: colors.primary[600] },
              ]}
              onPress={handleStartTrial}
              disabled={purchasing}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="flash" size={20} color="white" />
                <Text style={styles.trialButtonText}>
                  {purchasing ? "Starting Trial..." : "Start 14-Day Free Trial"}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Single Native Payment Button */}
          <TouchableOpacity
            style={[
              styles.upgradeButton,
              !showTrialButton && styles.primaryButton,
              { backgroundColor: colors.primary[600] },
            ]}
            onPress={handlePurchase}
            disabled={purchasing || !selectedPlanData}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="diamond" size={20} color="white" />
              <Text style={styles.upgradeButtonText}>
                {purchasing
                  ? "Processing..."
                  : `Start 14-Day Free Trial - £${selectedPlanData?.price}/${selectedPlanData?.interval}`}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </View>
          </TouchableOpacity>

          <Text style={styles.disclaimerText}>
            Free for 14 days, then auto-renews at £{selectedPlanData?.price}/
            {selectedPlanData?.interval}. Cancel anytime in Settings.
          </Text>

          {/* Restore Purchases Button */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={purchasing}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color={colors.primary[500]} />
            <Text style={styles.restoreButtonText}>
              {purchasing ? "Restoring..." : "Restore Purchases"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

interface ThemeColors {
  background: { primary: string; secondary: string; tertiary: string };
  border: { light: string; medium: string; dark: string; focus: string };
  text: { primary: string; secondary: string; tertiary: string };
  primary: { [key: string]: string };
  success: { [key: string]: string };
  warning: { [key: string]: string };
  [key: string]: any;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background.secondary,
      alignItems: "center",
      justifyContent: "center",
    },

    headerTitle: {
      fontSize: typography.sizes.xl,
      fontWeight: "700" as any,
      color: colors.text.primary,
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      paddingBottom: 200, // Add bottom padding to account for floating footer
    },

    heroSection: {
      margin: 20,
      padding: 16,
      borderRadius: 8,
      backgroundColor: colors.background.secondary,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border.light,
    },

    heroContent: {
      alignItems: "center",
    },

    heroIconContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary[50],
    },

    sparkleOverlay: {
      position: "absolute",
      width: 120,
      height: 120,
      alignItems: "center",
      justifyContent: "center",
    },

    sparkle1: {
      position: "absolute",
      top: 10,
      right: 15,
    },

    sparkle2: {
      position: "absolute",
      bottom: 15,
      left: 10,
    },

    sparkle3: {
      position: "absolute",
      top: 20,
      left: 20,
    },

    heroTitle: {
      fontSize: 20,
      fontWeight: "600" as any,
      color: colors.text.primary,
      marginBottom: 8,
      textAlign: "center",
    },

    heroSubtitle: {
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 16,
      opacity: 0.7,
    },

    statusBanner: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderRadius: borderRadius.lg,
      overflow: "hidden",
    },

    statusContent: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.md,
    },

    statusText: {
      fontSize: typography.sizes.base,
      fontWeight: "600" as any,
      marginLeft: spacing.sm,
    },

    pricingSection: {
      margin: 20,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "600" as any,
      color: colors.text.primary,
      marginBottom: 8,
      textAlign: "center",
    },

    sectionSubtitle: {
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: "center",
      marginBottom: 16,
      lineHeight: 18,
      opacity: 0.7,
    },

    pricingSectionSubtitle: {
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: "center",
      marginBottom: 16,
      lineHeight: 18,
      opacity: 0.7,
    },

    pricingCards: {
      flexDirection: "row",
      gap: 12,
    },

    pricingCard: {
      flex: 1,
      backgroundColor: colors.background.secondary,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border.light,
      position: "relative",
    },

    selectedPricingCard: {
      borderColor: colors.primary[500],
      backgroundColor: colors.primary[50],
    },

    popularCard: {
      borderColor: colors.primary[600],
    },

    popularBadge: {
      position: "absolute",
      top: -6,
      left: 16,
      backgroundColor: colors.primary[600],
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      flexDirection: "row",
      alignItems: "center",
    },

    popularBadgeText: {
      fontSize: 10,
      fontWeight: "600" as any,
      color: "white",
    },

    pricingCardHeader: {
      alignItems: "center",
      marginBottom: spacing.md,
    },

    planName: {
      fontSize: typography.sizes.lg,
      fontWeight: "700" as any,
      color: colors.text.primary,
    },

    savingsContainer: {
      backgroundColor: colors.success[100],
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
      marginTop: spacing.xs,
    },

    savingsText: {
      fontSize: typography.sizes.sm,
      fontWeight: "700" as any,
      color: colors.success[700],
    },

    priceContainer: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "center",
      marginBottom: spacing.xs,
    },

    currencySymbol: {
      fontSize: typography.sizes.lg,
      fontWeight: "600" as any,
      color: colors.text.primary,
      marginRight: 2,
    },

    price: {
      fontSize: typography.sizes["3xl"],
      fontWeight: "800" as any,
      color: colors.text.primary,
    },

    priceInterval: {
      fontSize: typography.sizes.base,
      color: colors.text.secondary,
      marginLeft: spacing.xs,
      fontWeight: "500" as any,
    },

    originalPriceContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },

    originalPrice: {
      fontSize: typography.sizes.sm,
      color: colors.text.secondary,
      textDecorationLine: "line-through",
    },

    savingsAmount: {
      fontSize: typography.sizes.sm,
      color: colors.success[600],
      fontWeight: "600" as any,
    },

    monthlyEquivalent: {
      fontSize: typography.sizes.sm,
      color: colors.text.secondary,
      textAlign: "center",
    },

    selectedIndicator: {
      position: "absolute",
      top: spacing.md,
      right: spacing.md,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.background.secondary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary[500],
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },

    featuresSection: {
      margin: 20,
    },

    featuresGrid: {
      gap: 12,
    },

    featureCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: 8,
      padding: 12,
      flexDirection: "row",
      alignItems: "flex-start",
      minHeight: 80,
      borderWidth: 1,
      borderColor: colors.border.light,
    },

    featureIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary[50],
      alignItems: "center",
      justifyContent: "center",
    },

    featureContent: {
      flex: 1,
      marginLeft: 12,
    },

    featureTitle: {
      fontSize: 14,
      fontWeight: "500" as any,
      color: colors.text.primary,
      marginBottom: 4,
      lineHeight: 18,
    },

    featureDescription: {
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 16,
      marginBottom: 8,
      flexWrap: "wrap",
      opacity: 0.7,
    },

    featureLimits: {
      gap: 4,
    },

    limitRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    freeTag: {
      backgroundColor: colors.text.tertiary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      minWidth: 50,
      alignItems: "center",
      marginRight: 8,
    },

    freeTagText: {
      fontSize: 10,
      fontWeight: "500" as any,
      color: "white",
    },

    premiumTag: {
      backgroundColor: colors.primary[500],
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      minWidth: 50,
      alignItems: "center",
      marginRight: 8,
    },

    premiumTagText: {
      fontSize: 10,
      fontWeight: "500" as any,
      color: "white",
    },

    limitText: {
      fontSize: 10,
      color: colors.text.secondary,
      flex: 1,
      marginLeft: 8,
      lineHeight: 14,
      opacity: 0.7,
    },

    actionSection: {
      margin: 20,
      gap: 12,
    },

    trialButton: {
      borderRadius: 8,
      overflow: "hidden",
    },

    upgradeButton: {
      borderRadius: 8,
      overflow: "hidden",
    },

    primaryButton: {
      marginTop: 12,
    },

    buttonContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 20,
      gap: 8,
    },

    trialButtonText: {
      fontSize: 16,
      fontWeight: "600" as any,
      color: "white",
    },

    upgradeButtonText: {
      fontSize: 14,
      fontWeight: "500" as any,
      color: "white",
      flex: 1,
      textAlign: "center",
    },

    disclaimerText: {
      fontSize: 12,
      color: colors.text.secondary,
      textAlign: "center",
      marginTop: 12,
      lineHeight: 16,
      opacity: 0.7,
    },

    bottomSpacer: {
      height: spacing.xl,
    },

    legalSection: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      padding: spacing.md,
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
    },

    legalTitle: {
      fontSize: typography.sizes.sm,
      fontWeight: "600" as any,
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },

    legalLinks: {
      gap: spacing.sm,
    },

    legalLink: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },

    legalLinkText: {
      flex: 1,
      fontSize: typography.sizes.sm,
      fontWeight: "500" as any,
      color: colors.text.primary,
      marginLeft: spacing.sm,
    },

    restoreButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginTop: spacing.sm,
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },

    restoreButtonText: {
      fontSize: typography.sizes.sm,
      fontWeight: "500" as any,
      color: colors.primary[500],
      marginLeft: spacing.xs,
    },

    floatingFooter: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background.primary,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      shadowColor: colors.primary[500],
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
      gap: spacing.md,
    },

    // Status text container styles
    statusTextContainer: {
      flex: 1,
      marginLeft: spacing.sm,
    },

    statusSubtext: {
      fontSize: typography.sizes.sm,
      marginTop: spacing.xs,
    },

    // Urgent banner styles
    urgentBanner: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      borderRadius: borderRadius.lg,
      overflow: "hidden",
    },

    urgentText: {
      fontSize: typography.sizes.base,
      fontWeight: "700" as any,
    },

    urgentSubtext: {
      fontSize: typography.sizes.sm,
      marginTop: spacing.xs,
    },

    guaranteeBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginTop: 12,
    },
    guaranteeText: {
      fontSize: 12,
      fontWeight: "500" as any,
      marginLeft: 6,
      opacity: 0.8,
    },
    riskReversal: {
      marginHorizontal: 20,
      marginBottom: 20,
    },
    guaranteeCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    guaranteeContent: {
      flex: 1,
      marginLeft: 8,
    },
    guaranteeTitle: {
      fontSize: 14,
      fontWeight: "500" as any,
      marginBottom: 4,
      color: colors.text.primary,
    },
    guaranteeDescription: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.text.secondary,
      opacity: 0.7,
    },
  });
