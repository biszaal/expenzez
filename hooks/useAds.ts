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
import { ADS_ENABLED, DEV_IGNORE_PRO } from "../constants/ads";
import { useRevenueCat } from "../contexts/RevenueCatContext";
import { useAuth } from "../app/auth/AuthContext";

/** Per-condition breakdown of the ad gate — surfaced for the diagnostics card. */
export interface AdsGates {
  adsEnabled: boolean;
  available: boolean;
  initialized: boolean;
  consentResolved: boolean;
  isLoggedIn: boolean;
  onboardingComplete: boolean;
  subLoading: boolean;
  isPro: boolean;
  devIgnorePro: boolean;
}

export interface UseAdsReturn {
  shouldShowAds: boolean;
  canRequestPersonalized: boolean;
  getRequestOptions: () => { requestNonPersonalizedAdsOnly: boolean };
  /** Why ads are / aren't showing. Read by the AdsDebugCard. */
  gates: AdsGates;
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
    (DEV_IGNORE_PRO || !isPro);

  return {
    shouldShowAds,
    canRequestPersonalized: adsState.canRequestPersonalized,
    getRequestOptions: adsService.getRequestOptions,
    gates: {
      adsEnabled: ADS_ENABLED,
      available: adsState.available,
      initialized: adsState.initialized,
      consentResolved: adsState.consentResolved,
      isLoggedIn,
      onboardingComplete,
      subLoading,
      isPro,
      devIgnorePro: DEV_IGNORE_PRO,
    },
  };
}
