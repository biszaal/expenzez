import { budgetAPI, expenseAPI } from "./api";

export interface Budget {
  id: string;
  name: string;
  category: string;
  amount: number;
  period: "weekly" | "monthly" | "yearly";
  currentSpent: number;
  isActive: boolean;
  alertThreshold: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  isOver: boolean;
  daysLeft: number;
  dailyBudget: number;
  projectedSpend: number;
  status: "on_track" | "warning" | "danger";
}

export interface BudgetSummary {
  totalBudgets: number;
  activeBudgets: number;
  totalBudgetAmount: number;
  totalSpent: number;
  overBudgetCount: number;
  averageUsage: number;
}

export class BudgetService {
  static async createBudget(
    budgetData: Omit<Budget, "id" | "currentSpent" | "createdAt" | "updatedAt">
  ): Promise<Budget> {
    try {
      const budget: Budget = {
        ...budgetData,
        id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        currentSpent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("Creating budget:", budget.name);
      return budget;
    } catch (error) {
      console.error("Error creating budget:", error);
      throw error;
    }
  }

  static async getBudgets(): Promise<Budget[]> {
    try {
      console.log("Fetching budgets...");
      const { budgetAPI, transactionAPI } = await import("./api");
      const budgetPreferences = await budgetAPI.getBudgetPreferences();

      // Get current month's transactions to calculate spending
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      let transactions: any[] = [];
      try {
        const transactionResponse = await transactionAPI.getTransactions({
          startDate: startOfMonth.toISOString().split("T")[0],
          endDate: endOfMonth.toISOString().split("T")[0],
          limit: 1000,
        });
        transactions = transactionResponse.transactions || [];
      } catch (error) {
        console.warn(
          "Could not fetch transactions for budget calculation:",
          error
        );
      }

      // Calculate spending by category
      const spendingByCategory = this.calculateSpendingByCategory(transactions);

      // Convert budget preferences to Budget format
      const budgets: Budget[] = [];

      // Add main monthly budget if it exists
      if (
        budgetPreferences.monthlySpendingLimit &&
        budgetPreferences.monthlySpendingLimit > 0
      ) {
        const totalSpent = transactions
          .filter((tx) => tx.type === "debit" || tx.amount < 0)
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

        budgets.push({
          id: "main-budget",
          name: "Monthly Budget",
          category: "General",
          amount: budgetPreferences.monthlySpendingLimit,
          period: "monthly",
          currentSpent: totalSpent,
          isActive: true,
          alertThreshold: budgetPreferences.alertThreshold || 80,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Add category budgets if they exist
      if (budgetPreferences.categoryBudgets) {
        Object.entries(budgetPreferences.categoryBudgets).forEach(
          ([category, amount]) => {
            if (amount > 0) {
              const categorySpent = spendingByCategory[category] || 0;

              budgets.push({
                id: `category-${category.toLowerCase().replace(/\s+/g, "-")}`,
                name: category,
                category: category,
                amount: amount,
                period: "monthly",
                currentSpent: categorySpent,
                isActive: true,
                alertThreshold: budgetPreferences.alertThreshold || 80,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }
        );
      }

      return budgets;
    } catch (error) {
      console.error("Error fetching budgets:", error);
      return [];
    }
  }

  static async updateBudget(
    id: string,
    updates: Partial<Budget>
  ): Promise<Budget | null> {
    try {
      console.log("Updating budget:", id, updates);
      // In a real implementation, this would update the budget
      return null;
    } catch (error) {
      console.error("Error updating budget:", error);
      return null;
    }
  }

  static async deleteBudget(id: string): Promise<boolean> {
    try {
      console.log("Deleting budget:", id);
      return true;
    } catch (error) {
      console.error("Error deleting budget:", error);
      return false;
    }
  }

  static async calculateBudgetProgress(
    budget: Budget
  ): Promise<BudgetProgress> {
    try {
      // Get current period start date
      const now = new Date();
      let periodStart: Date;

      switch (budget.period) {
        case "weekly":
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "monthly":
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "yearly":
          periodStart = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Calculate spending for the period
      const spent = budget.currentSpent || 0;
      const remaining = Math.max(0, budget.amount - spent);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const isOver = spent > budget.amount;

      // Calculate days left in period
      let periodEnd: Date;
      switch (budget.period) {
        case "weekly":
          periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "monthly":
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case "yearly":
          periodEnd = new Date(now.getFullYear(), 11, 31);
          break;
        default:
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      const daysLeft = Math.max(
        0,
        Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
      const dailyBudget = daysLeft > 0 ? remaining / daysLeft : 0;
      const projectedSpend =
        daysLeft > 0
          ? spent +
            (spent /
              Math.max(
                1,
                (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
              )) *
              daysLeft
          : spent;

      // Determine status
      let status: "on_track" | "warning" | "danger";
      if (isOver) {
        status = "danger";
      } else if (percentage > budget.alertThreshold) {
        status = "warning";
      } else {
        status = "on_track";
      }

      return {
        budget,
        spent,
        remaining,
        percentage,
        isOver,
        daysLeft,
        dailyBudget,
        projectedSpend,
        status,
      };
    } catch (error) {
      console.error("Error calculating budget progress:", error);
      // Return default values
      return {
        budget,
        spent: 0,
        remaining: budget.amount,
        percentage: 0,
        isOver: false,
        daysLeft: 0,
        dailyBudget: 0,
        projectedSpend: 0,
        status: "on_track",
      };
    }
  }

  static async getSuggestedBudgets(): Promise<Partial<Budget>[]> {
    try {
      console.log("Generating budget suggestions...");

      // Basic suggested budgets
      const suggestions: Partial<Budget>[] = [
        {
          name: "Food & Dining",
          category: "Food & Dining",
          amount: 400,
          period: "monthly",
          alertThreshold: 80,
          isActive: true,
        },
        {
          name: "Transportation",
          category: "Transportation",
          amount: 150,
          period: "monthly",
          alertThreshold: 80,
          isActive: true,
        },
        {
          name: "Shopping",
          category: "Shopping",
          amount: 200,
          period: "monthly",
          alertThreshold: 80,
          isActive: true,
        },
        {
          name: "Entertainment",
          category: "Entertainment",
          amount: 100,
          period: "monthly",
          alertThreshold: 80,
          isActive: true,
        },
      ];

      return suggestions;
    } catch (error) {
      console.error("Error generating budget suggestions:", error);
      return [];
    }
  }

  static async getBudgetSummary(budgets: Budget[]): Promise<BudgetSummary> {
    try {
      const activeBudgets = budgets.filter((b) => b.isActive);
      const totalBudgetAmount = activeBudgets.reduce(
        (sum, b) => sum + b.amount,
        0
      );
      const totalSpent = activeBudgets.reduce(
        (sum, b) => sum + (b.currentSpent || 0),
        0
      );
      const overBudgetCount = activeBudgets.filter(
        (b) => (b.currentSpent || 0) > b.amount
      ).length;
      const averageUsage =
        totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0;

      return {
        totalBudgets: budgets.length,
        activeBudgets: activeBudgets.length,
        totalBudgetAmount,
        totalSpent,
        overBudgetCount,
        averageUsage,
      };
    } catch (error) {
      console.error("Error calculating budget summary:", error);
      return {
        totalBudgets: 0,
        activeBudgets: 0,
        totalBudgetAmount: 0,
        totalSpent: 0,
        overBudgetCount: 0,
        averageUsage: 0,
      };
    }
  }

  static async updateBudgetSpending(
    budgetId: string,
    amount: number
  ): Promise<boolean> {
    try {
      console.log("Updating budget spending:", budgetId, amount);
      // In a real implementation, this would update the currentSpent field
      return true;
    } catch (error) {
      console.error("Error updating budget spending:", error);
      return false;
    }
  }

  static async checkBudgetAlerts(budgets: Budget[]): Promise<Budget[]> {
    try {
      const alertBudgets = budgets.filter((budget) => {
        if (!budget.isActive) return false;

        const spentPercentage =
          budget.amount > 0
            ? ((budget.currentSpent || 0) / budget.amount) * 100
            : 0;
        return spentPercentage >= budget.alertThreshold;
      });

      if (alertBudgets.length > 0) {
        console.log("Budget alerts found:", alertBudgets.length);
      }

      return alertBudgets;
    } catch (error) {
      console.error("Error checking budget alerts:", error);
      return [];
    }
  }

  static async getAllBudgetProgress(): Promise<BudgetProgress[]> {
    try {
      const budgets = await this.getBudgets();
      return Promise.all(
        budgets.map((budget) => this.calculateBudgetProgress(budget))
      );
    } catch (error) {
      console.error("Error getting all budget progress:", error);
      return [];
    }
  }

  static getBudgetStatusColor(
    status: "on_track" | "warning" | "danger"
  ): string {
    switch (status) {
      case "on_track":
        return "#22C55E"; // Green
      case "warning":
        return "#F59E0B"; // Orange
      case "danger":
        return "#EF4444"; // Red
      default:
        return "#6B7280"; // Gray
    }
  }

  static getBudgetStatusIcon(
    status: "on_track" | "warning" | "danger"
  ): string {
    switch (status) {
      case "on_track":
        return "checkmark-circle";
      case "warning":
        return "warning";
      case "danger":
        return "alert-circle";
      default:
        return "help-circle";
    }
  }

  static calculateSpendingByCategory(transactions: any[]): {
    [category: string]: number;
  } {
    const spendingByCategory: { [category: string]: number } = {};

    transactions.forEach((transaction) => {
      // Only count debit transactions (expenses)
      if (transaction.type === "debit" || transaction.amount < 0) {
        const category = transaction.category || "Uncategorized";
        const amount = Math.abs(transaction.amount);

        if (!spendingByCategory[category]) {
          spendingByCategory[category] = 0;
        }
        spendingByCategory[category] += amount;
      }
    });

    return spendingByCategory;
  }
}

// Export a singleton instance for convenience
export const budgetService = BudgetService;
