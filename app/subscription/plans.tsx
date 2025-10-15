import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../auth/AuthContext';

const PRICING_PLANS = [
  {
    id: 'premium-monthly',
    name: 'Premium Monthly',
    price: '$4.99',
    period: 'per month',
    features: [
      'Unlimited transactions',
      'Advanced analytics',
      'AI-powered insights',
      'Budget tracking',
      'Bill reminders',
      'Data export',
    ],
    popular: false,
  },
  {
    id: 'premium-annual',
    name: 'Premium Annual',
    price: '$49.99',
    period: 'per year',
    originalPrice: '$59.88',
    savings: '17% off',
    features: [
      'Everything in Monthly',
      'Priority support',
      'Advanced reports',
      'Custom categories',
      'Backup & sync',
      'No ads',
    ],
    popular: true,
  },
];

export default function SubscriptionPlansScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('premium-annual');
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      // Simulate purchase process
      Alert.alert(
        'Purchase Successful!',
        'Welcome to Premium! You now have access to all premium features.',
        [{ text: 'Get Started', style: 'default' }]
      );
    } catch (error) {
      Alert.alert('Purchase Failed', 'Please try again later.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      Alert.alert('Restore Purchases', 'Your purchases have been restored.');
    } catch (error) {
      Alert.alert('Restore Failed', 'No previous purchases found.');
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
            Get the most out of your financial tracking with our premium features
          </Text>
        </View>

        {/* Pricing Plans */}
        <View style={styles.pricingSection}>
          {PRICING_PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: selectedPlan === plan.id ? colors.primary[500] : colors.border.light,
                },
                selectedPlan === plan.id && styles.selectedPlan,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: colors.primary[500] }]}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: colors.text.primary }]}>
                  {plan.name}
                </Text>
                <View style={styles.priceContainer}>
                  <Text style={[styles.price, { color: colors.text.primary }]}>
                    {plan.price}
                  </Text>
                  <Text style={[styles.period, { color: colors.text.secondary }]}>
                    {plan.period}
                  </Text>
                </View>
                {plan.originalPrice && (
                  <View style={styles.savingsContainer}>
                    <Text style={[styles.originalPrice, { color: colors.text.tertiary }]}>
                      {plan.originalPrice}
                    </Text>
                    <Text style={[styles.savings, { color: colors.success[500] }]}>
                      {plan.savings}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.success[500]}
                    />
                    <Text style={[styles.featureText, { color: colors.text.secondary }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
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
            {purchasing ? 'Processing...' : 'Start Premium'}
          </Text>
        </TouchableOpacity>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={16} color={colors.primary[500]} />
          <Text style={[styles.restoreButtonText, { color: colors.primary[500] }]}>
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
              onPress={() => Linking.openURL('https://expenzez.com/terms')}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color={colors.primary[500]}
              />
              <Text style={[styles.legalLinkText, { color: colors.text.primary }]}>
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
              onPress={() => Linking.openURL('https://expenzez.com/privacy')}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={colors.primary[500]}
              />
              <Text style={[styles.legalLinkText, { color: colors.text.primary }]}>
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
            Subscription automatically renews unless canceled at least 24 hours before the end of the current period. Payment charged to App Store account. Manage subscriptions in App Store settings.
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  pricingSection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    position: 'relative',
  },
  selectedPlan: {
    borderColor: '#3B82F6',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
  },
  period: {
    fontSize: 16,
    marginLeft: 4,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  savings: {
    fontSize: 14,
    fontWeight: '600',
  },
  featuresContainer: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  legalSection: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  legalLinks: {
    gap: 12,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
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
    textAlign: 'center',
  },
});
