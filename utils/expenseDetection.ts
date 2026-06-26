/**
 * Utility functions for expense detection and categorization
 */
import { isExcludedFromSpend } from "./nonSpendDetection";

export interface ExpenseDetectionResult {
  isExpense: boolean;
  isIncomeCategory: boolean;
  isExpenseCategory: boolean;
}

/**
 * Category keywords that mark a transaction as income (money in), so it is
 * never counted as spend. Covers the app's income categories (Salary,
 * Freelance, Business, Investment, Rental, Gift — see add-transaction.tsx)
 * plus common income terms from imported/bank data. Previously only
 * 'income'/'salary'/'refund' were recognised, which let Freelance/Business/
 * Investment/Rental/Gift income be miscounted as spending.
 */
const INCOME_CATEGORY_KEYWORDS = [
  "income",
  "salary",
  "wage",
  "payroll",
  "freelance",
  "business",
  "invest",
  "dividend",
  "rental",
  "gift",
  "refund",
  "reimburs",
  "rebate",
  "cashback",
];

/**
 * Determines if a transaction should be counted as an expense (spend).
 *
 * Direction is decided primarily by the transaction `type` ("credit" = money
 * in, "debit" = money out), then by the sign of the amount, and only falls
 * back to the category when neither is conclusive. This ordering is what keeps
 * income out of the spend total: a manual income transaction is stored as a
 * positive amount with type "credit", so it resolves to NOT-expense regardless
 * of which income category it uses.
 */
export const detectExpense = (
  amount: number,
  type: string,
  category: string
): ExpenseDetectionResult => {
  const categoryLower = (category || "").toLowerCase();
  const isIncomeCategory = INCOME_CATEGORY_KEYWORDS.some((kw) =>
    categoryLower.includes(kw)
  );
  // Any category that isn't an income category is treated as spend-eligible.
  const isExpenseCategory = !isIncomeCategory;

  let isExpense: boolean;
  if (type === "credit") {
    isExpense = false; // money in
  } else if (type === "debit") {
    isExpense = true; // money out
  } else if (amount < 0) {
    isExpense = true; // no type, negative => money out
  } else if (amount > 0) {
    // No conclusive type and a positive amount (e.g. some imports store
    // expenses as positives): decide by category so genuine income stays out.
    isExpense = isExpenseCategory;
  } else {
    isExpense = false; // zero amount
  }

  return {
    isExpense,
    isIncomeCategory,
    isExpenseCategory,
  };
};

/**
 * Processes a transaction and determines if it's an expense
 * with detailed logging for debugging
 */
export const processTransactionExpense = (
  transaction: any,
  index: number,
  logDetails: boolean = false
): ExpenseDetectionResult => {
  const category = transaction.category || "Other";

  // Non-spend money movement (internal transfers, savings moves, card payments,
  // transfers to self) — explicit override or auto-detected — never counts as
  // spend. This keeps it out of every chart/total that uses this gate.
  if (isExcludedFromSpend(transaction)) {
    return { isExpense: false, isIncomeCategory: false, isExpenseCategory: false };
  }

  const detectionResult = detectExpense(transaction.amount, transaction.type, category);

  if (logDetails && index < 3) { // Log first 3 transactions for debugging
    console.log(`🐛 [Expense Detection] Transaction ${index}:`, {
      amount: transaction.amount,
      type: transaction.type,
      category: category,
      merchant: transaction.merchant || transaction.description || "Unknown Merchant",
      isDebit: transaction.type === 'debit',
      isNegativeAmount: transaction.amount < 0,
      isIncomeCategory: detectionResult.isIncomeCategory,
      isExpenseCategory: detectionResult.isExpenseCategory,
      willBeCountedAsExpense: detectionResult.isExpense,
      originalTxn: transaction
    });
  }

  return detectionResult;
};
