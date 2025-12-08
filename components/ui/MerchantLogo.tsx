import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMerchantInfo, MerchantInfo } from '../../services/merchantService';

interface MerchantLogoProps {
  merchant?: string;
  description?: string;
  category?: string;
  size?: number;
  style?: object;
}

// Map categories to Ionicons
const CATEGORY_ICONS: Record<string, string> = {
  // Food & Dining
  food: 'restaurant',
  'food & dining': 'restaurant',
  'food & drink': 'restaurant',
  dining: 'restaurant',
  groceries: 'cart',

  // Shopping
  shopping: 'bag-handle',
  retail: 'storefront',

  // Transport
  transport: 'car-sport',
  transportation: 'car-sport',
  fuel: 'speedometer',
  travel: 'airplane',

  // Finance
  finance: 'wallet',
  transfer: 'swap-horizontal',
  income: 'trending-up',
  salary: 'cash',

  // Bills & Utilities
  telecoms: 'phone-portrait',
  utilities: 'flash',
  bills: 'document-text',

  // Entertainment
  entertainment: 'game-controller',
  subscriptions: 'tv',

  // Health & Education
  health: 'fitness',
  medical: 'medkit',
  education: 'school',

  // General
  general: 'receipt',
  other: 'receipt',
};

// Map categories to colors
const CATEGORY_COLORS: Record<string, string> = {
  // Food & Dining
  food: '#FF6B6B',
  'food & dining': '#FF6B6B',
  'food & drink': '#FF6B6B',
  dining: '#FF6B6B',
  groceries: '#4ECDC4',

  // Shopping
  shopping: '#A78BFA',
  retail: '#A78BFA',

  // Transport
  transport: '#60A5FA',
  transportation: '#60A5FA',
  fuel: '#F97316',
  travel: '#0EA5E9',

  // Finance
  finance: '#34D399',
  transfer: '#8B5CF6',
  income: '#22C55E',
  salary: '#22C55E',

  // Bills & Utilities
  telecoms: '#F59E0B',
  utilities: '#EC4899',
  bills: '#EF4444',

  // Entertainment
  entertainment: '#8B5CF6',
  subscriptions: '#6366F1',

  // Health & Education
  health: '#10B981',
  medical: '#10B981',
  education: '#3B82F6',

  // General
  general: '#9CA3AF',
  other: '#9CA3AF',
};

/**
 * MerchantLogo component with 3-tier fallback:
 * 1. Clearbit logo (if domain exists)
 * 2. Category icon via Ionicons
 * 3. First letter avatar with brand color
 */
export const MerchantLogo: React.FC<MerchantLogoProps> = ({
  merchant,
  description,
  category,
  size = 48,
  style,
}) => {
  const [imageError, setImageError] = useState(false);

  // Get merchant info from service
  const merchantInfo: MerchantInfo = getMerchantInfo(merchant || description || '');
  const effectiveCategory = (merchantInfo.category || category || 'other').toLowerCase();
  const brandColor = merchantInfo.color || CATEGORY_COLORS[effectiveCategory] || CATEGORY_COLORS.other;

  // Generate Clearbit URL if domain exists
  const clearbitUrl = merchantInfo.domain
    ? `https://logo.clearbit.com/${merchantInfo.domain}`
    : null;

  // Tier 1: Try Clearbit logo - colored background with logo
  if (clearbitUrl && !imageError) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: `${brandColor}20`,
          },
          style,
        ]}
      >
        <Image
          source={{ uri: clearbitUrl }}
          style={{
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: (size * 0.7) / 2,
          }}
          onError={() => setImageError(true)}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Tier 2: Category icon with light colored background
  const iconName = CATEGORY_ICONS[effectiveCategory] || CATEGORY_ICONS.other;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${brandColor}20`,
        },
        style,
      ]}
    >
      <Ionicons
        name={iconName as any}
        size={size * 0.5}
        color={brandColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MerchantLogo;
