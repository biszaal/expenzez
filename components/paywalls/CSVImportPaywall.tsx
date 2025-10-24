import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useSubscription } from "../../hooks/useSubscription";

export const CSVImportPaywall: React.FC = () => {
  const { colors } = useTheme();
  const { monthlyPackage, annualPackage, formatPrice, calculateSavings } =
    useSubscription();

  const monthlyPrice = monthlyPackage ? formatPrice(monthlyPackage) : "£4.99";
  const annualPrice = annualPackage ? formatPrice(annualPackage) : "£49.99";
  const savings = calculateSavings();

  const features = [
    {
      icon: "document-text",
      title: "Unlimited CSV Imports",
      description: "Import unlimited transactions from your bank",
    },
    {
      icon: "sparkles",
      title: "Smart Detection",
      description: "Auto-detect format and categorize transactions",
    },
    {
      icon: "trending-up",
      title: "Recurring Bills",
      description: "Automatically identify your recurring payments",
    },
    {
      icon: "brain",
      title: "AI Insights",
      description: "Get personalized financial advice",
    },
    {
      icon: "calculator",
      title: "Advanced Analytics",
      description: "Deep insights into your spending patterns",
    },
  ];

  const handleUpgrade = async () => {
    router.push("/subscription/plans");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.primary[500]}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Premium Feature
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconBg,
              { backgroundColor: colors.primary[100] },
            ]}
          >
            <Ionicons
              name="document-text"
              size={48}
              color={colors.primary[500]}
            />
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.featureTitle, { color: colors.text.primary }]}>
          Smart CSV Import
        </Text>

        {/* Description */}
        <Text
          style={[styles.description, { color: colors.text.secondary }]}
        >
          Unlock unlimited CSV imports and let our smart engine automatically
          detect formats, categorize transactions, and identify your recurring
          bills.
        </Text>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureItem,
                {
                  backgroundColor: colors.background.secondary,
                },
              ]}
            >
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <Ionicons
                  name={feature.icon as any}
                  size={20}
                  color={colors.primary[500]}
                />
              </View>
              <View style={styles.featureContent}>
                <Text
                  style={[styles.featureItemTitle, { color: colors.text.primary }]}
                >
                  {feature.title}
                </Text>
                <Text
                  style={[
                    styles.featureItemDescription,
                    { color: colors.text.secondary },
                  ]}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <Text style={[styles.pricingTitle, { color: colors.text.primary }]}>
            Simple, Transparent Pricing
          </Text>

          {/* Monthly Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.primary[300],
              },
            ]}
            onPress={handleUpgrade}
          >
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: colors.text.primary }]}>
                Monthly
              </Text>
              <Text style={[styles.planPrice, { color: colors.primary[500] }]}>
                {monthlyPrice}
              </Text>
            </View>
            <Text style={[styles.planPeriod, { color: colors.text.secondary }]}>
              Per month
            </Text>
          </TouchableOpacity>

          {/* Annual Plan */}
          <View style={styles.annualPlanWrapper}>
            <View
              style={[
                styles.savingsBadge,
                { backgroundColor: colors.success[100] },
              ]}
            >
              <Text
                style={[styles.savingsText, { color: colors.success[600] }]}
              >
                Save {savings}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.planCard,
                styles.annualPlan,
                {
                  backgroundColor: colors.primary[500],
                  borderColor: colors.primary[600],
                },
              ]}
              onPress={handleUpgrade}
            >
              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: "#fff" }]}>
                  Annual
                </Text>
                <Text style={[styles.planPrice, { color: "#fff" }]}>
                  {annualPrice}
                </Text>
              </View>
              <Text style={[styles.planPeriod, { color: "#ffffff99" }]}>
                Per year, billed monthly
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trial Info */}
        <View
          style={[
            styles.trialInfo,
            { backgroundColor: colors.primary[50] },
          ]}
        >
          <Ionicons
            name="information-circle"
            size={20}
            color={colors.primary[500]}
          />
          <Text
            style={[styles.trialText, { color: colors.primary[700] }]}
          >
            14-day free trial on all plans. Cancel anytime.
          </Text>
        </View>
      </ScrollView>

      {/* Upgrade Button */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.upgradeButton,
            { backgroundColor: colors.primary[500] },
          ]}
          onPress={handleUpgrade}
        >
          <Ionicons name="lock-open" size={20} color="#fff" />
          <Text style={styles.upgradeButtonText}>Start Free Trial</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 32,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: "flex-start",
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  featureContent: {
    flex: 1,
  },
  featureItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureItemDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  pricingSection: {
    marginBottom: 32,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  planCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: "600",
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "700",
  },
  planPeriod: {
    fontSize: 13,
  },
  annualPlanWrapper: {
    position: "relative",
  },
  savingsBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "600",
  },
  annualPlan: {
    marginTop: 4,
  },
  trialInfo: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    gap: 10,
    alignItems: "center",
  },
  trialText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
