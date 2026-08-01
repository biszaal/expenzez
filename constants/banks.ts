// Frontend mirror of expenzez-backend/src/constants/banks.ts, plus the display
// data the backend doesn't care about: brand colour and a domain for the logo.
//
// Kept in sync by bankId. The backend decides which bank a statement came from;
// this file decides what that bank looks like.

import { Ionicons } from "@expo/vector-icons";

export interface BankBrand {
  bankId: string;
  name: string;
  /** Lowercase substrings matched against a bank name when no id is known. */
  aliases: string[];
  /** Domain used to fetch a favicon logo. Omit when there's no useful site. */
  domain?: string;
  colorHex: string;
}

export const BANK_BRANDS: BankBrand[] = [
  { bankId: "amex", name: "American Express", aliases: ["american express", "amex"], domain: "americanexpress.com", colorHex: "#006FCF" },
  { bankId: "barclays", name: "Barclays", aliases: ["barclays bank", "barclays"], domain: "barclays.co.uk", colorHex: "#00AEEF" },
  { bankId: "barclaycard", name: "Barclaycard", aliases: ["barclaycard"], domain: "barclaycard.co.uk", colorHex: "#00395D" },
  { bankId: "chase", name: "Chase", aliases: ["chase uk", "chase"], domain: "chase.co.uk", colorHex: "#117ACA" },
  { bankId: "lloyds", name: "Lloyds Bank", aliases: ["lloyds bank", "lloyds"], domain: "lloydsbank.com", colorHex: "#006A4D" },
  { bankId: "halifax", name: "Halifax", aliases: ["halifax"], domain: "halifax.co.uk", colorHex: "#005EB8" },
  { bankId: "bank_of_scotland", name: "Bank of Scotland", aliases: ["bank of scotland"], domain: "bankofscotland.co.uk", colorHex: "#00205B" },
  { bankId: "natwest", name: "NatWest", aliases: ["natwest", "national westminster"], domain: "natwest.com", colorHex: "#5A287F" },
  { bankId: "rbs", name: "Royal Bank of Scotland", aliases: ["royal bank of scotland", "rbs"], domain: "rbs.co.uk", colorHex: "#142A66" },
  { bankId: "santander", name: "Santander", aliases: ["santander"], domain: "santander.co.uk", colorHex: "#EC0000" },
  { bankId: "hsbc", name: "HSBC", aliases: ["hsbc"], domain: "hsbc.co.uk", colorHex: "#DB0011" },
  { bankId: "first_direct", name: "first direct", aliases: ["first direct"], domain: "firstdirect.com", colorHex: "#1A1A1A" },
  { bankId: "nationwide", name: "Nationwide", aliases: ["nationwide"], domain: "nationwide.co.uk", colorHex: "#1B3A6B" },
  { bankId: "monzo", name: "Monzo", aliases: ["monzo"], domain: "monzo.com", colorHex: "#FF4F40" },
  { bankId: "starling", name: "Starling Bank", aliases: ["starling"], domain: "starlingbank.com", colorHex: "#6935D3" },
  { bankId: "revolut", name: "Revolut", aliases: ["revolut"], domain: "revolut.com", colorHex: "#0666EB" },
  { bankId: "wise", name: "Wise", aliases: ["transferwise", "wise"], domain: "wise.com", colorHex: "#163300" },
  { bankId: "tsb", name: "TSB", aliases: ["tsb bank", "tsb"], domain: "tsb.co.uk", colorHex: "#2D3E85" },
  { bankId: "co_operative", name: "The Co-operative Bank", aliases: ["co-operative bank", "co-op bank"], domain: "co-operativebank.co.uk", colorHex: "#00B1E7" },
  { bankId: "metro", name: "Metro Bank", aliases: ["metro bank"], domain: "metrobankonline.co.uk", colorHex: "#E4003B" },
  { bankId: "virgin_money", name: "Virgin Money", aliases: ["virgin money"], domain: "virginmoney.com", colorHex: "#E10A0A" },
  { bankId: "mbna", name: "MBNA", aliases: ["mbna"], domain: "mbna.co.uk", colorHex: "#C8102E" },
  { bankId: "capital_one", name: "Capital One", aliases: ["capital one"], domain: "capitalone.co.uk", colorHex: "#004977" },
  { bankId: "vanquis", name: "Vanquis", aliases: ["vanquis"], domain: "vanquis.co.uk", colorHex: "#00A0AF" },
  { bankId: "zopa", name: "Zopa", aliases: ["zopa"], domain: "zopa.com", colorHex: "#00CFB5" },
  { bankId: "tesco_bank", name: "Tesco Bank", aliases: ["tesco bank"], domain: "tescobank.com", colorHex: "#00539F" },
  { bankId: "m_and_s_bank", name: "M&S Bank", aliases: ["m&s bank", "marks and spencer bank"], domain: "bank.marksandspencer.com", colorHex: "#004A3F" },
  { bankId: "john_lewis", name: "John Lewis Finance", aliases: ["john lewis finance", "john lewis partnership card"], domain: "johnlewisfinance.com", colorHex: "#4B4B4B" },
  { bankId: "sainsburys_bank", name: "Sainsbury's Bank", aliases: ["sainsbury's bank", "sainsburys bank"], domain: "sainsburysbank.co.uk", colorHex: "#F06C00" },
  { bankId: "paypal", name: "PayPal", aliases: ["paypal"], domain: "paypal.com", colorHex: "#003087" },
];

// Longest alias first so a specific brand beats one that is a substring of it.
const ALIAS_INDEX = BANK_BRANDS.flatMap((bank) =>
  bank.aliases.map((alias) => ({ alias, bank }))
).sort((a, b) => b.alias.length - a.alias.length);

const BY_ID = new Map(BANK_BRANDS.map((b) => [b.bankId, b]));

export const bankLogoUrl = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

/**
 * How to draw an account's mark.
 *
 * `icon` is used for the two synthetic accounts — "Other bank" and "Manual
 * Entry" aren't brands, and rendering "OB"/"ME" as initials made them look
 * like banks whose logo had failed to load.
 */
export interface BankVisual {
  kind: "logo" | "icon" | "initials";
  colorHex: string;
  logoUrl?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  initials?: string;
}

// Palette for banks we don't recognise. Picked deterministically from the name
// so two unknown banks look different rather than both defaulting to grey.
const FALLBACK_PALETTE = [
  "#4E7CFF",
  "#7A5AF8",
  "#0EA5A5",
  "#E06C2B",
  "#D9488A",
  "#3F8F4F",
  "#5B6B8C",
];

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "?";

const colorFromName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
};

/** Match free text (a bank name) to a known brand. */
export function resolveBankBrand(
  bankId?: string | null,
  bankName?: string | null
): BankBrand | null {
  if (bankId) {
    const byId = BY_ID.get(bankId);
    if (byId) return byId;
  }
  const haystack = String(bankName || "").toLowerCase();
  if (!haystack.trim()) return null;
  for (const { alias, bank } of ALIAS_INDEX) {
    if (haystack.includes(alias)) return bank;
  }
  return null;
}

export function getBankVisual(
  bankId?: string | null,
  bankName?: string | null
): BankVisual {
  const name = String(bankName || "").trim();
  const lower = name.toLowerCase();
  const id = String(bankId || "").toLowerCase();

  // Manual entries: the user typed these in, they have no bank.
  if (id === "manual" || lower === "manual entry" || lower.startsWith("manual")) {
    return { kind: "icon", colorHex: "#7A5AF8", iconName: "create-outline" };
  }

  // The explicit "we couldn't identify this" bucket.
  if (id === "other" || lower === "other bank" || lower === "unknown") {
    return { kind: "icon", colorHex: "#5B6B8C", iconName: "business-outline" };
  }

  // Statement/CSV imports that never got a bank attached.
  if (
    id.startsWith("statement") ||
    id.startsWith("csv") ||
    lower === "statement import" ||
    lower === "csv import"
  ) {
    return { kind: "icon", colorHex: "#5B6B8C", iconName: "document-text-outline" };
  }

  const brand = resolveBankBrand(bankId, bankName);
  if (brand?.domain) {
    return {
      kind: "logo",
      colorHex: brand.colorHex,
      logoUrl: bankLogoUrl(brand.domain),
      initials: initialsOf(brand.name),
    };
  }
  if (brand) {
    return {
      kind: "initials",
      colorHex: brand.colorHex,
      initials: initialsOf(brand.name),
    };
  }

  return {
    kind: "initials",
    colorHex: colorFromName(name || "bank"),
    initials: initialsOf(name || "?"),
  };
}
