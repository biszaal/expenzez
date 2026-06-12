/**
 * Pure helpers for deciding Premium ("Pro") access.
 *
 * Extracted into one place so the decision is unit-testable and consistent
 * everywhere. The RevenueCat SDK's CustomerInfo is the authoritative, immediate
 * client-side source of truth for store entitlements. The backend `isPremium`
 * flag is a SECONDARY signal that covers cross-device state and webhook
 * persistence.
 *
 * `isPro = SDK_premium OR backend_premium`, so a delayed, failed, or
 * wrong-app_user_id backend can never revoke a purchase the SDK has already
 * confirmed on-device. This is what fixes "purchase succeeded but Pro never
 * activated".
 *
 * Authored as .js (with a sibling .d.ts) so it can be imported by the TSX
 * context AND exercised directly by a plain-Node test without a TS runner.
 */

// RevenueCat entitlement identifier. Historically referenced with both casings
// across the codebase, so we accept either.
const PREMIUM_ENTITLEMENT_IDS = ["premium", "Premium"];

/**
 * Returns the active premium entitlement object from a RevenueCat CustomerInfo,
 * or null if none is present.
 */
function getPremiumEntitlement(customerInfo) {
  const active =
    customerInfo &&
    customerInfo.entitlements &&
    customerInfo.entitlements.active;
  if (!active) return null;
  for (const id of PREMIUM_ENTITLEMENT_IDS) {
    if (active[id]) return active[id];
  }
  return null;
}

/**
 * True when CustomerInfo grants an active, non-expired premium entitlement.
 * Expiry is validated client-side as a safety net in case the SDK surfaces a
 * stale-but-expired entitlement.
 */
function hasActivePremiumEntitlement(customerInfo, now = new Date()) {
  const ent = getPremiumEntitlement(customerInfo);
  if (!ent) return false;

  if (ent.expirationDate) {
    const expiry = new Date(ent.expirationDate);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() <= now.getTime()) {
      return false; // expired
    }
  }
  return true;
}

/**
 * Combines the two independent premium signals. Either being true grants Pro.
 */
function resolveIsPro(sdkPremium, backendPremium) {
  return Boolean(sdkPremium) || Boolean(backendPremium);
}

module.exports = {
  PREMIUM_ENTITLEMENT_IDS,
  getPremiumEntitlement,
  hasActivePremiumEntitlement,
  resolveIsPro,
};
