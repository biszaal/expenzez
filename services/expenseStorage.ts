import { Expense, ExpenseCategory } from '../types/expense';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'food-dining', name: 'Food & Dining', emoji: '🍔' },
  { id: 'transportation', name: 'Transportation', emoji: '🚗' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️' },
  { id: 'bills-utilities', name: 'Bills & Utilities', emoji: '💡' },
  { id: 'entertainment', name: 'Entertainment', emoji: '🎬' },
  { id: 'health-fitness', name: 'Health & Fitness', emoji: '💊' },
  { id: 'banking-finance', name: 'Banking & Finance', emoji: '🏦' },
  { id: 'travel', name: 'Travel', emoji: '✈️' },
  { id: 'income', name: 'Income', emoji: '💰' },
  { id: 'other', name: 'Other', emoji: '📦' }
];

export class ExpenseStorage {
  static async saveExpense(expense: Expense): Promise<void> {
    // Placeholder implementation
    console.log('Saving expense:', expense);
  }

  static async getExpenses(): Promise<Expense[]> {
    // Placeholder implementation
    console.log('Getting expenses');
    return [];
  }

  static async deleteExpense(id: string): Promise<void> {
    // Placeholder implementation
    console.log('Deleting expense:', id);
  }

  static async updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
    // Placeholder implementation
    console.log('Updating expense:', id, updates);
  }
}

export const expenseStorage = ExpenseStorage;