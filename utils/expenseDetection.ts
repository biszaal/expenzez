/**
 * Utility functions for expense detection and categorization
 */

export interface ExpenseDetectionResult {
  isExpense: boolean;
  isIncomeCategory: boolean;
  isExpenseCategory: boolean;
}

/**
 * Determines if a transaction should be counted as an expense
 * based on amount, type, and category
 */
export const detectExpense = (
  amount: number,
  type: string,
  category: string
): ExpenseDetectionResult => {
  const isIncomeCategory = category.toLowerCase().includes('income') ||
                          category.toLowerCase().includes('salary') ||
                          category.toLowerCase().includes('refund');

  const categoryLower = category.toLowerCase();
  const isExpenseCategory = !isIncomeCategory && (
    // Exact matches
    category === 'Food & Dining' ||
    category === 'Shopping' ||
    category === 'Transport' ||
    category === 'Entertainment' ||
    category === 'Bills & Utilities' ||
    category === 'Health & Fitness' ||
    category === 'Other' ||

    // Flexible matches for common variations
    categoryLower.includes('food') ||
    categoryLower.includes('dining') ||
    categoryLower.includes('restaurant') ||
    categoryLower.includes('shop') ||
    categoryLower.includes('retail') ||
    categoryLower.includes('transport') ||
    categoryLower.includes('travel') ||
    categoryLower.includes('taxi') ||
    categoryLower.includes('uber') ||
    categoryLower.includes('entertainment') ||
    categoryLower.includes('movie') ||
    categoryLower.includes('game') ||
    categoryLower.includes('bill') ||
    categoryLower.includes('utilities') ||
    categoryLower.includes('utility') ||
    categoryLower.includes('electric') ||
    categoryLower.includes('gas') ||
    categoryLower.includes('health') ||
    categoryLower.includes('fitness') ||
    categoryLower.includes('gym') ||
    categoryLower.includes('medical') ||
    categoryLower.includes('expense') ||
    categoryLower.includes('purchase') ||

    // Catch remaining non-income categories
    (categoryLower !== 'income' && categoryLower !== 'salary' && categoryLower !== 'refund')
  );

  const isExpense = (type === 'debit' || amount < 0) ||
                   (amount > 0 && isExpenseCategory);

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
