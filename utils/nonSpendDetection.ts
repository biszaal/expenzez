// Mirror of the backend functions/lib/nonSpendDetection.ts. Detects "non-spend"
// money movement (internal transfers, savings/pot moves, credit-card payments,
// transfers to/from self) that should not count in spend analysis. Conservative
// by design so genuine purchases/income are never auto-excluded.

export interface NonSpendContext {
  userName?: string; // account holder's name, to spot transfers to/from self
}

export interface NonSpendResult {
  excluded: boolean;
  reason: string | null;
}

const PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /\b(transfer|trf)\b/, reason: "transfer" },
  { re: /\binternal\b/, reason: "internal" },
  { re: /\(self\)/, reason: "self" },
  { re: /\bown account\b/, reason: "own_account" },
  { re: /\baccount to\b/, reason: "account_move" },
  { re: /\bto\b[^.]*\b(saver|savings|isa|pot)\b/, reason: "to_savings" },
  { re: /\bfrom\b[^.]*\b(saver|savings|isa)\b/, reason: "from_savings" },
  { re: /credit card payment/, reason: "card_payment" },
  { re: /\bcc payment\b/, reason: "card_payment" },
  { re: /\bround[\s-]?up\b/, reason: "roundup" },
];

export function detectNonSpend(
  txn: { description?: string; merchant?: string; category?: string },
  ctx: NonSpendContext = {}
): NonSpendResult {
  const category = String(txn.category || "").toLowerCase();
  if (category.includes("transfer") || category.includes("internal")) {
    return { excluded: true, reason: "transfer_category" };
  }

  const text = `${txn.description || ""} ${txn.merchant || ""}`.toLowerCase();

  const name = String(ctx.userName || "").trim().toLowerCase();
  if (name.length >= 4 && text.includes(name)) {
    return { excluded: true, reason: "self_name" };
  }

  for (const { re, reason } of PATTERNS) {
    if (re.test(text)) return { excluded: true, reason };
  }

  return { excluded: false, reason: null };
}

/**
 * Effective exclusion: an explicit user override (excludeFromSpend) always
 * wins; otherwise fall back to auto-detection.
 */
export function isExcludedFromSpend(
  txn: { excludeFromSpend?: boolean | null } & Parameters<typeof detectNonSpend>[0],
  ctx: NonSpendContext = {}
): boolean {
  if (txn.excludeFromSpend === true) return true;
  if (txn.excludeFromSpend === false) return false;
  return detectNonSpend(txn, ctx).excluded;
}
