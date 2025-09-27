import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '../../contexts/ThemeContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { spacing, borderRadius, typography } from '../../constants/theme';

interface PremiumFeature {
  icon: string;
  title: string;
  description: string;
  freeLimit?: string;
  premiumLimit: string;
}

const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    icon: 'sparkles',
    title: 'Unlimited AI Financial Assistant',
    description: 'Get personalized financial advice, insights, and recommendations anytime',
    freeLimit: '3 chats/month',
    premiumLimit: 'Unlimited conversations',
  },
  {
    icon: 'shield-outline',
    title: 'Enhanced Security Features',
    description: 'Biometric authentication, PIN protection, and advanced security monitoring',
    freeLimit: 'Basic security',
    premiumLimit: 'Advanced security suite',
  },
  {
    icon: 'flag-outline',
    title: 'Unlimited Financial Goals',
    description: 'Set and track unlimited savings goals with smart progress tracking',
    freeLimit: '1 goal only',
    premiumLimit: 'Unlimited goals',
  },
  {
    icon: 'pie-chart-outline',
    title: 'Advanced Budget Management',
    description: 'Create unlimited budget categories with smart spending alerts',
    freeLimit: '1 budget category',
    premiumLimit: 'Unlimited budgets',
  },
  {
    icon: 'analytics-outline',
    title: 'Advanced Analytics & Insights',
    description: 'Detailed spending patterns, trends, and predictive analytics',
    freeLimit: 'Basic charts only',
    premiumLimit: 'Full analytics suite',
  },
  {
    icon: 'pricetags-outline',
    title: 'AI Transaction Categorization',
    description: 'Automatic smart categorization of all your transactions',
    freeLimit: 'Basic categories',
    premiumLimit: 'AI-powered categorization',
  },
];

const PRICING_PLANS = [
  {
    id: 'premium-monthly',
    name: 'Monthly',
    price: 4.99,
    originalPrice: null,
    interval: 'month',
    popular: false,
    savings: null,
  },
  {
    id: 'premium-annual',
    name: 'Annual',
    price: 49.99,
    originalPrice: 59.88,
    interval: 'year',
    popular: true,
    savings: '17% off',
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
    restorePurchases
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState('premium-annual');
  const [purchasing, setPurchasing] = useState(false);
  const showTrialButton = !isPremium && !isTrialActive;

  // Log subscription screen load
  useEffect(() => {
    console.log('📱 [SubscriptionPlans] Subscription screen loaded');
  }, []);

  const handleStartTrial = async () => {
    setPurchasing(true);
    try {
      // Use the trial package for RevenueCat (you can create a trial package in RevenueCat dashboard)
      const success = await purchaseSubscription('trial');
      if (success) {
        Alert.alert(
          '🎉 Free Trial Started!',
          'Welcome to Premium! You now have 14 days of unlimited access to all features.',
          [
            {
              text: 'Start Exploring',
              onPress: () => router.push('/(tabs)'),
              style: 'default'
            }
          ]
        );
      } else {
        Alert.alert(
          'Trial Not Available',
          'Unable to start the free trial. Please try again or contact support.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start trial. Please try again.');
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
          '✅ Purchases Restored!',
          'Your previous purchases have been successfully restored.',
          [
            {
              text: 'Continue',
              onPress: () => router.push('/(tabs)'),
              style: 'default'
            }
          ]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We could not find any previous purchases to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      // Map local plan ID to RevenueCat package ID
      const packageId = selectedPlan === 'premium-annual' ? 'annual' : 'monthly';

      console.log('🛒 [SubscriptionPlans] Starting native purchase:', packageId);

      const success = await purchaseSubscription(packageId);

      if (success) {
        Alert.alert(
          '🚀 Welcome to Premium!',
          'Thank you for your purchase! You now have unlimited access to all premium features.',
          [
            {
              text: 'Get Started',
              onPress: () => router.push('/(tabs)'),
              style: 'default'
            }
          ]
        );
      } else {
        Alert.alert(
          'Purchase Failed',
          'There was an issue processing your purchase. Please try again.',
          [{ text: 'Try Again' }]
        );
      }
    } catch (error: any) {
      console.error('❌ [SubscriptionPlans] Purchase error:', error);
      Alert.alert('Error', 'Failed to process purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const selectedPlanData = PRICING_PLANS.find(p => p.id === selectedPlan);

  // Helper functions
  const formatExpirationDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'today';
    } else if (diffDays === 1) {
      return 'tomorrow';
    } else if (diffDays <= 7) {
      return `in ${diffDays} days`;
    } else if (diffDays <= 30) {
      return `on ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
    } else {
      return `on ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
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
                <Ionicons name="diamond" size={60} color={colors.primary[500]} />
                <View style={styles.sparkleOverlay}>
                  <Ionicons name="sparkles" size={20} color={colors.primary[400]} style={styles.sparkle1} />
                  <Ionicons name="sparkles" size={16} color={colors.primary[300]} style={styles.sparkle2} />
                  <Ionicons name="sparkles" size={14} color={colors.primary[200]} style={styles.sparkle3} />
                </View>
              </View>
              <Text style={styles.heroTitle}>Unlock Premium</Text>
              <Text style={styles.heroSubtitle}>
                Take control of your financial future with unlimited access to all features
              </Text>
            </View>
          </View>

          {/* Current Status Banner */}
          {isPremium && !isTrialActive && (
            <View style={[styles.statusBanner, { backgroundColor: colors.success[100] }]}>
              <View style={styles.statusContent}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success[600]} />
                <View style={styles.statusTextContainer}>
                  <Text style={[styles.statusText, { color: colors.success[700] }]}>
                    You&apos;re Premium! Enjoy unlimited access 🎉
                  </Text>
                  {subscription.endDate && (
                    <Text style={[styles.statusSubtext, { color: colors.success[600] }]}>
                      {subscription.tier === 'premium-annual' ? 'Annual' : 'Monthly'} plan • Renews {formatExpirationDate(subscription.endDate)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {isTrialActive && (
            <View style={[styles.statusBanner, {
              backgroundColor: daysUntilTrialExpires <= 3 ? colors.error[100] : colors.warning[100]
            }]}>
              <View style={styles.statusContent}>
                <Ionicons
                  name={daysUntilTrialExpires <= 3 ? "warning" : "time"}
                  size={24}
                  color={daysUntilTrialExpires <= 3 ? colors.error[600] : colors.warning[600]}
                />
                <View style={styles.statusTextContainer}>
                  <Text style={[styles.statusText, {
                    color: daysUntilTrialExpires <= 3 ? colors.error[700] : colors.warning[700]
                  }]}>
                    {daysUntilTrialExpires <= 3 ? '⚠️ Trial Ending Soon' : '🆓 Free Trial Active'}
                  </Text>
                  <Text style={[styles.statusSubtext, {
                    color: daysUntilTrialExpires <= 3 ? colors.error[600] : colors.warning[600]
                  }]}>
                    {daysUntilTrialExpires === 0 ? 'Expires today' :
                     daysUntilTrialExpires === 1 ? 'Expires tomorrow' :
                     `${daysUntilTrialExpires} days remaining`} • {subscription.trialEndDate ? formatExpirationDate(subscription.trialEndDate) : 'No end date'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Urgent Trial Expiration Warning */}
          {isTrialActive && daysUntilTrialExpires <= 3 && (
            <View style={[styles.urgentBanner, { backgroundColor: colors.error[100] }]}>
              <View style={styles.statusContent}>
                <Ionicons name="flash" size={24} color={colors.error[600]} />
                <View style={styles.statusTextContainer}>
                  <Text style={[styles.urgentText, { color: colors.error[700] }]}>
                    Don&apos;t Lose Your Premium Features!
                  </Text>
                  <Text style={[styles.urgentSubtext, { color: colors.error[600] }]}>
                    Your trial ends {daysUntilTrialExpires === 0 ? 'today' : daysUntilTrialExpires === 1 ? 'tomorrow' : `in ${daysUntilTrialExpires} days`}.
                    Upgrade now to continue unlimited access to all features.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Pricing Cards */}
          {!isPremium && (
            <View style={styles.pricingSection}>
              <Text style={styles.sectionTitle}>Choose Your Plan</Text>
              <Text style={styles.pricingSectionSubtitle}>
                Start saving money today with smart financial insights
              </Text>

              <View style={styles.pricingCards}>
                {PRICING_PLANS.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.pricingCard,
                      selectedPlan === plan.id && styles.selectedPricingCard,
                      plan.popular && styles.popularCard
                    ]}
                    onPress={() => setSelectedPlan(plan.id)}
                    activeOpacity={0.8}
                  >
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <Ionicons name="star" size={12} color="white" style={{ marginRight: 4 }} />
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
                          Was £{plan.originalPrice}
                        </Text>
                        <Text style={styles.savingsAmount}>
                          Save £{(plan.originalPrice - plan.price).toFixed(2)}
                        </Text>
                      </View>
                    )}

                    <Text style={styles.monthlyEquivalent}>
                      £{plan.id === 'premium-annual' ? '4.17' : '4.99'}/month
                    </Text>

                    {selectedPlan === plan.id && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Premium Features</Text>
            <Text style={styles.sectionSubtitle}>
              Everything you need to master your finances
            </Text>

            <View style={styles.featuresGrid}>
              {PREMIUM_FEATURES.map((feature, index) => (
                <View
                  key={index}
                  style={styles.featureCard}
                >
                  <View style={styles.featureIcon}>
                    <Ionicons name={feature.icon as any} size={24} color={colors.primary[500]} />
                  </View>

                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>

                    <View style={styles.featureLimits}>
                      <View style={styles.limitRow}>
                        <View style={styles.freeTag}>
                          <Text style={styles.freeTagText}>Free</Text>
                        </View>
                        <Text style={styles.limitText}>{feature.freeLimit || 'Not available'}</Text>
                      </View>

                      <View style={styles.limitRow}>
                        <View style={styles.premiumTag}>
                          <Text style={styles.premiumTagText}>Premium</Text>
                        </View>
                        <Text style={styles.limitText}>{feature.premiumLimit}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
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
              style={[styles.trialButton, { backgroundColor: colors.primary[600] }]}
              onPress={handleStartTrial}
              disabled={purchasing}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="flash" size={20} color="white" />
                <Text style={styles.trialButtonText}>
                  {purchasing ? 'Starting Trial...' : 'Start 14-Day Free Trial'}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Single Native Payment Button */}
          <TouchableOpacity
            style={[
              styles.upgradeButton,
              !showTrialButton && styles.primaryButton,
              { backgroundColor: colors.primary[600] }
            ]}
            onPress={handlePurchase}
            disabled={purchasing || !selectedPlanData}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="diamond" size={20} color="white" />
              <Text style={styles.upgradeButtonText}>
                {purchasing ? 'Processing...' : `Get Premium - £${selectedPlanData?.price}/${selectedPlanData?.interval}`}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </View>
          </TouchableOpacity>

          <Text style={styles.disclaimerText}>
            Cancel anytime. No hidden fees. 30-day money-back guarantee.
          </Text>
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '700' as any,
    color: colors.text.primary,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 200, // Add bottom padding to account for floating footer
  },

  heroSection: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary[100],
  },

  heroContent: {
    alignItems: 'center',
  },

  heroIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  sparkleOverlay: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sparkle1: {
    position: 'absolute',
    top: 10,
    right: 15,
  },

  sparkle2: {
    position: 'absolute',
    bottom: 15,
    left: 10,
  },

  sparkle3: {
    position: 'absolute',
    top: 20,
    left: 20,
  },

  heroTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '700' as any,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  heroSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  statusBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },

  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },

  statusText: {
    fontSize: typography.sizes.base,
    fontWeight: '600' as any,
    marginLeft: spacing.sm,
  },

  pricingSection: {
    margin: spacing.lg,
  },

  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '700' as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  sectionSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },

  pricingSectionSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },

  pricingCards: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  pricingCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
    position: 'relative',
    shadowColor: colors.primary[500],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  selectedPricingCard: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
    shadowOpacity: 0.15,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },

  popularCard: {
    borderColor: colors.primary[600],
    shadowOpacity: 0.1,
    elevation: 5,
  },

  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },

  popularBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700' as any,
    color: 'white',
  },

  pricingCardHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  planName: {
    fontSize: typography.sizes.lg,
    fontWeight: '700' as any,
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
    fontWeight: '700' as any,
    color: colors.success[700],
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },

  currencySymbol: {
    fontSize: typography.sizes.lg,
    fontWeight: '600' as any,
    color: colors.text.primary,
    marginRight: 2,
  },

  price: {
    fontSize: typography.sizes['3xl'],
    fontWeight: '800' as any,
    color: colors.text.primary,
  },

  priceInterval: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    fontWeight: '500' as any,
  },

  originalPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },

  originalPrice: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
  },

  savingsAmount: {
    fontSize: typography.sizes.sm,
    color: colors.success[600],
    fontWeight: '600' as any,
  },

  monthlyEquivalent: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  selectedIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
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
    margin: spacing.lg,
  },

  featuresGrid: {
    gap: spacing.md,
  },

  featureCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 120,
  },

  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  featureContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  featureTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700' as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },

  featureDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },

  featureLimits: {
    gap: spacing.xs,
  },

  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  freeTag: {
    backgroundColor: colors.text.tertiary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
    marginRight: spacing.sm,
  },

  freeTagText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600' as any,
    color: 'white',
  },

  premiumTag: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
    marginRight: spacing.sm,
  },

  premiumTagText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600' as any,
    color: 'white',
  },

  limitText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 16,
  },

  actionSection: {
    margin: spacing.lg,
    gap: spacing.md,
  },

  trialButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },

  upgradeButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },

  primaryButton: {
    marginTop: spacing.md,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },

  trialButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: '700' as any,
    color: 'white',
  },

  upgradeButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600' as any,
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },

  disclaimerText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },

  bottomSpacer: {
    height: spacing.xl,
  },

  floatingFooter: {
    position: 'absolute',
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
    overflow: 'hidden',
  },

  urgentText: {
    fontSize: typography.sizes.base,
    fontWeight: '700' as any,
  },

  urgentSubtext: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },

});