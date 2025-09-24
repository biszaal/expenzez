export interface Expense {
  id: string;
  amount: number;
  originalAmount: number;
  category: string;
  description: string;
  date: string;
  type?: 'debit' | 'credit';
  tags?: string[];
  merchant?: string;
  accountId?: string;
  bankName?: string;
  accountType?: string;
  isPending?: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  emoji: string;
}

export type ExpenseCategoryType =
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping'
  | 'Bills & Utilities'
  | 'Entertainment'
  | 'Health & Fitness'
  | 'Banking & Finance'
  | 'Travel'
  | 'Income'
  | 'Other';

export interface ImportPreview {
  file: string;
  totalTransactions: number;
  successfulImports: number;
  errors: string[];
  transactions: Expense[];
  totalAmount?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}