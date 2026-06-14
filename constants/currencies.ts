/**
 * Curated list of display currencies the app supports.
 *
 * This is a *display* preference: choosing a currency changes how amounts
 * are formatted (symbol, separators, decimal places) — it never converts
 * stored values. Each entry carries a formatting `locale` so `Intl` renders
 * the amount the way that currency is conventionally written.
 */

export interface CurrencyOption {
  code: string; // ISO 4217 code, e.g. "GBP"
  name: string; // Human-readable name for the picker
  symbol: string; // Symbol used for the fallback formatter / picker
  locale: string; // BCP-47 locale used for Intl formatting
}

export const DEFAULT_CURRENCY = "GBP";

export const CURRENCIES: CurrencyOption[] = [
  { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB" },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE" },
  { code: "CAD", name: "Canadian Dollar", symbol: "$", locale: "en-CA" },
  { code: "AUD", name: "Australian Dollar", symbol: "$", locale: "en-AU" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "$", locale: "en-NZ" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", locale: "zh-CN" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", locale: "de-CH" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", locale: "sv-SE" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", locale: "nb-NO" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", locale: "da-DK" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", locale: "pl-PL" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", locale: "cs-CZ" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", locale: "hu-HU" },
  { code: "RON", name: "Romanian Leu", symbol: "lei", locale: "ro-RO" },
  { code: "ZAR", name: "South African Rand", symbol: "R", locale: "en-ZA" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", locale: "ar-AE" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", locale: "ar-SA" },
  { code: "SGD", name: "Singapore Dollar", symbol: "$", locale: "en-SG" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "$", locale: "en-HK" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", locale: "ms-MY" },
  { code: "THB", name: "Thai Baht", symbol: "฿", locale: "th-TH" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", locale: "en-PH" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", locale: "id-ID" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", locale: "tr-TR" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", locale: "pt-BR" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", locale: "es-MX" },
  { code: "ARS", name: "Argentine Peso", symbol: "$", locale: "es-AR" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", locale: "en-NG" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", locale: "en-KE" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨", locale: "en-PK" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", locale: "bn-BD" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "₨", locale: "si-LK" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", locale: "ko-KR" },
];

export const CURRENCY_MAP: Record<string, CurrencyOption> = CURRENCIES.reduce(
  (acc, c) => {
    acc[c.code] = c;
    return acc;
  },
  {} as Record<string, CurrencyOption>
);

/** Whether a given code is one of the supported display currencies. */
export function isSupportedCurrency(code?: string | null): boolean {
  return !!code && !!CURRENCY_MAP[code.toUpperCase()];
}

/** Locale used to format a given currency (falls back to en-GB). */
export function localeForCurrency(code?: string | null): string {
  return (code && CURRENCY_MAP[code.toUpperCase()]?.locale) || "en-GB";
}

/** Symbol for a given currency (falls back to the code itself). */
export function symbolForCurrency(code?: string | null): string {
  if (!code) return "£";
  return CURRENCY_MAP[code.toUpperCase()]?.symbol || code.toUpperCase();
}
