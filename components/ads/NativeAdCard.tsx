/**
 * NativeAdCard — a Google native ad rendered to match the app's feed cards.
 *
 * Styled with the theme tokens (same surface, border, radius and fonts as
 * components/ui/Card.tsx) so it sits naturally in the transactions feed, while
 * a clear "Sponsored" label keeps it policy-compliant and honest. Renders null
 * unless ads are allowed (useAds) and an ad actually loaded.
 */

import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, StyleSheet, ViewStyle } from "react-native";
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
} from "react-native-google-mobile-ads";
import { useTheme } from "../../contexts/ThemeContext";
import { borderRadius, spacing, fontFamily, typography } from "../../constants/theme";
import { useAds } from "../../hooks/useAds";
import { NATIVE_AD_UNIT_ID } from "../../constants/ads";

interface NativeAdCardProps {
  style?: ViewStyle;
}

export default function NativeAdCard({ style }: NativeAdCardProps) {
  const { shouldShowAds, getRequestOptions } = useAds();
  const { colors } = useTheme();
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const adRef = useRef<NativeAd | null>(null);

  useEffect(() => {
    if (!shouldShowAds) return undefined;
    let cancelled = false;

    NativeAd.createForAdRequest(NATIVE_AD_UNIT_ID, getRequestOptions())
      .then((ad) => {
        if (cancelled) {
          ad.destroy();
          return;
        }
        adRef.current = ad;
        setNativeAd(ad);
      })
      .catch((e) => console.log("[Ads] native load error:", e));

    return () => {
      cancelled = true;
      adRef.current?.destroy();
      adRef.current = null;
      setNativeAd(null);
    };
    // getRequestOptions is a stable service method; only re-load on gate change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShowAds]);

  if (!shouldShowAds || !nativeAd) return null;

  return (
    <NativeAdView
      nativeAd={nativeAd}
      style={[
        styles.card,
        {
          backgroundColor: colors.card.background,
          borderColor: colors.border.light,
        },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[styles.sponsoredPill, { backgroundColor: colors.background.tertiary }]}
        >
          <Text style={[styles.sponsoredText, { color: colors.text.tertiary }]}>
            Sponsored
          </Text>
        </View>
        {nativeAd.advertiser ? (
          <NativeAsset assetType={NativeAssetType.ADVERTISER}>
            <Text
              style={[styles.advertiser, { color: colors.text.tertiary }]}
              numberOfLines={1}
            >
              {nativeAd.advertiser}
            </Text>
          </NativeAsset>
        ) : null}
      </View>

      <View style={styles.bodyRow}>
        {nativeAd.icon?.url ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image
              source={{ uri: nativeAd.icon.url }}
              style={[styles.icon, { backgroundColor: colors.background.tertiary }]}
            />
          </NativeAsset>
        ) : null}

        <View style={styles.textCol}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text
              style={[styles.headline, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {nativeAd.headline}
            </Text>
          </NativeAsset>
          {nativeAd.body ? (
            <NativeAsset assetType={NativeAssetType.BODY}>
              <Text
                style={[styles.body, { color: colors.text.secondary }]}
                numberOfLines={2}
              >
                {nativeAd.body}
              </Text>
            </NativeAsset>
          ) : null}
        </View>

        {nativeAd.callToAction ? (
          <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
            <View style={[styles.cta, { backgroundColor: colors.primary.main }]}>
              <Text style={styles.ctaText} numberOfLines={1}>
                {nativeAd.callToAction}
              </Text>
            </View>
          </NativeAsset>
        ) : null}
      </View>
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sponsoredPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  sponsoredText: {
    fontSize: 10,
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  advertiser: {
    flexShrink: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSizes.xs,
    fontFamily: fontFamily.regular,
    textAlign: "right",
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  textCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headline: {
    fontSize: typography.fontSizes.base,
    fontFamily: fontFamily.semibold,
  },
  body: {
    marginTop: 2,
    fontSize: typography.fontSizes.sm,
    fontFamily: fontFamily.regular,
  },
  cta: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: typography.fontSizes.sm,
    fontFamily: fontFamily.semibold,
  },
});
