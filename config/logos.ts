// Brandfetch "Logo Link" client ID for fetching high-quality brand logos by
// domain. This is a PUBLIC, embeddable client ID (not a secret) — safe to ship
// in the app. Get a free one at https://brandfetch.com/developers (Brand Logo
// Link / "Logo Link" product), then either:
//   • paste it as the fallback string below, or
//   • set EXPO_PUBLIC_BRANDFETCH_CLIENT_ID in your environment / EAS secrets.
//
// When empty, MerchantLogo falls back to Clearbit automatically, so logos keep
// working — they're just sourced from Clearbit instead of Brandfetch.
export const BRANDFETCH_CLIENT_ID =
  process.env.EXPO_PUBLIC_BRANDFETCH_CLIENT_ID || "1id1tA9o-wCw6GNo49z";
