/**
 * AdBanner — an anchored adaptive banner.
 *
 * Renders null unless ads are allowed (useAds). Height is reserved so the
 * layout doesn't jump when the ad loads, and it keeps clear of interactive
 * controls (accidental-click policy).
 */

import React, { useState } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useAds } from "../../hooks/useAds";
import { BANNER_AD_UNIT_ID } from "../../constants/ads";
import { spacing } from "../../constants/theme";

// Guarded require so a missing/stale native module degrades to "no ad" instead
// of throwing at import (the package eagerly calls getEnforcing on the native
// turbo module, which crashes a dev client built before the module existed).
let GMA: any = null;
try {
  GMA = require("react-native-google-mobile-ads");
} catch {
  GMA = null;
}
const BannerAd = GMA?.BannerAd;
const ANCHORED_ADAPTIVE =
  GMA?.BannerAdSize?.ANCHORED_ADAPTIVE_BANNER ?? "ANCHORED_ADAPTIVE_BANNER";

interface AdBannerProps {
  style?: ViewStyle;
}

export default function AdBanner({ style }: AdBannerProps) {
  const { shouldShowAds, getRequestOptions } = useAds();
  const [failed, setFailed] = useState(false);

  if (!shouldShowAds || failed || !BannerAd) return null;

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={ANCHORED_ADAPTIVE}
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
