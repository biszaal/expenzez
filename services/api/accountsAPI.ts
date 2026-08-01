import { api } from "../config/apiClient";
import { resolveBankBrand } from "../../constants/banks";
import {
  cachedApiCall,
  clearCachedDataByPrefix,
  getCacheUserId,
  CACHE_TTL,
} from "../config/apiCache";

/**
 * A bank or card the user has data for.
 *
 * There are no live bank connections in this product — accounts are discovered
 * from imported statements and CSVs, so an account exists precisely when the
 * user has imported something from it.
 */
export interface Account {
  accountId: string;
  bankId: string;
  bankName: string;
  displayName: string;
  accountType: string;
  accountIdentifier: string | null;
  colorHex: string;
  currency: string;
  isActive: boolean;
  firstSeenAt: string;
  lastActivityAt: string;
  // Rollups the list endpoint computes so the screen renders in one round trip.
  transactionCount: number;
  monthSpend: number;
  monthIncome: number;
  lastTransactionDate: string | null;
}

export interface AccountsResponse {
  message: string;
  accounts: Account[];
  month: string;
  // Transactions not filed under any account (manual entries, or imports from
  // before accounts existed). Shown so per-account totals reconcile with the
  // overall total instead of quietly disagreeing.
  unassigned: {
    transactionCount: number;
    monthSpend: number;
  };
}

const ACCOUNTS_CACHE_PREFIX = "accounts_list";

/**
 * Reconstruct the accounts view from transactions alone.
 *
 * Used only when the backend has no /accounts endpoint yet. Transactions
 * already carry `accountId` and `bankName`, so the same grouping is derivable
 * client-side — the server version is better (it persists renames, colours and
 * account identifiers), but this keeps the screen useful rather than blank.
 */
async function deriveAccountsFromTransactions(
  month?: string
): Promise<AccountsResponse> {
  const { transactionAPI } = await import("./transactionAPI");
  const { spendBreakdown } = await import("../../utils/spend");

  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const response = await transactionAPI.getTransactions({ limit: 1000 } as any);
  const transactions: any[] = response?.transactions || [];

  const groups = new Map<string, any[]>();
  for (const txn of transactions) {
    const key = txn.accountId || txn.bankName || "unknown";
    const list = groups.get(key) || [];
    list.push(txn);
    groups.set(key, list);
  }

  const accounts: Account[] = [];
  for (const [accountId, rows] of groups) {
    const monthRows = rows.filter(
      (t) => typeof t.date === "string" && t.date.slice(0, 7) === targetMonth
    );
    const lastTransactionDate = rows.reduce(
      (latest: string | null, t: any) =>
        t.date && (!latest || t.date > latest) ? t.date : latest,
      null as string | null
    );
    const bankName = rows.find((t) => t.bankName)?.bankName || "Other bank";
    // Resolve the brand here so derived accounts get the same logo and colour
    // as server-provided ones, rather than a row of identical grey tiles.
    const brand = resolveBankBrand(String(accountId).split("-")[0], bankName);

    accounts.push({
      accountId,
      bankId: brand?.bankId || String(accountId).split("-")[0],
      bankName,
      displayName: bankName,
      accountType: "Imported",
      accountIdentifier: null,
      colorHex: brand?.colorHex || "#7C8698",
      currency: "GBP",
      isActive: true,
      firstSeenAt: lastTransactionDate || new Date().toISOString(),
      lastActivityAt: lastTransactionDate || new Date().toISOString(),
      transactionCount: rows.length,
      monthSpend: spendBreakdown(monthRows).spend,
      monthIncome: spendBreakdown(monthRows).income,
      lastTransactionDate,
    });
  }

  accounts.sort((a, b) =>
    String(b.lastTransactionDate || "").localeCompare(
      String(a.lastTransactionDate || "")
    )
  );

  return {
    message: "Accounts derived from transactions",
    accounts,
    month: targetMonth,
    // Everything is accounted for in the derived groups by construction.
    unassigned: { transactionCount: 0, monthSpend: 0 },
  };
}

export const accountsAPI = {
  getAccounts: async (
    month?: string,
    options?: { force?: boolean }
  ): Promise<AccountsResponse> => {
    const userId = await getCacheUserId();
    const key = `${ACCOUNTS_CACHE_PREFIX}_${userId}_${month || "current"}`;

    if (options?.force) {
      await clearCachedDataByPrefix(ACCOUNTS_CACHE_PREFIX);
    }

    return cachedApiCall(
      key,
      async () => {
        try {
          const response = await api.get("/accounts", {
            params: month ? { month } : undefined,
          });
          return response.data as AccountsResponse;
        } catch (error: any) {
          // A 404 means this build is talking to a backend that predates the
          // /accounts endpoint. That's a deployment-ordering gap, not a broken
          // app — derive the same view from transactions we already have
          // rather than showing the user an error for a missing deploy.
          if (error?.statusCode === 404 || error?.response?.status === 404) {
            console.warn(
              "[accountsAPI] /accounts not available; deriving accounts from transactions"
            );
            return deriveAccountsFromTransactions(month);
          }
          throw error;
        }
      },
      CACHE_TTL.SHORT
    );
  },

  /** Rename or restyle an account. Bank identity itself is not editable. */
  updateAccount: async (
    accountId: string,
    updates: {
      displayName?: string;
      accountType?: string;
      colorHex?: string;
      isActive?: boolean;
    }
  ): Promise<{ message: string; account: Account }> => {
    const response = await api.patch(
      `/accounts/${encodeURIComponent(accountId)}`,
      updates
    );
    await accountsAPI.invalidateCache();
    return response.data;
  },

  /**
   * Delete an account. This also deletes its transactions unless
   * keepTransactions is set, so the caller must confirm explicitly.
   */
  deleteAccount: async (
    accountId: string,
    options?: { keepTransactions?: boolean }
  ): Promise<{ message: string; deletedTransactions: number }> => {
    const response = await api.delete(
      `/accounts/${encodeURIComponent(accountId)}`,
      { data: { confirm: true, keepTransactions: options?.keepTransactions === true } }
    );
    await accountsAPI.invalidateCache();
    return response.data;
  },

  invalidateCache: async (): Promise<void> => {
    await clearCachedDataByPrefix(ACCOUNTS_CACHE_PREFIX);
  },
};
