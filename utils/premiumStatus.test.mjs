// Runnable with: node --test utils/premiumStatus.test.mjs
// Standalone (no Jest in this repo) regression tests for Pro/Premium gating.
import { test } from "node:test";
import assert from "node:assert/strict";
import premiumStatus from "./premiumStatus.js";

const { hasActivePremiumEntitlement, resolveIsPro } = premiumStatus;

const NOW = new Date("2026-06-12T00:00:00.000Z");
const FUTURE = new Date("2026-12-31T00:00:00.000Z").toISOString();
const PAST = new Date("2026-01-01T00:00:00.000Z").toISOString();

const withEntitlement = (id, props = {}) => ({
  entitlements: { active: { [id]: { productIdentifier: "monthly", ...props } } },
});

test("active premium (no expiry) => true", () => {
  assert.equal(hasActivePremiumEntitlement(withEntitlement("premium"), NOW), true);
});

test("active premium with future expiry => true", () => {
  assert.equal(
    hasActivePremiumEntitlement(withEntitlement("premium", { expirationDate: FUTURE }), NOW),
    true
  );
});

test("expired premium => false", () => {
  assert.equal(
    hasActivePremiumEntitlement(withEntitlement("premium", { expirationDate: PAST }), NOW),
    false
  );
});

test("capitalised 'Premium' entitlement id is detected", () => {
  assert.equal(hasActivePremiumEntitlement(withEntitlement("Premium"), NOW), true);
});

test("no entitlements => false", () => {
  assert.equal(hasActivePremiumEntitlement({ entitlements: { active: {} } }, NOW), false);
  assert.equal(hasActivePremiumEntitlement(null, NOW), false);
});

// THE production bug: purchase confirmed on-device, backend webhook has not yet
// written the subscription (or landed on a different app_user_id). The user
// MUST be Pro from the SDK signal alone.
test("REGRESSION: SDK purchase active but backend not updated => user is Pro", () => {
  const sdkPremium = hasActivePremiumEntitlement(withEntitlement("Premium"), NOW);
  const backendPremium = false; // webhook lag / app_user_id mismatch
  assert.equal(sdkPremium, true);
  assert.equal(resolveIsPro(sdkPremium, backendPremium), true);
});

test("backend can never revoke a confirmed SDK purchase", () => {
  assert.equal(resolveIsPro(true, false), true);
});

test("premium persisted on backend only (e.g. other device) => Pro", () => {
  assert.equal(resolveIsPro(false, true), true);
});

test("genuinely free (sdk false, backend false) => not Pro", () => {
  assert.equal(resolveIsPro(false, false), false);
});
