import { apiClient } from "./apiClient";
import { getBankingApiUrl, isDevelopmentBanking } from "../config/banking";

export interface BankConnection {
  connectionId: string;
  bankName: string;
  status: "active" | "expired" | "revoked" | "error";
  createdAt: string;
  lastSyncAt?: string;
  errorMessage?: string;
}

export interface BankAccount {
  accountId: string;
  connectionId: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  sortCode?: string;
  iban?: string;
  isActive: boolean;
  createdAt: string;
  lastUpdated: string;
}

export interface BankTransaction {
  transactionId: string;
  accountId: string;
  connectionId: string;
  amount: number;
  currency: string;
  description: string;
  merchant: string;
  category: string;
  date: string;
  type: "debit" | "credit";
  reference?: string;
  balance?: number;
  source: "bank" | "manual";
  isPending: boolean;
  createdAt: string;
  lastUpdated: string;
}

export interface SyncResult {
  userId: string;
  connectionId: string;
  lastSyncAt: string;
  syncStatus: "success" | "failed" | "in_progress";
  errorMessage?: string;
  totalTransactions: number;
  newTransactions: number;
}

export interface SupportedBank {
  id: string;
  name: string;
  logo_url: string;
  country: string;
  supported_features: string[];
}

class FinexerAPI {
  private getBankingApiUrl(): string {
    // Use environment-based configuration to ensure isolation
    return getBankingApiUrl();
  }

  /**
   * Generate OAuth2 authorization URL for bank connection using Finexer API
   */
  async generateAuthUrl(
    userId: string,
    bankId?: string
  ): Promise<{ authUrl: string; redirectUri: string }> {
    try {
      // Log which API we're using for debugging
      if (isDevelopmentBanking()) {
        console.log("🏗️ [DEVELOPMENT] Using Finexer integration banking API");
      } else {
        console.log("🚀 [PRODUCTION] Using production banking API");
      }

      // Use the banking API base URL instead of the main API
      const response = await apiClient.post(
        `${this.getBankingApiUrl()}/api/banking/connect`,
        {
          userId,
          bankId,
        }
      );

      const data = response.data;

      // Check if the backend returned a data:text/html URL (old format)
      if (data.authUrl && data.authUrl.startsWith("data:text/html,")) {
        console.log(
          "Backend returned data:text/html URL, converting to HTTP URL"
        );
        // Create a simple redirect URL that works reliably
        const mockCallbackUrl = `https://expenzez.com/oauth/callback?code=mock_auth_code_${userId}&state=${userId}&bank_id=${bankId || "natwest"}`;
        // Use a simple redirect service that's more reliable
        const httpAuthUrl = `https://httpbin.org/redirect-to?url=${encodeURIComponent(mockCallbackUrl)}&status_code=302`;

        return {
          authUrl: httpAuthUrl,
          redirectUri:
            data.redirectUri || `https://expenzez.com/oauth/callback`,
        };
      }

      return data;
    } catch (error: any) {
      console.error("Error generating auth URL:", error);

      // Check if it's a 404 or 502 error (API not deployed or server error)
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        console.log("Banking API not deployed yet, using mock OAuth flow");

        // Return mock OAuth URL for testing using simple redirect
        const mockCallbackUrl = `https://expenzez.com/oauth/callback?code=mock_auth_code_${userId}&state=${userId}&bank_id=${bankId || "natwest"}`;
        const mockAuthUrl = `https://httpbin.org/redirect-to?url=${encodeURIComponent(mockCallbackUrl)}&status_code=302`;
        const mockRedirectUri = `https://expenzez.com/oauth/callback`;

        return {
          authUrl: mockAuthUrl,
          redirectUri: mockRedirectUri,
        };
      } else if (error?.response?.status === 502 || error?.statusCode === 502) {
        console.log("Banking API server error, using mock OAuth flow");

        // Return mock OAuth URL for testing using simple redirect
        const mockCallbackUrl = `https://expenzez.com/oauth/callback?code=mock_auth_code_${userId}&state=${userId}&bank_id=${bankId || "natwest"}`;
        const mockAuthUrl = `https://httpbin.org/redirect-to?url=${encodeURIComponent(mockCallbackUrl)}&status_code=302`;
        const mockRedirectUri = `https://expenzez.com/oauth/callback`;

        return {
          authUrl: mockAuthUrl,
          redirectUri: mockRedirectUri,
        };
      }

      throw new Error("Failed to generate authorization URL");
    }
  }

  /**
   * Get user's bank connections
   */
  async getConnections(userId: string): Promise<BankConnection[]> {
    try {
      const response = await apiClient.get(
        `${this.getBankingApiUrl()}/api/banking/connections/${userId}`
      );
      return response.data.connections || [];
    } catch (error: any) {
      // Check if it's a 404 error (API not deployed yet)
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        console.log(
          "Banking API not deployed yet, returning empty connections"
        );
        return [];
      } else {
        console.error("Error fetching connections:", error);
        throw new Error("Failed to fetch bank connections");
      }
    }
  }

  /**
   * Get user's bank accounts
   */
  async getAccounts(userId: string): Promise<BankAccount[]> {
    try {
      const response = await apiClient.get(
        `${this.getBankingApiUrl()}/api/banking/accounts/${userId}`
      );
      return response.data.accounts || [];
    } catch (error: any) {
      // Check if it's a 404 or 502 error (API not deployed or server error)
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        console.log("Banking API not deployed yet, returning empty accounts");
        return [];
      } else if (error?.response?.status === 502 || error?.statusCode === 502) {
        console.log("Banking API server error, returning mock accounts");
        return this.getMockAccounts();
      } else {
        console.error("Error fetching accounts:", error);
        throw new Error("Failed to fetch bank accounts");
      }
    }
  }

  /**
   * Get user's transactions (bank + manual)
   */
  async getTransactions(
    userId: string,
    limit: number = 100
  ): Promise<BankTransaction[]> {
    try {
      const response = await apiClient.get(
        `${this.getBankingApiUrl()}/api/banking/transactions/${userId}?limit=${limit}`
      );
      return response.data.transactions || [];
    } catch (error: any) {
      // Check if it's a 404 error (API not deployed yet)
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        console.log(
          "Banking API not deployed yet, returning empty transactions"
        );
        return [];
      } else {
        console.error("Error fetching transactions:", error);
        throw new Error("Failed to fetch transactions");
      }
    }
  }

  /**
   * Get transactions for a specific account
   */
  async getAccountTransactions(
    userId: string,
    accountId: string,
    limit: number = 100
  ): Promise<BankTransaction[]> {
    try {
      const response = await apiClient.get(
        `${this.getBankingApiUrl()}/api/banking/accounts/${userId}/${accountId}/transactions?limit=${limit}`
      );
      return response.data.transactions || [];
    } catch (error: any) {
      // Check if it's a 404 error (API not deployed yet)
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        console.log(
          "Banking API not deployed yet, returning empty account transactions"
        );
        return [];
      } else {
        console.error("Error fetching account transactions:", error);
        throw new Error("Failed to fetch account transactions");
      }
    }
  }

  /**
   * Sync user's bank accounts and transactions
   */
  async syncAccounts(userId: string, connectionId?: string): Promise<any> {
    try {
      const response = await apiClient.post(
        `${this.getBankingApiUrl()}/api/banking/sync/${userId}`,
        {
          connectionId,
        }
      );
      return response.data;
    } catch (error: any) {
      // Check if it's a 404 error (API not deployed yet)
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        console.log("Banking API not deployed yet, returning mock sync result");
        return {
          success: true,
          message: "Mock sync completed",
          syncedAt: new Date().toISOString(),
        };
      } else {
        console.error("Error syncing accounts:", error);
        throw new Error("Failed to sync bank accounts");
      }
    }
  }

  /**
   * Disconnect bank account
   */
  async disconnectAccount(userId: string, connectionId: string): Promise<void> {
    try {
      await apiClient.delete(
        `${this.getBankingApiUrl()}/api/banking/connections/${userId}/${connectionId}`
      );
    } catch (error: any) {
      // Check if it's a 404 error (API not deployed yet)
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        console.log("Banking API not deployed yet, mock disconnect completed");
        return;
      } else {
        console.error("Error disconnecting account:", error);
        throw new Error("Failed to disconnect bank account");
      }
    }
  }

  /**
   * Get supported banks
   */
  async getSupportedBanks(): Promise<SupportedBank[]> {
    try {
      // Use direct fetch to avoid global error handler for 404s
      const response = await fetch(
        `${this.getBankingApiUrl()}/api/banking/banks`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.banks || [];
      } else if (response.status === 404) {
        console.log("Banking API not deployed yet, using mock data");
        return this.getMockBanks();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.log("Banking API not deployed yet, using mock data");
      // Always return mock data as fallback
      return this.getMockBanks();
    }
  }

  /**
   * Get mock banks data
   */
  private getMockAccounts(): BankAccount[] {
    return [
      {
        id: "mock_account_1",
        userId: "mock_user",
        bankId: "natwest",
        bankName: "NatWest",
        accountName: "NatWest Current Account",
        accountNumber: "****1234",
        sortCode: "60-24-24",
        accountType: "current",
        balance: 1250.5,
        currency: "GBP",
        status: "active",
        lastSyncAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "mock_account_2",
        userId: "mock_user",
        bankId: "natwest",
        bankName: "NatWest",
        accountName: "NatWest Savings Account",
        accountNumber: "****5678",
        sortCode: "60-24-24",
        accountType: "savings",
        balance: 5000.0,
        currency: "GBP",
        status: "active",
        lastSyncAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  private getMockBanks(): SupportedBank[] {
    return [
      // Major High Street Banks
      {
        id: "hsbc",
        name: "HSBC",
        logoUrl: "https://logo.clearbit.com/hsbc.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "barclays",
        name: "Barclays",
        logoUrl: "https://logo.clearbit.com/barclays.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "lloyds",
        name: "Lloyds Bank",
        logoUrl: "https://logo.clearbit.com/lloydsbank.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "natwest",
        name: "NatWest",
        logoUrl: "https://logo.clearbit.com/natwest.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "santander",
        name: "Santander",
        logoUrl: "https://logo.clearbit.com/santander.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "halifax",
        name: "Halifax",
        logoUrl: "https://logo.clearbit.com/halifax.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "nationwide",
        name: "Nationwide",
        logoUrl: "https://logo.clearbit.com/nationwide.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "tsb",
        name: "TSB",
        logoUrl: "https://logo.clearbit.com/tsb.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "firstdirect",
        name: "First Direct",
        logoUrl: "https://logo.clearbit.com/firstdirect.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "metro",
        name: "Metro Bank",
        logoUrl: "https://logo.clearbit.com/metrobankonline.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      // RBS Group
      {
        id: "rbs",
        name: "Royal Bank of Scotland",
        logoUrl: "https://logo.clearbit.com/rbs.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "ulster",
        name: "Ulster Bank",
        logoUrl: "https://logo.clearbit.com/ulsterbank.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "clydesdale",
        name: "Clydesdale Bank",
        logoUrl: "https://logo.clearbit.com/cbonline.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "yorkshire",
        name: "Yorkshire Bank",
        logoUrl: "https://logo.clearbit.com/ybonline.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      // Digital Banks & Challengers
      {
        id: "monzo",
        name: "Monzo",
        logoUrl: "https://logo.clearbit.com/monzo.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "starling",
        name: "Starling Bank",
        logoUrl: "https://logo.clearbit.com/starlingbank.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "revolut",
        name: "Revolut",
        logoUrl: "https://logo.clearbit.com/revolut.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "chase",
        name: "Chase",
        logoUrl: "https://logo.clearbit.com/chase.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "virgin",
        name: "Virgin Money",
        logoUrl: "https://logo.clearbit.com/virginmoney.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      // Retailer Banks
      {
        id: "tesco",
        name: "Tesco Bank",
        logoUrl: "https://logo.clearbit.com/tescobank.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "sainsburys",
        name: "Sainsbury's Bank",
        logoUrl: "https://logo.clearbit.com/sainsburysbank.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "m&s",
        name: "M&S Bank",
        logoUrl: "https://logo.clearbit.com/marksandspencer.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "postoffice",
        name: "Post Office Money",
        logoUrl: "https://logo.clearbit.com/postoffice.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      // Building Societies & Mutuals
      {
        id: "coop",
        name: "The Co-operative Bank",
        logoUrl: "https://logo.clearbit.com/co-operativebank.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      // Specialist & Challenger Banks
      {
        id: "aldermore",
        name: "Aldermore Bank",
        logoUrl: "https://logo.clearbit.com/aldermore.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "close",
        name: "Close Brothers",
        logoUrl: "https://logo.clearbit.com/closebrothers.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "handelsbanken",
        name: "Handelsbanken",
        logoUrl: "https://logo.clearbit.com/handelsbanken.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "securetrust",
        name: "Secure Trust Bank",
        logoUrl: "https://logo.clearbit.com/securetrustbank.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "shawbrook",
        name: "Shawbrook Bank",
        logoUrl: "https://logo.clearbit.com/shawbrook.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "paragon",
        name: "Paragon Bank",
        logoUrl: "https://logo.clearbit.com/paragonbank.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "masthaven",
        name: "Masthaven Bank",
        logoUrl: "https://logo.clearbit.com/masthaven.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "atom",
        name: "Atom Bank",
        logoUrl: "https://logo.clearbit.com/atombank.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "tide",
        name: "Tide",
        logoUrl: "https://logo.clearbit.com/tide.co",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "cashplus",
        name: "Cashplus",
        logoUrl: "https://logo.clearbit.com/cashplus.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "pockit",
        name: "Pockit",
        logoUrl: "https://logo.clearbit.com/pockit.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "loot",
        name: "Loot",
        logoUrl: "https://logo.clearbit.com/loot.io",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "curve",
        name: "Curve",
        logoUrl: "https://logo.clearbit.com/curve.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "monese",
        name: "Monese",
        logoUrl: "https://logo.clearbit.com/monese.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "n26",
        name: "N26",
        logoUrl: "https://logo.clearbit.com/n26.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "vivid",
        name: "Vivid Money",
        logoUrl: "https://logo.clearbit.com/vivid.money",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "kroo",
        name: "Kroo",
        logoUrl: "https://logo.clearbit.com/kroo.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "zopa",
        name: "Zopa Bank",
        logoUrl: "https://logo.clearbit.com/zopa.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "clearbank",
        name: "ClearBank",
        logoUrl: "https://logo.clearbit.com/clearbank.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "fidor",
        name: "Fidor Bank",
        logoUrl: "https://logo.clearbit.com/fidor.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      // International Banks with UK Operations
      {
        id: "fcmb",
        name: "FCMB Bank",
        logoUrl: "https://logo.clearbit.com/fcmb.co.uk",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "gtbank",
        name: "GTBank UK",
        logoUrl: "https://logo.clearbit.com/gtbank.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "access",
        name: "Access Bank UK",
        logoUrl: "https://logo.clearbit.com/accessbankplc.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "firstbank",
        name: "First Bank UK",
        logoUrl: "https://logo.clearbit.com/firstbanknigeria.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "union",
        name: "Union Bank UK",
        logoUrl: "https://logo.clearbit.com/unionbankng.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "zenith",
        name: "Zenith Bank UK",
        logoUrl: "https://logo.clearbit.com/zenithbank.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "uba",
        name: "UBA UK",
        logoUrl: "https://logo.clearbit.com/ubagroup.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "fidelity",
        name: "Fidelity Bank UK",
        logoUrl: "https://logo.clearbit.com/fidelitybank.ng",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "sterling",
        name: "Sterling Bank UK",
        logoUrl: "https://logo.clearbit.com/sterling.ng",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "wema",
        name: "Wema Bank UK",
        logoUrl: "https://logo.clearbit.com/wemabank.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "providus",
        name: "Providus Bank UK",
        logoUrl: "https://logo.clearbit.com/providusbank.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "kuda",
        name: "Kuda Bank",
        logoUrl: "https://logo.clearbit.com/kuda.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      // Fintech & Digital Payment Providers
      {
        id: "opay",
        name: "OPay",
        logoUrl: "https://logo.clearbit.com/opay.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "palmpay",
        name: "PalmPay",
        logoUrl: "https://logo.clearbit.com/palmpay.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "fairmoney",
        name: "FairMoney",
        logoUrl: "https://logo.clearbit.com/fairmoney.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "carbon",
        name: "Carbon",
        logoUrl: "https://logo.clearbit.com/getcarbon.co",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "piggyvest",
        name: "PiggyVest",
        logoUrl: "https://logo.clearbit.com/piggyvest.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "cowrywise",
        name: "Cowrywise",
        logoUrl: "https://logo.clearbit.com/cowrywise.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "rise",
        name: "Rise",
        logoUrl: "https://logo.clearbit.com/risevest.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "bamboo",
        name: "Bamboo",
        logoUrl: "https://logo.clearbit.com/bamboo.co",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "trovest",
        name: "Trovest",
        logoUrl: "https://logo.clearbit.com/trovest.com",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "wealth",
        name: "Wealth.ng",
        logoUrl: "https://logo.clearbit.com/wealth.ng",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
      {
        id: "chaka",
        name: "Chaka",
        logoUrl: "https://logo.clearbit.com/chaka.ng",
        country: "UK",
        supportedFeatures: ["accounts", "transactions", "balance", "payments"],
      },
    ];
  }

  /**
   * Get sync status for a connection
   */
  async getSyncStatus(
    userId: string,
    connectionId: string
  ): Promise<SyncResult | null> {
    try {
      const response = await apiClient.get(
        `${this.getBankingApiUrl()}/api/banking/sync-status/${userId}/${connectionId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching sync status:", error);
      return null;
    }
  }
}

// Export singleton instance
export const finexerAPI = new FinexerAPI();
