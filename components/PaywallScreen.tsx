import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { useTheme } from '../contexts/ThemeContext';

interface PaywallScreenProps {
  onClose: () => void;
  feature?: string;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({ onClose, feature }) => {
  const { colors } = useTheme();
  const { offerings, purchasePackage, restorePurchases } = useRevenueCat();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (packageIndex: number) => {
    if (!offerings?.availablePackages[packageIndex]) return;

    setLoading(true);
    try {
      const success = await purchasePackage(offerings.availablePackages[packageIndex]);
      if (success) {
        Alert.alert(
          'Purchase Successful!',
          'Thank you for upgrading to Expenzez Pro. Enjoy all the premium features!',
          [{ text: 'Continue', onPress: onClose }]
        );
      } else {
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const success = await restorePurchases();
      if (success) {
        Alert.alert(
          'Purchases Restored!',
          'Your premium subscription has been restored.',
          [{ text: 'Continue', onPress: onClose }]
        );
      } else {
        Alert.alert('No Purchases Found', 'No active subscriptions were found to restore.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const proFeatures = [
    { icon: '📊', title: 'Advanced Analytics', description: 'Detailed spending insights and trends' },
    { icon: '🔄', title: 'Unlimited Transactions', description: 'No limits on transaction imports' },
    { icon: '📈', title: 'Custom Reports', description: 'Generate detailed financial reports' },
    { icon: '☁️', title: 'Cloud Sync', description: 'Sync data across all your devices' },
    { icon: '💰', title: 'Bill Predictions', description: 'AI-powered bill forecasting' },
    { icon: '🎯', title: 'Advanced Budgeting', description: 'Set complex budget rules and alerts' },
    { icon: '📤', title: 'Export to CSV/PDF', description: 'Export your data in multiple formats' },
    { icon: '🔔', title: 'Smart Notifications', description: 'Intelligent spending alerts' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.text.primary }]}>
            Unlock Expenzez Pro
          </Text>
          {feature && (
            <Text style={[styles.heroSubtitle, { color: colors.text.secondary }]}>
              {feature} requires a Pro subscription
            </Text>
          )}
          <Text style={[styles.heroDescription, { color: colors.text.secondary }]}>
            Get powerful insights and unlimited features to take control of your finances
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={[styles.featuresTitle, { color: colors.text.primary }]}>
            Pro Features
          </Text>
          {proFeatures.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text.primary }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.text.secondary }]}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Options */}
        {offerings && (
          <View style={styles.pricingContainer}>
            <Text style={[styles.pricingTitle, { color: colors.text.primary }]}>
              Choose Your Plan
            </Text>
            {offerings.availablePackages.map((pkg, index) => {
              const isPopular = pkg.packageType === 'ANNUAL';
              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.priceOption,
                    {
                      backgroundColor: colors.background.secondary,
                      borderColor: isPopular ? colors.primary[500] : colors.border,
                      borderWidth: isPopular ? 2 : 1,
                    },
                  ]}
                  onPress={() => handlePurchase(index)}
                  disabled={loading}
                >
                  {isPopular && (
                    <View style={[styles.popularBadge, { backgroundColor: colors.primary[500] }]}>
                      <Text style={styles.popularText}>Most Popular</Text>
                    </View>
                  )}
                  <View style={styles.priceHeader}>
                    <Text style={[styles.priceTitle, { color: colors.text.primary }]}>
                      {pkg.product.title}
                    </Text>
                    <Text style={[styles.priceAmount, { color: colors.primary[600] }]}>
                      {pkg.product.priceString}
                    </Text>
                  </View>
                  <Text style={[styles.priceDescription, { color: colors.text.secondary }]}>
                    {pkg.product.description}
                  </Text>
                  {pkg.packageType === 'ANNUAL' && (
                    <Text style={[styles.savingsText, { color: colors.success[600] }]}>
                      Save 30% compared to monthly
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={loading}
          >
            <Text style={[styles.restoreText, { color: colors.text.secondary }]}>
              Restore Purchases
            </Text>
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: colors.text.secondary }]}>
            Subscription automatically renews unless cancelled. Cancel anytime in your App Store settings.
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={[styles.loadingText, { color: colors.text.primary }]}>
              Processing...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    padding: 8,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  pricingContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  priceOption: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  priceDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  restoreText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});