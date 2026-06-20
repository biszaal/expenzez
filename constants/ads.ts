/**
 * AdMob configuration — ad unit IDs and the global ads kill switch.
 *
 * In development (__DEV__) we ALWAYS use Google's built-in test ad unit IDs.
 * Using real ad unit IDs in development and tapping your own ads is "invalid
 * activity" and will get the AdMob account permanently banned. Real unit IDs
 * are only ever read from EAS env vars in a production build.
 *
 * The test IDs are hardcoded (Google's public values) rather than imported from
 * react-native-google-mobile-ads on purpose: importing that package eagerly
 * calls TurboModuleRegistry.getEnforcing, which throws when the native module
 * isn't in the build (e.g. a dev client built before the module was added).
 * Keeping this file free of the native import means it can never crash the
 * screens that import it.
 */

import { Platform } from "react-native";

/**
 * Global kill switch. Ads are on unless EXPO_PUBLIC_ADS_ENABLED is exactly
 * "false". This lets us disable all ads via an EAS env change + OTA/rebuild
 * without touching code (there's no remote-config infra in the app).
 */
export const ADS_ENABLED = process.env.EXPO_PUBLIC_ADS_ENABLED !== "false";

/**
 * Dev-only override: show ads even when signed in as a Pro account, so ad
 * placements can be previewed without a separate free account. Hard-gated on
 * __DEV__ so it can NEVER fire in a production build — Pro users in release
 * builds always see zero ads. Enable by starting Metro with
 * EXPO_PUBLIC_ADS_IGNORE_PRO=true.
 */
export const DEV_IGNORE_PRO =
  __DEV__ && process.env.EXPO_PUBLIC_ADS_IGNORE_PRO === "true";

// Google's public test ad unit IDs — safe to render anywhere.
const TEST_NATIVE =
  (Platform.OS === "ios"
    ? "ca-app-pub-3940256099942544/3986624511"
    : "ca-app-pub-3940256099942544/2247696110");
const TEST_BANNER =
  (Platform.OS === "ios"
    ? "ca-app-pub-3940256099942544/2435281174"
    : "ca-app-pub-3940256099942544/9214589741");

const pick = (ios?: string, android?: string) =>
  (Platform.OS === "ios" ? ios : android) || undefined;

/**
 * Native (in-feed) ad unit. Test ID in dev; real unit from env in production.
 */
export const NATIVE_AD_UNIT_ID = __DEV__
  ? TEST_NATIVE
  : pick(
      process.env.EXPO_PUBLIC_ADMOB_NATIVE_IOS,
      process.env.EXPO_PUBLIC_ADMOB_NATIVE_ANDROID
    ) ?? TEST_NATIVE;

/**
 * Anchored adaptive banner ad unit. Test ID in dev; real unit from env in prod.
 */
export const BANNER_AD_UNIT_ID = __DEV__
  ? TEST_BANNER
  : pick(
      process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS,
      process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID
    ) ?? TEST_BANNER;

/**
 * Insert one native ad after every Nth transaction row in the feed. Kept
 * spacious to avoid accidental clicks next to interactive rows (AdMob policy).
 */
export const NATIVE_AD_FEED_INTERVAL = 7;
