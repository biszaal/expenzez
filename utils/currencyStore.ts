/**
 * Active currency store.
 *
 * Holds the user's current display-currency code so that non-React code
 * (e.g. the `services/api/*` formatting helpers) can read it without
 * prop-drilling. `CurrencyContext` is the single writer — it calls
 * `setActiveCurrency` whenever the preference loads or changes.
 *
 * This is a display preference only: amounts are never converted, just
 * formatted with the chosen currency's symbol/locale.
 */

const DEFAULT_ACTIVE_CURRENCY = "GBP";

let activeCurrency = DEFAULT_ACTIVE_CURRENCY;

/** Returns the current display-currency ISO 4217 code (e.g. "GBP"). */
export function getActiveCurrency(): string {
  return activeCurrency;
}

/** Sets the current display-currency code. Ignores empty/invalid input. */
export function setActiveCurrency(code: string): void {
  if (code && code.length === 3) {
    activeCurrency = code.toUpperCase();
  }
}
