import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
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
 * MerchantLogo — shows the real brand icon (DuckDuckGo / Google favicon) for
 * merchants with a known curated domain. Anything without a known domain falls
 * back to a clean category icon — we never guess a domain from the raw bank
 * description, so we never show a wrong/random logo. (Domains live in
 * services/merchantService.ts MERCHANT_LOGOS.)
 */
export const MerchantLogo: React.FC<MerchantLogoProps> = ({
  merchant,
  description,
  category,
  size = 48,
  style,
}) => {
  // Get merchant info from service
  const merchantInfo: MerchantInfo = getMerchantInfo(merchant || description || '');
  const effectiveCategory = (merchantInfo.category || category || 'other').toLowerCase();
  const brandColor = merchantInfo.color || CATEGORY_COLORS[effectiveCategory] || CATEGORY_COLORS.other;
  // Only merchants that map to a KNOWN domain in our curated list
  // (services/merchantService.ts MERCHANT_LOGOS) get a real logo. We deliberately
  // do NOT guess a domain from the raw bank description: name-based brand search
  // matched junk strings like "Money out" or "DDH3GDEVICEPAYMENT" to unrelated
  // brands and rendered random, unprofessional logos (a stock photo of a person,
  // a dollar bill, …). No known domain → clean category icon.
  const domain = merchantInfo.domain || null;

  // Brand icon via favicon services: DuckDuckGo first (high-res, reliable), then
  // Google as a fallback. Both return a known generic icon — never a random brand
  // — when a domain has no favicon, and we still drop to the category icon if both
  // error.
  const sources = useMemo(() => {
    if (!domain) return [];
    return [
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    ];
  }, [domain]);

  // Which source we're currently attempting. Advances on load error; reset when
  // the domain changes (list rows get recycled across different merchants).
  const [srcIndex, setSrcIndex] = useState(0);
  useEffect(() => setSrcIndex(0), [domain]);

  const logoUrl = srcIndex < sources.length ? sources[srcIndex] : null;

  // Real brand logo on a clean white chip (logos read best on white, and it
  // stays consistent across light/dark themes).
  if (logoUrl) {
    return (
      <View
        style={[
          styles.container,
          styles.logoShadow,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#FFFFFF',
          },
          style,
        ]}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: 'rgba(0,0,0,0.06)',
          }}
        >
          <Image
            source={{ uri: logoUrl }}
            style={{ width: '100%', height: '100%' }}
            // cover + circular clip → the logo fills the circle and any square/
            // badge background on the icon is trimmed to the circle (no overflow).
            onError={() => setSrcIndex((i) => i + 1)}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        </View>
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
  // Soft shadow for the circular logo tile. Kept separate from the clipping
  // view because overflow:'hidden' (needed to clip the logo to the circle)
  // would otherwise suppress the shadow on iOS.
  logoShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default MerchantLogo;
