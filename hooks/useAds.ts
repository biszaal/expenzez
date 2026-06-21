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
  /** Current adsService.setup() phase — diagnostics only. */
  phase: string;
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

  // Kick off ad-SDK setup as soon as THIS hook's own conditions are met. setup()
  // is idempotent (guarded by setupStarted), so it's safe that _layout also calls
  // it — but triggering it here means ad init no longer depends on _layout's
  // separate copy of the gating, which can lag or differ (the observed bug:
  // setup() never ran, so the SDK stayed uninitialised).
  useEffect(() => {
    if (
      adsState.available &&
      isLoggedIn &&
      onboardingComplete &&
      !subLoading &&
      (DEV_IGNORE_PRO || !isPro)
    ) {
      adsService.setup();
    }
  }, [adsState.available, isLoggedIn, onboardingComplete, subLoading, isPro]);

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
    phase: adsState.phase,
  };
}
