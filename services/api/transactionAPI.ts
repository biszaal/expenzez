import { api } from '../config/apiClient';
import { cachedApiCall, CACHE_TTL, clearCachedData } from '../config/apiCache';

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
  id: string;
  date: string;
  description: string;
  amount: number;
  originalAmount: number;
  category: string;
  type: 'debit' | 'credit';
}

export interface CSVImportResponse {
  message: string;
  imported: number;
  failed: number;
  errors?: string[];
  summary?: {
    imported: number;
    failed: number;
    autoCategorized?: number;
    keywordCategorized?: number;
    aiCategorized?: number;
  };
}


export const transactionAPI = {
  createTransaction: async (data: TransactionCreateData): Promise<TransactionCreateResponse> => {
    const response = await api.post('/transactions', data);

    // Invalidate transaction cache after creating new transaction
    await clearCachedData('transactions_all');

    return response.data;
  },

  getTransactions: async (
    params: GetTransactionsParams = {},
    options: { useCache?: boolean; forceRefresh?: boolean } = { useCache: true, forceRefresh: false }
  ): Promise<TransactionsResponse> => {
    const queryParams = new URLSearchParams();

    // Default limit to 50 for faster initial load
    const limit = params.limit !== undefined ? params.limit : 50;
    queryParams.append('limit', limit.toString());

    if (params.startKey) queryParams.append('startKey', params.startKey);
    if (params.category) queryParams.append('category', params.category);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.type) queryParams.append('type', params.type);

    const url = queryParams.toString() ? `/transactions?${queryParams.toString()}` : '/transactions';

    // Generate cache key based on params
    const cacheKey = `transactions_${JSON.stringify(params)}`;

    if (options.useCache) {
      return cachedApiCall(
        cacheKey,
        async () => {
          const response = await api.get(url);
          return response.data;
        },
        CACHE_TTL.SHORT, // 30 seconds for transactions
        options.forceRefresh
      );
    } else {
      const response = await api.get(url);
      return response.data;
    }
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