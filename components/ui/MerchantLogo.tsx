import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { getMerchantInfo, MerchantInfo } from '../../services/merchantService';
import { BRANDFETCH_CLIENT_ID } from '../../config/logos';
import { resolveMerchantDomain } from '../../services/merchantLogoResolver';

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
 * MerchantLogo — shows the real brand logo (Clearbit, high-res) for merchants
 * with a known curated domain. Anything without a known domain, or whose logo
 * Clearbit doesn't have, falls back to a clean category icon — we never show a
 * guessed/wrong or low-resolution logo. (Domains live in
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
  // Domain comes from the curated map (instant), or for everything else is
  // resolved by name via Brandfetch Search and cached (merchantLogoResolver) —
  // so messy bank names like "ADIDASUKLIM7300.4386.603" still get a logo.
  const curatedDomain = merchantInfo.domain || null;
  const [resolvedDomain, setResolvedDomain] = useState<string | null>(null);
  useEffect(() => {
    if (curatedDomain) {
      setResolvedDomain(null);
      return undefined;
    }
    let active = true;
    resolveMerchantDomain(merchant || description).then((d) => {
      if (active) setResolvedDomain(d);
    });
    return () => {
      active = false;
    };
  }, [curatedDomain, merchant, description]);
  const domain = curatedDomain || resolvedDomain;

  // High-res brand logo. Prefer Brandfetch (best quality) when a client ID is
  // configured, falling back to Clearbit. If neither has it, the source list
  // is exhausted and we show a clean category icon — never a wrong/blurry logo.
  const sources = useMemo(() => {
    if (!domain) return [];
    const list: string[] = [];
    if (BRANDFETCH_CLIENT_ID) {
      // Brandfetch Logo Link — sized + explicit `icon` type (verified format).
      list.push(
        `https://cdn.brandfetch.io/${domain}/w/256/h/256/icon?c=${BRANDFETCH_CLIENT_ID}`
      );
    }
    list.push(`https://logo.clearbit.com/${domain}?size=256`);
    return list;
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
