import AsyncStorage from "@react-native-async-storage/async-storage";
import { aiAPI } from "../config/apiClient";
import { transactionAPI } from "./transactionAPI";

export const aiService = {
  // AI Assistant functionality
  getAIInsight: async (message: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");

      // 📱 MANUAL INPUT MODE: Gather user's financial context from manual transactions
      let financialContext: any = {};

      try {
        // Get recent transactions from manual entries (last 20 for context)
        const transactionsResponse = await transactionAPI.getTransactions({ limit: 20 });
        financialContext.recentTransactions = transactionsResponse.transactions || [];

        // Calculate total balance from transaction data
        let totalBalance = 0;
        if (financialContext.recentTransactions.length > 0) {
          totalBalance = financialContext.recentTransactions.reduce((sum: number, tx: any) => {
            const amount = parseFloat(tx.amount) || 0;
            return sum + amount; // Positive for income, negative for expenses
          }, 0);
        }
        financialContext.totalBalance = totalBalance;

        // Calculate monthly spending from manual transactions
        const currentMonth = new Date().toISOString().substring(0, 7);
        const monthlySpending = financialContext.recentTransactions
          ?.filter((tx: any) => tx.date?.startsWith(currentMonth) && (tx.type === 'debit' || tx.amount < 0))
          ?.reduce((sum: number, tx: any) => sum + Math.abs(parseFloat(tx.amount) || 0), 0) || 0;
        financialContext.monthlySpending = monthlySpending;

        // Set account info for manual mode
        financialContext.accounts = [{ name: "Manual Entry", type: "Manual Account" }];

      } catch (contextError) {
        console.log("AI context gathering error:", contextError);
        // Continue without context - AI will use general responses
      }

      const response = await aiAPI.post("/ai/insight", {
        message,
        financialContext
      });
      return response.data;
    } catch (error: any) {
      // Enhanced fallback for when AI endpoints might not be available
      if (error.response?.status === 404 || error.response?.status === 502 || error.response?.status === 503) {

        // Generate contextual fallback responses using manual transaction data
        const lowerMessage = message.toLowerCase();
        let fallbackResponse = "";

        // Use manual transaction data for context
        let financialContext: any = {};
        try {
          const transactionsResponse = await transactionAPI.getTransactions({ limit: 20 });
          financialContext.recentTransactions = transactionsResponse.transactions || [];

          // Calculate balance from manual transaction data
          let totalBalance = 0;
          if (financialContext.recentTransactions.length > 0) {
            totalBalance = financialContext.recentTransactions.reduce((sum: number, tx: any) => {
              const amount = parseFloat(tx.amount) || 0;
              return sum + amount;
            }, 0);
          }
          financialContext.totalBalance = totalBalance;

          const currentMonth = new Date().toISOString().substring(0, 7);
          const monthlySpending = financialContext.recentTransactions
            ?.filter((tx: any) => tx.date?.startsWith(currentMonth) && (tx.type === 'debit' || tx.amount < 0))
            ?.reduce((sum: number, tx: any) => sum + Math.abs(parseFloat(tx.amount) || 0), 0) || 0;
          financialContext.monthlySpending = monthlySpending;
        } catch {
          // If we can't get context, use empty context
        }

        const { totalBalance, monthlySpending, recentTransactions } = financialContext;
        const hasFinancialData = totalBalance !== undefined && recentTransactions?.length > 0;

        if (lowerMessage.includes('balance') || lowerMessage.includes('money')) {
          if (hasFinancialData) {
            fallbackResponse = `Based on your manually entered transactions, your calculated balance is £${totalBalance?.toFixed(2) || '0.00'}. `;
            fallbackResponse += totalBalance > 1000 ? "Your balance looks healthy! Consider setting aside some money for savings." : "Keep track of your spending to help build up your balance over time.";
          } else {
            fallbackResponse = "I can help analyze your finances once you add some transactions. Try adding expenses manually or importing CSV data to get personalized insights.";
          }
        } else if (lowerMessage.includes('spending') || lowerMessage.includes('spend')) {
          if (hasFinancialData && monthlySpending > 0) {
            fallbackResponse = `You've spent £${monthlySpending.toFixed(2)} this month based on your manual entries. `;
            if (monthlySpending > Math.abs(totalBalance) * 0.5) {
              fallbackResponse += "Your spending is quite high. Consider reviewing your expenses to identify areas where you can cut back.";
            } else {
              fallbackResponse += "Your spending appears to be manageable. Keep tracking your expenses to maintain good financial health.";
            }
          } else {
            fallbackResponse = "I can analyze your spending patterns once you add some transactions. Use 'Add Expense' or 'Import CSV' to get detailed spending insights.";
          }
        } else if (lowerMessage.includes('transaction') || lowerMessage.includes('payment')) {
          if (hasFinancialData) {
            fallbackResponse = `I can see your ${recentTransactions.length} manually entered transactions. `;
            fallbackResponse += "Check the transactions tab to review and categorize them for better budgeting insights.";
          } else {
            fallbackResponse = "Your transactions will appear here once you add them manually or import CSV data. Use the 'Add Expense' button to get started.";
          }
        } else if (lowerMessage.includes('budget') || lowerMessage.includes('save')) {
          if (hasFinancialData && totalBalance > 0) {
            const suggestedSavings = Math.max(totalBalance * 0.1, 50);
            fallbackResponse = `Based on your calculated balance of £${totalBalance.toFixed(2)}, I suggest setting aside £${suggestedSavings.toFixed(2)} for savings. `;
            fallbackResponse += "Try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.";
          } else {
            fallbackResponse = "To help with budgeting, I need to see your transaction data. Add expenses manually or import CSV data to get personalized budget recommendations.";
          }
        } else {
          // Generic financial advice fallback for manual input mode
          fallbackResponse = hasFinancialData
            ? `Hello! I can see you have ${recentTransactions?.length || 0} manually entered transaction${recentTransactions?.length === 1 ? '' : 's'} with a calculated balance of £${totalBalance?.toFixed(2) || '0.00'}. Feel free to ask me about your spending patterns, budgeting tips, or financial goals!`
            : "Hello! I'm your AI financial assistant. I can help you with budgeting, spending analysis, and financial planning. Add expenses manually or import CSV data to get personalized insights, or ask me any general financial questions!";
        }

        return {
          success: true,
          answer: fallbackResponse,
          isFallback: true
        };
      } else {
        throw error;
      }
    }
  },

  // Get AI chat history
  getAIChatHistory: async () => {
    try {
      const response = await aiAPI.get("/ai/chat-history");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 401) {
        return {
          success: true,
          messages: []
        };
      }
      throw error;
    }
  },

  // Save AI chat message
  saveAIChatMessage: async (role: string, content: string) => {
    try {
      const response = await aiAPI.post("/ai/chat-message", { role, content });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 401) {
        return { success: true };
      }
      throw error;
    }
  },

  // Clear AI chat history
  clearAIChatHistory: async () => {
    try {
      const response = await aiAPI.delete("/ai/chat-history");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 401) {
        return { success: true };
      }
      throw error;
    }
  },

  // Get monthly financial report
  getMonthlyReport: async (month?: string, year?: string) => {
    try {
      // Create reportMonth in YYYY-MM format
      const now = new Date();
      const reportMonth = month && year
        ? `${year}-${month.padStart(2, '0')}`
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const response = await aiAPI.get(`/ai/monthly-report/${reportMonth}`);
      return response.data;
    } catch (error: any) {
      // Handle both 404 and 401 errors gracefully
      if (error.response?.status === 404 || error.response?.status === 401) {
        return {
          success: false,
          message: "Monthly report unavailable - feature coming soon!"
        };
      }

      throw error;
    }
  },
};