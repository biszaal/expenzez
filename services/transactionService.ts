import { transactionAPI } from "./api/transactionAPI";

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: "debit" | "credit";
}

export class TransactionService {
  static async getTransactionsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    try {
      const params = {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        limit: 1000, // Get all transactions in the range
      };

      const response = await transactionAPI.getTransactions(params);
      return response.transactions || [];
    } catch (error) {
      console.error("Error fetching transactions by date range:", error);
      return [];
    }
  }

  static async getTransactions(): Promise<Transaction[]> {
    try {
      const response = await transactionAPI.getTransactions({ limit: 1000 });
      return response.transactions || [];
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  }

  static async getTransactionsByCategory(
    category: string
  ): Promise<Transaction[]> {
    try {
      const response = await transactionAPI.getTransactions({
        category,
        limit: 1000,
      });
      return response.transactions || [];
    } catch (error) {
      console.error("Error fetching transactions by category:", error);
      return [];
    }
  }

  static async getTransactionsByType(
    type: "debit" | "credit"
  ): Promise<Transaction[]> {
    try {
      const response = await transactionAPI.getTransactions({
        type,
        limit: 1000,
      });
      return response.transactions || [];
    } catch (error) {
      console.error("Error fetching transactions by type:", error);
      return [];
    }
  }

  static calculateSpendingByPeriod(
    transactions: Transaction[],
    startDate: Date,
    endDate: Date
  ): number {
    return transactions
      .filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate >= startDate &&
          transactionDate <= endDate &&
          t.type === "debit"
        );
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  static calculateSpendingByCategory(
    transactions: Transaction[],
    category: string
  ): number {
    return transactions
      .filter((t) => t.category === category && t.type === "debit")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  static getTopCategories(
    transactions: Transaction[],
    limit: number = 5
  ): Array<{ category: string; amount: number }> {
    const categorySpending = transactions
      .filter((t) => t.type === "debit")
      .reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
          return acc;
        },
        {} as Record<string, number>
      );

    return Object.entries(categorySpending)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }

  static calculateBalance(transactions: Transaction[]): number {
    return transactions.reduce((balance, transaction) => {
      return balance + transaction.amount;
    }, 0);
  }

  static calculateSpending(transactions: Transaction[]): number {
    return transactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  static calculateIncome(transactions: Transaction[]): number {
    return transactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);
  }
}

// Export singleton instance
export const transactionService = new TransactionService();
