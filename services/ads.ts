/**
 * Ads service — runs the consent flow (Google UMP for UK/EEA GDPR + iOS App
 * Tracking Transparency) and initialises the Google Mobile Ads SDK, then
 * exposes a small subscribable store so the gating hook (hooks/useAds.ts) can
 * react when the SDK becomes ready.
 *
 * Consent is persisted by the UMP SDK itself, so there is no AsyncStorage here.
 * The native module is required lazily inside try/catch (mirroring
 * services/analytics.ts) so the app degrades to "no ads" instead of crashing
 * if the native module is missing (e.g. Expo Go).
 */

import { Platform } from "react-native";

// Native ad SDK — guarded so a missing native module degrades gracefully.
let mobileAds: any = null;
let AdsConsent: any = null;
let MaxAdContentRating: any = null;
let adsModuleAvailable = false;
try {
  const ads = require("react-native-google-mobile-ads");
  mobileAds = ads.default;
  AdsConsent = ads.AdsConsent;
  MaxAdContentRating = ads.MaxAdContentRating;
  adsModuleAvailable = true;
} catch {
  adsModuleAvailable = false;
}

export type AdsState = {
  /** Native module present (false in Expo Go / web). */
  available: boolean;
  /** mobileAds().initialize() resolved. */
  initialized: boolean;
  /** UMP + ATT flow finished (or was skipped). */
  consentResolved: boolean;
  /** Whether personalised ads may be requested (UMP consent + iOS ATT). */
  canRequestPersonalized: boolean;
};

class AdsService {
  private state: AdsState = {
    available: adsModuleAvailable,
    initialized: false,
    consentResolved: false,
    canRequestPersonalized: false,
  };
  private listeners = new Set<() => void>();
  private setupStarted = false;

  /** Stable snapshot for useSyncExternalStore (identity changes only on emit). */
  getState = (): AdsState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Request options to pass on every ad load (personalised vs not). */
  getRequestOptions() {
    return { requestNonPersonalizedAdsOnly: !this.state.canRequestPersonalized };
  }

  private emit() {
    this.state = { ...this.state }; // new identity so subscribers re-read
    this.listeners.forEach((l) => l());
  }

  /**
   * Consent → ATT → initialise. Idempotent: safe to call from an effect that
   * may fire more than once; only the first call does work.
   */
  async setup(): Promise<void> {
    if (!adsModuleAvailable || this.setupStarted) return;
    this.setupStarted = true;

    try {
      // 1) UMP / GDPR consent (UK & EEA). gatherConsent() requests an info
      //    update, then shows the consent form when one is required.
      try {
        await AdsConsent.gatherConsent();
      } catch (e) {
        console.log("[Ads] UMP gatherConsent error:", e);
      }

      // 2) iOS App Tracking Transparency — after UMP so the prompt order is
      //    correct. Android has no ATT, so it counts as granted there.
      let attGranted = Platform.OS !== "ios";
      if (Platform.OS === "ios") {
        try {
          const { requestTrackingPermissionsAsync } = await import(
            "expo-tracking-transparency"
          );
          const { status } = await requestTrackingPermissionsAsync();
          attGranted = status === "granted";
        } catch (e) {
          console.log("[Ads] ATT request error:", e);
        }
      }

      // 3) Personalised ads need UMP canRequestAds AND (on iOS) ATT. Otherwise
      //    we still serve ads, just non-personalised.
      let canRequestAds = true;
      try {
        const info = await AdsConsent.getConsentInfo();
        canRequestAds = info?.canRequestAds !== false;
      } catch {
        // ignore — default to allowed; non-personalised handled by ATT flag
      }
      this.state.canRequestPersonalized = canRequestAds && attGranted;
      this.state.consentResolved = true;
      this.emit();

      // 4) Request configuration — finance app: keep content family-safe and
      //    never child-directed. Must be set before initialize().
      try {
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating?.PG,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        });
      } catch (e) {
        console.log("[Ads] setRequestConfiguration error:", e);
      }

      // 5) Initialise the SDK.
      await mobileAds().initialize();
      this.state.initialized = true;
      this.emit();
    } catch (e) {
      console.log("[Ads] setup failed:", e);
    }
  }

  /**
   * Re-open the UMP privacy options form (for a Settings "manage ad consent"
   * entry). No-op if the native module or form isn't available.
   */
  async showPrivacyOptionsForm(): Promise<void> {
    if (!adsModuleAvailable) return;
    try {
      await AdsConsent.showPrivacyOptionsForm();
    } catch (e) {
      console.log("[Ads] showPrivacyOptionsForm error:", e);
    }
  }
}

export const adsService = new AdsService();
