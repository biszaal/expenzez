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
import { fontFamily } from "../../constants/theme";
import { useAuth } from "../auth/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import { useRevenueCat } from "../../contexts/RevenueCatContext";
import { PurchasesPackage } from "react-native-purchases";

const PREMIUM_FEATURES = [
  {
    icon: "sparkles",
    title: "Unlimited AI conversations",
    description: "Personalized money advice anytime",
  },
  {
    icon: "analytics",
    title: "Advanced spending insights",
    description: "Forecasts, trends, anomaly alerts",
  },
  {
    icon: "wallet-outline",
    title: "Unlimited budgets & goals",
    description: "Track every category and target",
  },
  {
    icon: "document-outline",
    title: "Statement & CSV imports",
    description: "15 imports per month, auto-categorized",
  },
  {
    icon: "notifications",
    title: "Proactive alerts & daily briefs",
    description: "Know what changed without opening the app",
  },
  {
    icon: "trending-up",
    title: "Custom spending insights",
    description: "Patterns surfaced from your transactions",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Advanced security features",
    description: "Biometric + PIN protection",
  },
  {
    icon: "download-outline",
    title: "Export reports (CSV)",
    description: "Take your data with you",
  },
  {
    icon: "flash",
    title: "Priority support",
    description: "Faster replies when you need help",
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
  const {
    isPro: isPremiumFromRC,
    subscriptionExpiryDate,
    isInTrialPeriod,
    customerInfo,
    syncSubscription,
  } = useRevenueCat();
  const { user } = useAuth();

  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [syncing, setSyncing] = useState(false);

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

  const handleSyncSubscription = async () => {
    if (!user?.userId) {
      Alert.alert("Error", "User ID not found. Please log in again.");
      return;
    }

    setSyncing(true);
    try {
      const success = await syncSubscription(user.userId);

      if (success) {
        Alert.alert(
          "Sync Complete",
          "Your subscription status has been synced from RevenueCat successfully!"
        );
      } else {
        Alert.alert(
          "Sync Failed",
          "Failed to sync subscription status. Please try again."
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Sync Error",
        error.message || "Failed to sync subscription. Please try again."
      );
    } finally {
      setSyncing(false);
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
          <ActivityIndicator size="large" color={colors.primary.main} />
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
              style={[
                styles.backButton,
                {
                  backgroundColor: colors.card.background,
                  borderColor: colors.border.medium,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderRadius: 14,
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                },
              ]}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.headerTitle,
                { color: colors.text.primary, fontFamily: fontFamily.semibold },
              ]}
            >
              Subscription
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Premium Status */}
          <View style={styles.premiumStatusContainer}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.posBg,
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={42}
                color={colors.lime[500]}
              />
            </View>
            <Text
              style={[
                styles.premiumStatusTitle,
                { color: colors.text.primary, fontFamily: fontFamily.semibold },
              ]}
            >
              You&apos;re Premium
              <Text style={{ color: colors.primary[500] }}>.</Text>
            </Text>
            {(() => {
              // Get expiry date from RevenueCat context (more reliable) or subscriptionStatus
              const expiryDate =
                subscriptionExpiryDate || subscriptionStatus.expiryDate;
              // Get trial status from RevenueCat context or subscriptionStatus
              const inTrial =
                isInTrialPeriod !== undefined
                  ? isInTrialPeriod
                  : subscriptionStatus.isInTrial;
              // Get cancellation status from customerInfo (willRenew = false means cancelled)
              const premiumEntitlement =
                customerInfo?.entitlements?.active?.["premium"] ||
                customerInfo?.entitlements?.active?.["Premium"];
              const willRenew = premiumEntitlement?.willRenew ?? true;
              const isCancelled = !willRenew;

              // Debug logging (outside JSX)
              if (__DEV__) {
                console.log("[Subscription Plans] Subscription info:", {
                  expiryDateFromRC: subscriptionExpiryDate?.toISOString(),
                  expiryDateFromStatus:
                    subscriptionStatus.expiryDate?.toISOString(),
                  finalExpiryDate: expiryDate?.toISOString(),
                  inTrial,
                  willRenew,
                  isCancelled,
                  hasCustomerInfo: !!customerInfo,
                });
              }

              if (!expiryDate) {
                return (
                  <Text
                    style={[
                      styles.expiryText,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Active Premium Subscription
                  </Text>
                );
              }

              const formattedDate = expiryDate.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              if (inTrial) {
                return (
                  <Text
                    style={[
                      styles.expiryText,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {isCancelled
                      ? `Trial ends on ${formattedDate}`
                      : `Trial renews on ${formattedDate}`}
                  </Text>
                );
              }

              return (
                <Text
                  style={[styles.expiryText, { color: colors.text.secondary }]}
                >
                  {isCancelled
                    ? `Plan ends on ${formattedDate}`
                    : `Auto renew on ${formattedDate}`}
                </Text>
              );
            })()}
          </View>

          {/* Subscription Details */}
          <View style={[styles.detailsCard, { backgroundColor: colors.background.primary }]}>
            <Text style={[styles.detailsTitle, { color: colors.text.primary }]}>
              Subscription Details
            </Text>

            {(() => {
              const premiumEntitlement =
                customerInfo?.entitlements?.active?.["premium"] ||
                customerInfo?.entitlements?.active?.["Premium"];
              const productId = premiumEntitlement?.productIdentifier || "";
              const willRenew = premiumEntitlement?.willRenew ?? true;
              const expiryDate = subscriptionExpiryDate || subscriptionStatus.expiryDate;
              const inTrial = isInTrialPeriod !== undefined ? isInTrialPeriod : subscriptionStatus.isInTrial;

              // Determine tier and price
              let tier = "Premium";
              let price = "";
              if (productId.includes("monthly")) {
                tier = "Monthly Plan";
                price = "£4.99/month";
              } else if (productId.includes("annual") || productId.includes("yearly")) {
                tier = "Annual Plan";
                price = "£49.99/year";
              }

              return (
                <>
                  {/* Subscription Tier */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelContainer}>
                      <Ionicons name="pricetag" size={16} color={colors.text.secondary} />
                      <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                        Plan
                      </Text>
                    </View>
                    <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                      {tier}
                    </Text>
                  </View>

                  {/* Price */}
                  {price && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailLabelContainer}>
                        <Ionicons name="card" size={16} color={colors.text.secondary} />
                        <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                          Price
                        </Text>
                      </View>
                      <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                        {price}
                      </Text>
                    </View>
                  )}

                  {/* Status */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelContainer}>
                      <Ionicons name="information-circle" size={16} color={colors.text.secondary} />
                      <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                        Status
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: inTrial ? colors.warning.main : colors.success.main }
                      ]} />
                      <Text style={[
                        styles.detailValue,
                        { color: inTrial ? colors.warning.main : colors.success.main }
                      ]}>
                        {inTrial ? "Free Trial" : "Active"}
                      </Text>
                    </View>
                  </View>

                  {/* Renewal Status */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelContainer}>
                      <Ionicons name="sync" size={16} color={colors.text.secondary} />
                      <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                        Auto-Renewal
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: willRenew ? colors.success.main : colors.error.main }
                      ]} />
                      <Text style={[
                        styles.detailValue,
                        { color: willRenew ? colors.success.main : colors.error.main }
                      ]}>
                        {willRenew ? "Enabled" : "Disabled"}
                      </Text>
                    </View>
                  </View>

                  {/* Next Billing/End Date */}
                  {expiryDate && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailLabelContainer}>
                        <Ionicons name="calendar" size={16} color={colors.text.secondary} />
                        <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                          {willRenew ? "Next Billing" : "Ends On"}
                        </Text>
                      </View>
                      <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                        {expiryDate.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                  )}
                </>
              );
            })()}
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
                  color={colors.success.main}
                />
                <Text
                  style={[styles.featureText, { color: colors.text.secondary }]}
                >
                  {feature.title}
                </Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {/* Sync Subscription */}
            <TouchableOpacity
              style={[styles.syncButton, { borderColor: colors.primary.main }]}
              onPress={handleSyncSubscription}
              disabled={syncing}
              activeOpacity={0.8}
            >
              <Ionicons
                name={syncing ? "sync" : "cloud-download"}
                size={16}
                color={colors.primary.main}
              />
              <Text style={[styles.syncButtonText, { color: colors.primary.main }]}>
                {syncing ? "Syncing..." : "Sync Subscription"}
              </Text>
            </TouchableOpacity>

            {/* Manage Subscription */}
            <TouchableOpacity
              style={[styles.manageButton, { backgroundColor: colors.primary.main }]}
              onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
              activeOpacity={0.8}
            >
              <Text style={styles.manageButtonText}>
                Manage Subscription
              </Text>
              <Ionicons name="open-outline" size={16} color="white" />
            </TouchableOpacity>

            {/* Restore Purchases */}
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestorePurchases}
              disabled={purchasing}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color={colors.primary.main} />
              <Text
                style={[styles.restoreButtonText, { color: colors.primary.main }]}
              >
                {purchasing ? "Restoring..." : "Restore Purchases"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Live prices from RevenueCat when available, current production prices
  // as fallback so the screen always shows something sensible even before
  // offerings load (or on offline first-render).
  const monthlyPriceNum =
    (monthlyPackage as any)?.product?.price ?? 4.99;
  const annualPriceNum =
    (annualPackage as any)?.product?.price ?? 49.99;
  const monthlyDisplay =
    (monthlyPackage as any)?.product?.priceString || "£4.99";
  const annualDisplay =
    (annualPackage as any)?.product?.priceString || "£49.99";
  const annualPerMonthDisplay = `£${(annualPriceNum / 12).toFixed(2)}`;
  // Strikethrough anchor: what 12 months of monthly billing would cost.
  const annualOriginalDisplay = `£${(monthlyPriceNum * 12).toFixed(2)}`;
  const isAnnualSelected = selectedPackage?.identifier === "annual";

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.primary },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimal header — just a back button */}
        <View style={styles.headerMinimal}>
          <TouchableOpacity
            style={[
              styles.backButtonRound,
              {
                backgroundColor: colors.card.background,
                borderColor: colors.border.medium,
              },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.heroSectionV2}>
          <View
            style={[styles.proPill, { backgroundColor: colors.posBg }]}
          >
            <Ionicons name="sparkles" size={12} color={colors.lime[500]} />
            <Text
              style={[
                styles.proPillText,
                { color: colors.lime[500], fontFamily: fontFamily.bold },
              ]}
            >
              EXPENZEZ PRO
            </Text>
          </View>
          <Text
            style={[
              styles.heroTitleV2,
              { color: colors.text.primary, fontFamily: fontFamily.semibold },
            ]}
          >
            Master your{"\n"}money, faster
            <Text style={{ color: colors.primary[500] }}>.</Text>
          </Text>
          <Text
            style={[
              styles.heroSubtitleV2,
              { color: colors.text.secondary, fontFamily: fontFamily.medium },
            ]}
          >
            Save an average of{" "}
            <Text
              style={{
                color: colors.lime[500],
                fontFamily: fontFamily.bold,
              }}
            >
              £87/month
            </Text>
            {" "}with Pro.
          </Text>
        </View>

        {/* Plan cards (stacked) */}
        <View style={styles.plansContainerV2}>
          {/* Yearly */}
          <TouchableOpacity
            style={[
              styles.planCardV2,
              {
                backgroundColor: colors.card.background,
                borderColor: isAnnualSelected
                  ? colors.primary.main
                  : colors.border.light,
                borderWidth: isAnnualSelected ? 2 : 1,
              },
              isAnnualSelected && styles.planCardV2Selected,
            ]}
            onPress={() =>
              setSelectedPackage({ identifier: "annual" } as any)
            }
            activeOpacity={0.85}
          >
            <View
              style={[styles.savePill, { backgroundColor: colors.lime[500] }]}
            >
              <Text
                style={[
                  styles.savePillText,
                  { fontFamily: fontFamily.bold },
                ]}
              >
                SAVE 40%
              </Text>
            </View>
            <View style={styles.planRow}>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: isAnnualSelected
                      ? colors.primary.main
                      : colors.border.medium,
                  },
                ]}
              >
                {isAnnualSelected && (
                  <View
                    style={[
                      styles.radioDot,
                      { backgroundColor: colors.primary.main },
                    ]}
                  />
                )}
              </View>
              <View style={styles.planMiddle}>
                <Text
                  style={[
                    styles.planTitleV2,
                    {
                      color: colors.text.primary,
                      fontFamily: fontFamily.semibold,
                    },
                  ]}
                >
                  Yearly
                </Text>
                <View style={styles.planSubRow}>
                  <Text
                    style={[
                      styles.planOriginalPriceV2,
                      { color: colors.text.tertiary },
                    ]}
                  >
                    {annualOriginalDisplay}
                  </Text>
                  <Text
                    style={[
                      styles.planDiscountPriceV2,
                      {
                        color: colors.lime[500],
                        fontFamily: fontFamily.bold,
                      },
                    ]}
                  >
                    {annualDisplay}/yr
                  </Text>
                </View>
              </View>
              <View style={styles.planRight}>
                <Text
                  style={[
                    styles.planPriceMain,
                    {
                      color: colors.text.primary,
                      fontFamily: fontFamily.bold,
                    },
                  ]}
                >
                  {annualPerMonthDisplay}
                </Text>
                <Text
                  style={[
                    styles.planPriceSub,
                    {
                      color: colors.text.secondary,
                      fontFamily: fontFamily.medium,
                    },
                  ]}
                >
                  per month
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Monthly */}
          <TouchableOpacity
            style={[
              styles.planCardV2,
              {
                backgroundColor: colors.card.background,
                borderColor: !isAnnualSelected
                  ? colors.primary.main
                  : colors.border.light,
                borderWidth: !isAnnualSelected ? 2 : 1,
              },
            ]}
            onPress={() =>
              setSelectedPackage({ identifier: "monthly" } as any)
            }
            activeOpacity={0.85}
          >
            <View style={styles.planRow}>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: !isAnnualSelected
                      ? colors.primary.main
                      : colors.border.medium,
                  },
                ]}
              >
                {!isAnnualSelected && (
                  <View
                    style={[
                      styles.radioDot,
                      { backgroundColor: colors.primary.main },
                    ]}
                  />
                )}
              </View>
              <View style={styles.planMiddle}>
                <Text
                  style={[
                    styles.planTitleV2,
                    {
                      color: colors.text.primary,
                      fontFamily: fontFamily.semibold,
                    },
                  ]}
                >
                  Monthly
                </Text>
                <Text
                  style={[
                    styles.planSubtitleV2,
                    {
                      color: colors.text.secondary,
                      fontFamily: fontFamily.medium,
                    },
                  ]}
                >
                  Cancel anytime
                </Text>
              </View>
              <View style={styles.planRight}>
                <Text
                  style={[
                    styles.planPriceMain,
                    {
                      color: colors.text.primary,
                      fontFamily: fontFamily.bold,
                    },
                  ]}
                >
                  {monthlyDisplay}
                </Text>
                <Text
                  style={[
                    styles.planPriceSub,
                    {
                      color: colors.text.secondary,
                      fontFamily: fontFamily.medium,
                    },
                  ]}
                >
                  per month
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* EVERYTHING IN PRO header */}
        <Text
          style={[
            styles.everythingHeader,
            { color: colors.text.tertiary, fontFamily: fontFamily.bold },
          ]}
        >
          EVERYTHING IN PRO
        </Text>

        {/* Feature list */}
        <View style={styles.featureListV2}>
          {PREMIUM_FEATURES.map((feature, idx) => (
            <View
              key={idx}
              style={[
                styles.featureRowV2,
                {
                  backgroundColor: colors.card.background,
                  borderColor: colors.border.light,
                },
              ]}
            >
              <View
                style={[
                  styles.featureIconTile,
                  { backgroundColor: colors.primary.main + "15" },
                ]}
              >
                <Ionicons
                  name={feature.icon as any}
                  size={20}
                  color={colors.primary.main}
                />
              </View>
              <View style={styles.featureTextWrap}>
                <Text
                  style={[
                    styles.featureRowTitle,
                    {
                      color: colors.text.primary,
                      fontFamily: fontFamily.semibold,
                    },
                  ]}
                >
                  {feature.title}
                </Text>
                <Text
                  style={[
                    styles.featureRowDesc,
                    {
                      color: colors.text.secondary,
                      fontFamily: fontFamily.medium,
                    },
                  ]}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            { backgroundColor: colors.primary.main },
            purchasing && styles.ctaButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={purchasing}
          activeOpacity={0.85}
        >
          <Text
            style={[styles.ctaButtonText, { fontFamily: fontFamily.bold }]}
          >
            {purchasing ? "Processing..." : "Start 14-day free trial"}
          </Text>
          {!purchasing && (
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          )}
        </TouchableOpacity>

        {/* CTA disclaimer */}
        <Text
          style={[
            styles.ctaDisclaimer,
            {
              color: colors.text.tertiary,
              fontFamily: fontFamily.medium,
            },
          ]}
        >
          {isAnnualSelected
            ? `Then ${annualPerMonthDisplay}/month, billed yearly. Cancel anytime.`
            : `Then ${monthlyDisplay}/month. Cancel anytime.`}
        </Text>

        {/* Trial & Auto-Renewal Disclosure */}
        <View
          style={[
            styles.disclosureCardV2,
            {
              backgroundColor: colors.card.background,
              borderColor: colors.border.light,
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.primary.main}
            style={{ marginTop: 1 }}
          />
          <Text
            style={[
              styles.disclosureCardText,
              {
                color: colors.text.secondary,
                fontFamily: fontFamily.medium,
              },
            ]}
          >
            Your subscription will automatically renew for{" "}
            <Text
              style={[
                styles.disclosureBoldV2,
                {
                  color: colors.text.primary,
                  fontFamily: fontFamily.semibold,
                },
              ]}
            >
              {isAnnualSelected
                ? `${annualDisplay}/year`
                : `${monthlyDisplay}/month`}
            </Text>
            {" "}after the 14-day free trial unless cancelled at least 24
            hours before the trial ends. Cancel anytime in App Store settings.
          </Text>
        </View>

        {/* 30-day money-back guarantee */}
        <View
          style={[
            styles.guaranteeCardV2,
            {
              backgroundColor: colors.card.background,
              borderColor: colors.border.light,
            },
          ]}
        >
          <View
            style={[
              styles.guaranteeIconTile,
              { backgroundColor: colors.lime[500] + "15" },
            ]}
          >
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={colors.lime[500]}
            />
          </View>
          <View style={styles.featureTextWrap}>
            <Text
              style={[
                styles.featureRowTitle,
                {
                  color: colors.text.primary,
                  fontFamily: fontFamily.semibold,
                },
              ]}
            >
              30-day money-back guarantee
            </Text>
            <Text
              style={[
                styles.featureRowDesc,
                {
                  color: colors.text.secondary,
                  fontFamily: fontFamily.medium,
                },
              ]}
            >
              Not satisfied? Get a full refund, no questions asked.
            </Text>
          </View>
        </View>

        {/* Restore Purchases (centered text link) */}
        <TouchableOpacity
          style={styles.restoreInline}
          onPress={handleRestorePurchases}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.restoreInlineText,
              {
                color: colors.primary.main,
                fontFamily: fontFamily.medium,
              },
            ]}
          >
            Already subscribed? Restore purchases
          </Text>
        </TouchableOpacity>

        {/* Legal links (inline) */}
        <View style={styles.legalInline}>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://expenzez.com/terms")}
          >
            <Text
              style={[
                styles.legalInlineLink,
                {
                  color: colors.text.tertiary,
                  fontFamily: fontFamily.medium,
                },
              ]}
            >
              Terms
            </Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.legalInlineDot,
              { color: colors.text.tertiary },
            ]}
          >
            ·
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://expenzez.com/privacy")}
          >
            <Text
              style={[
                styles.legalInlineLink,
                {
                  color: colors.text.tertiary,
                  fontFamily: fontFamily.medium,
                },
              ]}
            >
              Privacy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Small print */}
        <Text
          style={[styles.termsTextV2, { color: colors.text.tertiary }]}
        >
          Subscription automatically renews unless canceled at least 24
          hours before the end of the current period. Payment charged to
          App Store account. Manage subscriptions in App Store settings.
        </Text>
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
  pricingDisclosure: {
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  mainPrice: {
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 4,
  },
  afterTrialText: {
    fontSize: 20,
    fontWeight: "700",
  },
  purchaseButton: {
    marginHorizontal: 20,
    marginVertical: 12,
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
  disclosureBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  disclosureText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "400",
  },
  disclosureBold: {
    fontWeight: "700",
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
  detailsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  detailLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionButtonsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  manageButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
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

  // --- v1.6.3 redesign (non-premium upgrade flow) ---
  headerMinimal: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: "row",
  },
  backButtonRound: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  heroSectionV2: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    alignItems: "center",
  },
  proPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 18,
  },
  proPillText: {
    fontSize: 11,
    letterSpacing: 1.2,
  },
  heroTitleV2: {
    fontSize: 34,
    lineHeight: 38,
    textAlign: "center",
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  heroSubtitleV2: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  plansContainerV2: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  planCardV2: {
    borderRadius: 16,
    padding: 18,
    position: "relative",
  },
  planCardV2Selected: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  savePill: {
    position: "absolute",
    top: -10,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  savePillText: {
    color: "#fff",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  planMiddle: {
    flex: 1,
    gap: 4,
  },
  planTitleV2: {
    fontSize: 17,
    letterSpacing: 0.2,
  },
  planSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  planSubtitleV2: {
    fontSize: 13,
  },
  planOriginalPriceV2: {
    fontSize: 13,
    textDecorationLine: "line-through",
  },
  planDiscountPriceV2: {
    fontSize: 13,
  },
  planRight: {
    alignItems: "flex-end",
  },
  planPriceMain: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  planPriceSub: {
    fontSize: 11,
    marginTop: 2,
  },
  everythingHeader: {
    fontSize: 11,
    letterSpacing: 1.4,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  featureListV2: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  featureRowV2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  featureIconTile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextWrap: {
    flex: 1,
    gap: 2,
  },
  featureRowTitle: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
  featureRowDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 4,
    paddingVertical: 17,
    borderRadius: 14,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  ctaDisclaimer: {
    fontSize: 12,
    textAlign: "center",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  disclosureCardV2: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  disclosureCardText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  disclosureBoldV2: {
    fontSize: 12,
  },
  guaranteeCardV2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  guaranteeIconTile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  restoreInline: {
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 8,
  },
  restoreInlineText: {
    fontSize: 13,
  },
  legalInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 14,
  },
  legalInlineLink: {
    fontSize: 12,
  },
  legalInlineDot: {
    fontSize: 12,
  },
  termsTextV2: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginHorizontal: 24,
    marginBottom: 24,
  },
});
