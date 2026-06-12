import AsyncStorage from "@react-native-async-storage/async-storage";
import { BRANDFETCH_CLIENT_ID } from "../config/logos";

// Resolves messy bank-statement merchant strings (e.g. "ADIDASUKLIM7300.4386.603")
// to a brand domain via the Brandfetch Search API, so logos work at scale without
// hand-curating every merchant. Results are cached on-device (memory + AsyncStorage,
// including misses) and in-flight lookups are de-duplicated.

// Business-suffix tokens banks tack on, often with no separating space. Peeled
// from the end of the (cleaned) name so "adidasuklim" → "adidas".
const SUFFIX_TOKENS = [
  "uk", "gb", "usa", "ltd", "limited", "lim", "plc", "inc", "llc", "intl",
  "international", "stores", "store", "online", "com", "co", "group",
  "holdings", "services", "payments", "retail",
];

// Generic transaction words that are never a brand — skip the network lookup.
const GENERIC = new Set([
  "payment", "received", "transfer", "deposit", "withdrawal", "withdraw",
  "refund", "interest", "income", "salary", "cash", "atm", "direct", "debit",
  "credit", "thank", "you", "faster", "standing", "order", "bill", "fee",
  "charge", "reversal", "adjustment", "topup", "roundup", "round",
]);

const CACHE_PREFIX = "merchant_domain_v1_";
const NONE = "__none__"; // sentinel for a cached miss

const memoryCache = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

/**
 * Turn a raw bank description into a brand-search query: drop card prefixes,
 * reference numbers / store codes, punctuation, then peel trailing business
 * suffix tokens (works for both spaced and concatenated names).
 */
export function normalizeMerchantQuery(raw?: string): string {
  if (!raw) return "";
  let s = raw
    .toLowerCase()
    .replace(/^(card payment to|payment to|direct debit to|standing order to)\s+/i, "")
    .replace(/\d[\d.\-/]*/g, " ") // strip numbers, refs, store codes
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let tokens = s.split(" ").filter(Boolean);

  // Multi-word: drop trailing suffix tokens ("tesco stores" → "tesco").
  while (tokens.length > 1 && SUFFIX_TOKENS.includes(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  // Single concatenated word: iteratively peel trailing suffixes
  // ("adidasuklim" → "adidasuk" → "adidas").
  if (tokens.length === 1) {
    let t = tokens[0];
    let changed = true;
    while (changed) {
      changed = false;
      for (const suf of SUFFIX_TOKENS) {
        if (t.length > suf.length + 2 && t.endsWith(suf)) {
          t = t.slice(0, -suf.length);
          changed = true;
          break;
        }
      }
    }
    tokens = [t];
  }

  return tokens.join(" ").trim();
}

// Pick the most trustworthy brand match — prefer verified, then quality/score —
// to avoid showing a wrong logo for a loose match.
function pickBestDomain(results: any[], query: string): string | null {
  if (!Array.isArray(results)) return null;
  const first = query.split(" ")[0];
  const candidates = results.filter((b) => {
    if (!b?.domain) return false;
    const name = String(b.name || "").toLowerCase();
    const matchesName =
      name.includes(query) || query.includes(name) || name.includes(first);
    const trustworthy = b.verified === true || (b.qualityScore ?? 0) >= 0.5;
    return matchesName && trustworthy;
  });
  if (candidates.length === 0) return null;
  candidates.sort(
    (a, b) =>
      Number(!!b.verified) - Number(!!a.verified) ||
      (b.qualityScore ?? 0) - (a.qualityScore ?? 0) ||
      (b._score ?? 0) - (a._score ?? 0)
  );
  return candidates[0].domain || null;
}

export async function resolveMerchantDomain(
  raw?: string
): Promise<string | null> {
  if (!BRANDFETCH_CLIENT_ID) return null;

  const query = normalizeMerchantQuery(raw);
  if (query.length < 3) return null;
  if (query.split(" ").every((w) => GENERIC.has(w))) return null;

  if (memoryCache.has(query)) return memoryCache.get(query)!;
  if (inFlight.has(query)) return inFlight.get(query)!;

  const lookup = (async (): Promise<string | null> => {
    const cacheKey = `${CACHE_PREFIX}${query}`;
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached !== null) {
        const value = cached === NONE ? null : cached;
        memoryCache.set(query, value);
        return value;
      }
    } catch {
      /* ignore cache read errors */
    }

    let domain: string | null = null;
    try {
      const res = await fetch(
        `https://api.brandfetch.io/v2/search/${encodeURIComponent(query)}?c=${BRANDFETCH_CLIENT_ID}`
      );
      if (res.ok) {
        domain = pickBestDomain(await res.json(), query);
      }
    } catch {
      /* network error → treat as no match (cached below) */
    }

    memoryCache.set(query, domain);
    try {
      await AsyncStorage.setItem(cacheKey, domain || NONE);
    } catch {
      /* ignore cache write errors */
    }
    return domain;
  })();

  inFlight.set(query, lookup);
  try {
    return await lookup;
  } finally {
    inFlight.delete(query);
  }
}
