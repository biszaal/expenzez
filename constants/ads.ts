/**
 * AdMob configuration — ad unit IDs and the global ads kill switch.
 *
 * In development (__DEV__) we ALWAYS use Google's built-in TestIds. Using real
 * ad unit IDs in development and tapping your own ads is "invalid activity" and
 * will get the AdMob account permanently banned. Real unit IDs are only ever
 * read from EAS env vars in a production build.
 *
 * Real unit IDs are injected via EAS env (see eas.json). Until the AdMob units
 * exist they fall back to TestIds, so a build is never wired to a missing unit.
 */

import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

/**
 * Global kill switch. Ads are on unless EXPO_PUBLIC_ADS_ENABLED is exactly
 * "false". This lets us disable all ads via an EAS env change + OTA/rebuild
 * without touching code (there's no remote-config infra in the app).
 */
export const ADS_ENABLED = process.env.EXPO_PUBLIC_ADS_ENABLED !== "false";

const pick = (ios?: string, android?: string) =>
  (Platform.OS === "ios" ? ios : android) || undefined;

/**
 * Native (in-feed) ad unit. Test ID in dev; real unit from env in production.
 */
export const NATIVE_AD_UNIT_ID = __DEV__
  ? TestIds.NATIVE
  : pick(
      process.env.EXPO_PUBLIC_ADMOB_NATIVE_IOS,
      process.env.EXPO_PUBLIC_ADMOB_NATIVE_ANDROID
    ) ?? TestIds.NATIVE;

/**
 * Anchored adaptive banner ad unit. Test ID in dev; real unit from env in prod.
 */
export const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : pick(
      process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS,
      process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID
    ) ?? TestIds.ADAPTIVE_BANNER;

/**
 * Insert one native ad after every Nth transaction row in the feed. Kept
 * spacious to avoid accidental clicks next to interactive rows (AdMob policy).
 */
export const NATIVE_AD_FEED_INTERVAL = 7;
