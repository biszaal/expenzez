/**
 * useAds — single source of truth for whether ads may be shown right now.
 *
 * Every ad component calls this and renders null when `shouldShowAds` is false,
 * so the Pro-free / established-users-only / consent / kill-switch rules all
 * live in one place.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { adsService } from "../services/ads";
import { ADS_ENABLED } from "../constants/ads";
import { useRevenueCat } from "../contexts/RevenueCatContext";
import { useAuth } from "../app/auth/AuthContext";

export interface UseAdsReturn {
  shouldShowAds: boolean;
  canRequestPersonalized: boolean;
  getRequestOptions: () => { requestNonPersonalizedAdsOnly: boolean };
}

export function useAds(): UseAdsReturn {
  const adsState = useSyncExternalStore(
    adsService.subscribe,
    adsService.getState,
    adsService.getState
  );

  const { isPro, isLoading: subLoading } = useRevenueCat();
  const auth = useAuth();
  const isLoggedIn = auth?.isLoggedIn ?? false;

  // "Established users only": new users mid-onboarding never see ads.
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem("onboarding_completed")
      .then((v) => {
        if (mounted) setOnboardingComplete(v === "true");
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  const shouldShowAds =
    ADS_ENABLED &&
    adsState.available &&
    adsState.initialized &&
    adsState.consentResolved &&
    isLoggedIn &&
    onboardingComplete &&
    !subLoading && // wait until RevenueCat resolves, don't flash ads at Pro users
    !isPro;

  return {
    shouldShowAds,
    canRequestPersonalized: adsState.canRequestPersonalized,
    getRequestOptions: adsService.getRequestOptions,
  };
}
