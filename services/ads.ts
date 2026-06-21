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
  /** How far adsService.setup() has progressed — surfaced for the debug card. */
  phase: string;
};

/**
 * Race a promise against a timer so a stalled native call (a consent fetch that
 * never resolves, an SDK init that hangs) can't block the whole setup flow
 * forever — which would leave `initialized`/`consentResolved` false and show
 * zero ads. On timeout it resolves `undefined` and the flow continues.
 */
function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  label: string
): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => {
      console.log(`[Ads] ${label} timed out after ${ms}ms — continuing`);
      resolve(undefined);
    }, ms);
  });
  return Promise.race([p, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

class AdsService {
  private state: AdsState = {
    available: adsModuleAvailable,
    initialized: false,
    consentResolved: false,
    canRequestPersonalized: false,
    phase: "idle",
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

  /** Record how far setup() has gotten, and notify subscribers (debug card). */
  private setPhase(phase: string) {
    this.state.phase = phase;
    this.emit();
  }

  /**
   * Consent → ATT → initialise. Idempotent: safe to call from an effect that
   * may fire more than once; only the first call does work.
   */
  async setup(): Promise<void> {
    if (!adsModuleAvailable || this.setupStarted) return;
    this.setupStarted = true;

    // Configure + initialise the SDK FIRST, each timeout-guarded. Init doesn't
    // depend on consent, and a slow/stalled consent fetch must never be able to
    // block it — otherwise `initialized` stays false forever and not a single ad
    // renders. Ad *requests* stay withheld until `consentResolved` (see useAds),
    // so initialising early requests nothing and stays policy-safe.
    try {
      this.setPhase("set-config");
      await withTimeout(
        mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating?.PG,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        }),
        5000,
        "setRequestConfiguration"
      );
    } catch (e) {
      console.log("[Ads] setRequestConfiguration error:", e);
    }

    try {
      this.setPhase("initializing");
      await withTimeout(mobileAds().initialize(), 10000, "SDK initialize");
      this.state.initialized = true;
      this.setPhase("initialized");
    } catch (e) {
      console.log("[Ads] initialize error:", e);
      this.setPhase("init-error");
    }

    // Consent flow: UMP (UK & EEA) → iOS ATT, in that order. Each is
    // timeout-guarded — including the dynamic import — so a hung native promise
    // or stalled module resolution can't strand the gate. Whatever the outcome
    // (granted / denied / error / timeout) we mark consent resolved below.
    try {
      this.setPhase("consent");
      await withTimeout(AdsConsent.gatherConsent(), 15000, "UMP gatherConsent");
    } catch (e) {
      console.log("[Ads] UMP gatherConsent error:", e);
    }

    let attGranted = Platform.OS !== "ios";
    if (Platform.OS === "ios") {
      try {
        this.setPhase("att");
        // Guard the dynamic import too — this was the one remaining await with no
        // timeout, so a stalled module resolution here could hang setup() and
        // leave `consentResolved` false forever.
        const mod: any = await withTimeout(
          import("expo-tracking-transparency"),
          5000,
          "import ATT module"
        );
        if (mod?.requestTrackingPermissionsAsync) {
          const res = await withTimeout<any>(
            mod.requestTrackingPermissionsAsync(),
            15000,
            "ATT request"
          );
          attGranted = res?.status === "granted";
        }
      } catch (e) {
        console.log("[Ads] ATT request error:", e);
      }
    }

    // Personalised ads need UMP canRequestAds AND (on iOS) ATT. Otherwise we
    // still serve ads, just non-personalised.
    let canRequestAds = true;
    try {
      this.setPhase("consent-info");
      const info = await withTimeout<any>(
        AdsConsent.getConsentInfo(),
        5000,
        "getConsentInfo"
      );
      canRequestAds = info?.canRequestAds !== false;
    } catch {
      // ignore — default to allowed; non-personalised handled by ATT flag
    }

    this.state.canRequestPersonalized = canRequestAds && attGranted;
    this.state.consentResolved = true;
    this.setPhase("done");
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
