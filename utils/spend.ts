/**
 * The one place the app decides what counts as spending.
 *
 * The backend classifies every transaction into a `spendType` (see
 * expenzez-backend/src/domain/spendClassifier.ts) and that is the answer. This
 * module reads it and nothing else re-derives spend from the amount sign or
 * the category — four hand-rolled copies of that logic are exactly why Home,
 * the Spending tab and the widget used to disagree about the same month.
 *
 * The local fallback exists only for rows the server hasn't classified yet
 * (a just-created manual transaction, or data from before the classifier).
 */

export type SpendType =
  | "spend"
  | "income"
  | "transfer"
  | "card_payment"
  | "refund"
  | "unclassified";

export interface SpendClassified {
  amount: number;
  type?: string;
  date?: string;
  category?: string;
  description?: string;
  merchant?: string;
  spendType?: SpendType | string;
  spendTypeSource?: string;
  spendTypeConfidence?: number;
  excludeFromSpend?: boolean | null;
}

// Mirrors the backend's weakest signals only. Deliberately minimal: the server
// owns classification, this is a stopgap so an optimistic row isn't miscounted
// for the second before it round-trips.
const LOCAL_TRANSFER_PATTERNS = [
  /\b(transfer|trf)\b/,
  /\binternal\b/,
  /\(self\)/,
  /\bown account\b/,
  /\baccount to\b/,
  /\bto\b[^.]*\b(saver|savings|isa|pot)\b/,
  /credit card payment/,
  /\bcc payment\b/,
];

function classifyLocally(txn: SpendClassified): SpendType {
  if (txn.excludeFromSpend === true) return "transfer";
  if (txn.excludeFromSpend === false) return "spend";

  const text = `${txn.description || ""} ${txn.merchant || ""}`.toLowerCase();
  const category = String(txn.category || "").toLowerCase();
  const amount = Number(txn.amount) || 0;
  const isCredit = txn.type === "credit" || (txn.type !== "debit" && amount > 0);

  if (category.includes("transfer") || category.includes("internal")) return "transfer";
  if (LOCAL_TRANSFER_PATTERNS.some((re) => re.test(text))) return "transfer";
  if (isCredit) return "income";
  if (amount === 0) return "unclassified";
  return "spend";
}

/** The effective spend type for a transaction: server first, local fallback. */
export function spendTypeOf(txn: SpendClassified): SpendType {
  if (txn.spendType && txn.spendType !== "unclassified") {
    return txn.spendType as SpendType;
  }
  return classifyLocally(txn);
}

/** True when this transaction belongs in a spend total. */
export function isSpend(txn: SpendClassified): boolean {
  return spendTypeOf(txn) === "spend";
}

/** Only the transactions that count as spending. */
export function spendOnly<T extends SpendClassified>(txns: T[]): T[] {
  return txns.filter(isSpend);
}

export function spendTotal(txns: SpendClassified[]): number {
  return txns.reduce(
    (sum, t) => (isSpend(t) ? sum + Math.abs(Number(t.amount) || 0) : sum),
    0
  );
}

export function incomeTotal(txns: SpendClassified[]): number {
  return txns.reduce(
    (sum, t) => (spendTypeOf(t) === "income" ? sum + Math.abs(Number(t.amount) || 0) : sum),
    0
  );
}

/**
 * Totals per spend type. Powers the "why is my total lower than my debits?"
 * breakdown — the user should be able to see the excluded money, not just
 * trust that it was right to exclude it.
 */
export interface SpendBreakdown {
  spend: number;
  income: number;
  transfer: number;
  cardPayment: number;
  refund: number;
  /** Money that left the account but isn't spending (transfers + card bills). */
  excluded: number;
  spendCount: number;
  excludedCount: number;
}

export function spendBreakdown(txns: SpendClassified[]): SpendBreakdown {
  const out: SpendBreakdown = {
    spend: 0,
    income: 0,
    transfer: 0,
    cardPayment: 0,
    refund: 0,
    excluded: 0,
    spendCount: 0,
    excludedCount: 0,
  };

  for (const txn of txns) {
    const magnitude = Math.abs(Number(txn.amount) || 0);
    switch (spendTypeOf(txn)) {
      case "spend":
        out.spend += magnitude;
        out.spendCount++;
        break;
      case "income":
        out.income += magnitude;
        break;
      case "transfer":
        out.transfer += magnitude;
        out.excluded += magnitude;
        out.excludedCount++;
        break;
      case "card_payment":
        out.cardPayment += magnitude;
        out.excluded += magnitude;
        out.excludedCount++;
        break;
      case "refund":
        out.refund += magnitude;
        break;
      default:
        break;
    }
  }

  return out;
}

export function spendByCategory(
  txns: SpendClassified[]
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const txn of txns) {
    if (!isSpend(txn)) continue;
    const key = txn.category || "Other";
    totals[key] = (totals[key] || 0) + Math.abs(Number(txn.amount) || 0);
  }
  return totals;
}

export function spendByKey(
  txns: SpendClassified[],
  keyOf: (txn: SpendClassified) => string
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const txn of txns) {
    if (!isSpend(txn)) continue;
    const key = keyOf(txn);
    totals[key] = (totals[key] || 0) + Math.abs(Number(txn.amount) || 0);
  }
  return totals;
}

// Labels for the chip shown on an excluded row in the transactions list.
const TYPE_LABELS: Record<string, string> = {
  transfer: "Transfer",
  card_payment: "Card payment",
  income: "Income",
  refund: "Refund",
};

/** Chip label for a non-spend row, or null when it counts as spending. */
export function excludedLabel(txn: SpendClassified): string | null {
  const type = spendTypeOf(txn);
  if (type === "spend" || type === "unclassified") return null;
  return TYPE_LABELS[type] || null;
}

/** Human-readable reason, for the detail sheet on an excluded row. */
export function exclusionReason(txn: SpendClassified): string | null {
  const type = spendTypeOf(txn);
  if (type === "spend" || type === "unclassified") return null;
  if (txn.spendTypeSource === "user") return "You marked this as not spending.";

  switch (txn.spendTypeSource) {
    case "auto:pair":
      return "Matched to the other half of a transfer between your own accounts.";
    case "auto:pair:amount_only":
      return "The same amount moved between two of your accounts within a few days — looks like a transfer. Is it?";
    case "auto:issuer":
      return "Looks like a payment to a credit card you've imported, so the purchases on that card are counted instead.";
    case "auto:self_name":
      return "This names you, so it looks like a transfer to your own account.";
    case "auto:category":
      return "Categorised as a transfer.";
    case "auto:direction":
      return "Money coming in, not spending.";
    default:
      return type === "income"
        ? "Money coming in, not spending."
        : "Looks like money moved between your own accounts rather than spent.";
  }
}

// Below this confidence the classification is applied but the user is asked to
// confirm it. Mirrors AUTO_APPLY_CONFIDENCE on the backend.
const AUTO_APPLY_CONFIDENCE = 0.9;

/** True when this row should appear in the review queue. */
export function needsReview(txn: SpendClassified): boolean {
  const type = spendTypeOf(txn);
  if (type === "spend" || type === "unclassified") return false;
  if (txn.spendTypeSource === "user") return false;
  if (typeof txn.spendTypeConfidence !== "number") return false;
  return txn.spendTypeConfidence < AUTO_APPLY_CONFIDENCE;
}

export function reviewQueue<T extends SpendClassified>(txns: T[]): T[] {
  return txns.filter(needsReview);
}
