import { api } from '../config/apiClient';

export interface Transaction {
  id: string;
  amount: number;
  originalAmount: number;
  category: string;
  description: string;
  date: string;
}

export interface TransactionCreateData {
  amount: number;
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
  originalAmount?: number;
}

export interface TransactionsResponse {
  message: string;
  success: boolean;
  transactions: Transaction[];
  summary: {
    totalAmount: number;
    creditTotal: number;
    debitTotal: number;
    count: number;
  };
}

export interface TransactionCreateResponse {
  message: string;
  transaction: Transaction;
}

export interface GetTransactionsParams {
  limit?: number;
  startKey?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  type?: 'debit' | 'credit';
}

export interface CSVTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
  type: 'debit' | 'credit';
}

export interface CSVImportResponse {
  message: string;
  summary: {
    total: number;
    imported: number;
    failed: number;
    autoCategorized: number;
    keywordCategorized: number;
    aiCategorized: number;
  };
  errors: string[];
}

export const transactionAPI = {
  createTransaction: async (data: TransactionCreateData): Promise<TransactionCreateResponse> => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  getTransactions: async (params: GetTransactionsParams = {}): Promise<TransactionsResponse> => {
    const queryParams = new URLSearchParams();

    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params.startKey) queryParams.append('startKey', params.startKey);
    if (params.category) queryParams.append('category', params.category);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.type) queryParams.append('type', params.type);

    const url = queryParams.toString() ? `/transactions?${queryParams.toString()}` : '/transactions';
    const response = await api.get(url);
    return response.data;
  },

  // CSV Import with auto-categorization
  importCsvTransactions: async (transactions: CSVTransaction[]): Promise<CSVImportResponse> => {
    const response = await api.post('/transactions/import-csv', {
      transactions
    });
    return response.data;
  },

  // Helper method to convert expense data to transaction format
  convertExpenseToTransaction: (expenseData: any): TransactionCreateData => {
    const isIncome = expenseData.tags?.includes('income');
    return {
      amount: isIncome ? Math.abs(expenseData.amount) : -Math.abs(expenseData.amount),
      originalAmount: Math.abs(expenseData.amount),
      category: expenseData.category,
      description: expenseData.description,
      date: expenseData.date,
      type: isIncome ? 'credit' : 'debit',
      tags: expenseData.tags || [],
      merchant: expenseData.description,
      accountId: 'manual',
      bankName: 'Manual Entry',
      accountType: 'Manual Account',
      isPending: false,
    };
  }
};