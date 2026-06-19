import { api } from "../config/apiClient";
import { cachedApiCall, getCacheUserId, CACHE_TTL } from "../config/apiCache";
import { balanceAPI } from "./balanceAPI";

export interface UploadedStatement {
  statementId: string;
  bankName: string;
  accountIdentifier: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  // YYYY-MM the statement covers (derived from the statement period).
  periodMonth: string | null;
  transactionCount: number;
  filename: string | null;
  uploadedAt: string | null;
}

export interface Transaction {
  id: string;
  amount: number;
  originalAmount: number;
  category: string;
  description: string;
  date: string;
  type: "debit" | "credit";
  currency?: string;
  merchant?: string;
  // When true/false the user has explicitly chosen whether this counts in spend
  // analysis; when undefined it's decided by auto-detection (nonSpendDetection).
  excludeFromSpend?: boolean;
}

export interface TransactionCreateData {
  amount: number;
  category: string;
  merchant: string; // Mandatory
  description?: string; // Optional
  date: string;
  type?: "debit" | "credit";
  tags?: string[];
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
  type?: "debit" | "credit";
  useCache?: boolean;
}

export interface CSVTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  originalAmount: number;
  category: string;
  type: "debit" | "credit";
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

export interface SimilarTransaction {
  id: string;
  merchant: string;
  description?: string;
  amount: number;
  date: string;
  category: string;
}

export interface SimilarTransactionsResponse {
  message: string;
  merchant: string;
  count: number;
  transactions: SimilarTransaction[];
}

export interface BulkCategorizeResponse {
  message: string;
  updated: number;
  failed: number;
  category: string;
}

export interface ParsedStatementTransaction {
  date: string;
  merchant: string;
  description?: string;
  amount: number;
  type: "debit" | "credit";
  category?: string;
}

export interface StatementMetadata {
  issuer: string | null;
  accountIdentifier: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  filename: string | null;
}

export interface StatementParseResponse {
  statement: StatementMetadata;
  transactions: ParsedStatementTransaction[];
}

export interface StatementImportResponse {
  message: string;
  alreadyImported?: boolean;
  statement: StatementMetadata;
  summary: {
    total: number;
    imported: number;
    duplicatesSkipped: number;
    failed: number;
    autoCategorized: number;
    keywordCategorized: number;
    aiCategorized: number;
  };
  errors?: string[];
}

// Returned by GET /transactions/import-usage. Covers CSV + PDF imports
// against a single shared monthly quota.
export interface ImportUsageResponse {
  tier: "FREE" | "PREMIUM";
  period: string; // YYYY-MM
  used: number;
  limit: number;
  remaining: number;
  allowed: boolean;
  freeLimit: number;
  premiumLimit: number;
}

export const transactionAPI = {
  createTransaction: async (
    data: TransactionCreateData
  ): Promise<TransactionCreateResponse> => {
    const response = await api.post("/transactions", data);
    // A new transaction changes the balance/summary — drop the cached value so
    // the dashboard reflects it immediately instead of after the TTL.
    await balanceAPI.invalidateCache();
    return response.data;
  },

  getTransactions: async (
    params: GetTransactionsParams = {}
  ): Promise<TransactionsResponse> => {
    const queryParams = new URLSearchParams();

    // Default limit to 50 for faster initial load
    const limit = params.limit !== undefined ? params.limit : 50;
    queryParams.append("limit", limit.toString());

    if (params.startKey) queryParams.append("startKey", params.startKey);
    if (params.category) queryParams.append("category", params.category);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.type) queryParams.append("type", params.type);

    const url = queryParams.toString()
      ? `/transactions?${queryParams.toString()}`
      : "/transactions";

    // Always fetch fresh data from server - no caching
    const response = await api.get(url);
    return response.data;
  },

  // CSV Import with auto-categorization. `bank` (selected or auto-detected)
  // attributes every imported row to the right account instead of a generic
  // "CSV Import" label.
  importCsvTransactions: async (
    transactions: CSVTransaction[],
    bank?: { name: string; id: string } | null
  ): Promise<CSVImportResponse> => {
    const response = await api.post("/transactions/import-csv", {
      transactions,
      ...(bank ? { bank } : {}),
    });
    return response.data;
  },

  // Find the user's other transactions with the same merchant whose category
  // differs from `newCategory` — candidates for the "apply to similar" prompt.
  findSimilarTransactions: async (
    merchant: string,
    newCategory: string,
    excludeId?: string
  ): Promise<SimilarTransactionsResponse> => {
    const params = new URLSearchParams({ merchant, newCategory });
    if (excludeId) params.append("excludeId", excludeId);
    const response = await api.get(
      `/transactions/similar?${params.toString()}`
    );
    return response.data;
  },

  // Apply one category to many transactions at once.
  bulkCategorize: async (
    transactionIds: string[],
    category: string
  ): Promise<BulkCategorizeResponse> => {
    const response = await api.post("/transactions/bulk-categorize", {
      transactionIds,
      category,
    });
    return response.data;
  },

  // Set excludeFromSpend on many transactions at once, and (when a merchant is
  // given) learn a rule so future similar transactions auto-apply the choice.
  bulkExclude: async (
    transactionIds: string[],
    excludeFromSpend: boolean,
    merchant?: string
  ): Promise<{ updated: number; failed: number; excludeFromSpend: boolean }> => {
    const response = await api.post("/transactions/bulk-exclude", {
      transactionIds,
      excludeFromSpend,
      merchant,
    });
    return response.data;
  },

  // Returns the caller's CSV+PDF import quota for the current calendar month.
  // Used by the import screens to show "3/4 remaining" and gate uploads.
  //
  // Cached per-user (5 min) so the quota card renders instantly on every import
  // screen open instead of refetching (and flashing a spinner) each time. The
  // count only changes when the user imports, so callers pass force=true right
  // after an import to refresh it immediately.
  getImportUsage: async (force = false): Promise<ImportUsageResponse> => {
    const userId = await getCacheUserId();
    return cachedApiCall(
      `import_usage_${userId}`,
      async () => {
        const response = await api.get("/transactions/import-usage");
        return response.data;
      },
      CACHE_TTL.MEDIUM,
      force
    );
  },

  // Get a short-lived presigned S3 URL to upload a statement PDF directly to
  // S3. We upload the raw file there instead of base64-ing it into the parse
  // request body, which API Gateway (10 MB) / Lambda (6 MB) would reject —
  // that was the cause of the old "Parse failed" on real statements.
  getStatementUploadUrl: async (): Promise<{
    uploadUrl: string;
    key: string;
  }> => {
    const response = await api.post(
      "/transactions/statement-upload-url",
      {},
      { timeout: 20000 }
    );
    return response.data;
  },

  // Parse a PDF statement (no save). Takes the S3 key of an already-uploaded
  // PDF; the backend reads it from S3, extracts and categorizes transactions,
  // and returns them for the user to review before importing.
  parseStatement: async (
    s3Key: string,
    filename?: string
  ): Promise<StatementParseResponse> => {
    const response = await api.post(
      "/transactions/parse-statement",
      { s3Key, filename },
      { timeout: 90000 }
    );
    return response.data;
  },

  // Import user-confirmed transactions from a parsed statement.
  importStatement: async (
    transactions: ParsedStatementTransaction[],
    statement?: StatementMetadata
  ): Promise<StatementImportResponse> => {
    const response = await api.post(
      "/transactions/import-statement",
      { transactions, statement },
      { timeout: 30000 }
    );
    return response.data;
  },

  // Update transaction
  updateTransaction: async (
    transactionId: string,
    data: Partial<TransactionCreateData> & { excludeFromSpend?: boolean }
  ): Promise<TransactionCreateResponse> => {
    const response = await api.put(`/transactions/${transactionId}`, data);
    // Editing an amount/type can change the balance — invalidate the cache.
    await balanceAPI.invalidateCache();
    return response.data;
  },

  // Delete transaction
  deleteTransaction: async (
    transactionId: string
  ): Promise<{ message: string; success: boolean }> => {
    const response = await api.delete(`/transactions/${transactionId}`);
    // Removing a transaction changes the balance — invalidate the cache.
    await balanceAPI.invalidateCache();
    return response.data;
  },

  // Get single transaction
  getTransaction: async (transactionId: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data.transaction;
  },

  // List the user's uploaded bank statements (bank + statement month/year +
  // upload date + transaction count), most recent first.
  getUploadedStatements: async (): Promise<{
    statements: UploadedStatement[];
    count: number;
  }> => {
    const response = await api.get("/transactions/statements");
    return response.data;
  },

  // Helper method to convert expense data to transaction format
  convertExpenseToTransaction: (expenseData: any): TransactionCreateData => {
    const isIncome = expenseData.tags?.includes("income");
    return {
      amount: isIncome
        ? Math.abs(expenseData.amount)
        : -Math.abs(expenseData.amount),
      originalAmount: Math.abs(expenseData.amount),
      category: expenseData.category,
      description: expenseData.description,
      date: expenseData.date,
      type: isIncome ? "credit" : "debit",
      tags: expenseData.tags || [],
      merchant: expenseData.description,
      accountId: "manual",
      bankName: "Manual Entry",
      accountType: "Manual Account",
      isPending: false,
    };
  },
};
