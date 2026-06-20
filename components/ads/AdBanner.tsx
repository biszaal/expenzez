/**
 * AdBanner — an anchored adaptive banner.
 *
 * Renders null unless ads are allowed (useAds). Height is reserved so the
 * layout doesn't jump when the ad loads, and it keeps clear of interactive
 * controls (accidental-click policy).
 */

import React, { useState } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { useAds } from "../../hooks/useAds";
import { BANNER_AD_UNIT_ID } from "../../constants/ads";
import { spacing } from "../../constants/theme";

interface AdBannerProps {
  style?: ViewStyle;
}

export default function AdBanner({ style }: AdBannerProps) {
  const { shouldShowAds, getRequestOptions } = useAds();
  const [failed, setFailed] = useState(false);

  if (!shouldShowAds || failed) return null;

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={getRequestOptions()}
        onAdFailedToLoad={(error) => {
          console.log("[Ads] banner load error:", error?.message);
          setFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    // Reserve roughly one banner row so the surrounding layout stays stable.
    minHeight: 60,
  },
});
