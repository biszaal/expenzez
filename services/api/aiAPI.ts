import AsyncStorage from "@react-native-async-storage/async-storage";
import { aiAPI } from "../config/apiClient";
import { bankingAPI } from "./bankingAPI";

export const aiService = {
  // AI Assistant functionality
  getAIInsight: async (message: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      
      // Gather user's financial context for AI analysis
      let financialContext: any = {};
      
      try {
        console.log('🤖 [AI Context] Starting to gather financial context...');
        
        // Get recent transactions (last 20 for context)
        console.log('🤖 [AI Context] Fetching transactions...');
        const transactionsResponse = await bankingAPI.getAllTransactions(20);
        console.log('🤖 [AI Context] Raw transactions response:', JSON.stringify(transactionsResponse, null, 2));
        financialContext.recentTransactions = transactionsResponse.transactions || [];
        console.log('🤖 [AI Context] Transactions fetched:', transactionsResponse.transactions?.length || 0);
        
        // Get connected accounts and their balances
        console.log('🤖 [AI Context] Fetching connected accounts...');
        const accountsResponse = await bankingAPI.getConnectedBanks();
        console.log('🤖 [AI Context] Raw accounts response:', JSON.stringify(accountsResponse, null, 2));
        financialContext.accounts = accountsResponse.banks || [];
        console.log('🤖 [AI Context] Connected accounts fetched:', accountsResponse.banks?.length || 0);
        
        // Calculate total balance
        let totalBalance = 0;
        if (financialContext.accounts) {
          totalBalance = financialContext.accounts.reduce((sum: number, account: any) => {
            return sum + (account.balance || 0);
          }, 0);
        }
        financialContext.totalBalance = totalBalance;
        
        // Calculate monthly spending
        const currentMonth = new Date().toISOString().substring(0, 7);
        const monthlySpending = financialContext.recentTransactions
          ?.filter((tx: any) => tx.date?.startsWith(currentMonth) && parseFloat(tx.amount) < 0)
          ?.reduce((sum: number, tx: any) => sum + Math.abs(parseFloat(tx.amount)), 0) || 0;
        financialContext.monthlySpending = monthlySpending;
        
        console.log('🤖 [AI Context] ===== FINANCIAL DATA GATHERED =====');
        console.log('🤖 [AI Context] Transactions:', financialContext.recentTransactions?.length || 0);
        console.log('🤖 [AI Context] Accounts:', financialContext.accounts?.length || 0);
        console.log('🤖 [AI Context] Total Balance:', totalBalance);
        console.log('🤖 [AI Context] Monthly Spending:', monthlySpending);
        console.log('🤖 [AI Context] Has Financial Data:', financialContext.recentTransactions?.length > 0);
        console.log('🤖 [AI Context] =====================================');
        
      } catch (contextError) {
        console.warn('⚠️ [AI Context] Failed to gather financial context:', contextError);
        // Continue without context - AI will use general responses
      }
      
      const response = await aiAPI.post("/ai/insight", { 
        message,
        financialContext 
      });
      return response.data;
    } catch (error: any) {
      console.error("[AI API] Failed to get AI insight:", error);
      
      // Enhanced fallback for TestFlight/Production when AI endpoints might not be available
      if (error.response?.status === 404 || error.response?.status === 502 || error.response?.status === 503) {
        console.log("🤖 [AI Fallback] ===== AI ENDPOINT NOT AVAILABLE =====");
        console.log("🤖 [AI Fallback] Status:", error.response?.status);
        console.log("🤖 [AI Fallback] Using enhanced fallback with context");
        console.log("🤖 [AI Fallback] =======================================");
        
        // Generate contextual fallback responses using the financial data we gathered
        const lowerMessage = message.toLowerCase();
        let fallbackResponse = "";
        
        // Use gathered financial context to provide more personalized responses
        let financialContext: any = {};
        try {
          const transactionsResponse = await bankingAPI.getAllTransactions(20);
          const accountsResponse = await bankingAPI.getConnectedBanks();
          
          financialContext.recentTransactions = transactionsResponse.transactions || [];
          financialContext.accounts = accountsResponse.banks || [];
          
          let totalBalance = 0;
          if (financialContext.accounts) {
            totalBalance = financialContext.accounts.reduce((sum: number, account: any) => {
              return sum + (account.balance || 0);
            }, 0);
          }
          financialContext.totalBalance = totalBalance;
          
          const currentMonth = new Date().toISOString().substring(0, 7);
          const monthlySpending = financialContext.recentTransactions
            ?.filter((tx: any) => tx.date?.startsWith(currentMonth) && parseFloat(tx.amount) < 0)
            ?.reduce((sum: number, tx: any) => sum + Math.abs(parseFloat(tx.amount)), 0) || 0;
          financialContext.monthlySpending = monthlySpending;
        } catch {
          // If we can't get context, use empty context
        }
        
        const { totalBalance, monthlySpending, recentTransactions, accounts } = financialContext;
        const hasFinancialData = totalBalance !== undefined && recentTransactions?.length > 0;
        
        console.log("🤖 [AI Fallback] Financial Context Check:");
        console.log("🤖 [AI Fallback] - Total Balance:", totalBalance);
        console.log("🤖 [AI Fallback] - Recent Transactions:", recentTransactions?.length || 0);
        console.log("🤖 [AI Fallback] - Has Financial Data:", hasFinancialData);
        console.log("🤖 [AI Fallback] - Message Type:", lowerMessage);
        
        if (lowerMessage.includes('balance') || lowerMessage.includes('money')) {
          if (hasFinancialData) {
            fallbackResponse = `Based on your connected accounts, you currently have £${totalBalance?.toFixed(2) || '0.00'} across ${accounts?.length || 0} account${accounts?.length === 1 ? '' : 's'}. `;
            fallbackResponse += totalBalance > 1000 ? "Your balance looks healthy! Consider setting aside some money for savings." : "Keep track of your spending to help build up your balance over time.";
          } else {
            fallbackResponse = "I can see your account balances once your banks are connected. Try connecting a bank account to get personalized insights.";
          }
        } else if (lowerMessage.includes('spending') || lowerMessage.includes('spend')) {
          if (hasFinancialData && monthlySpending > 0) {
            fallbackResponse = `You've spent £${monthlySpending.toFixed(2)} this month based on your recent transactions. `;
            if (monthlySpending > totalBalance * 0.5) {
              fallbackResponse += "Your spending is quite high relative to your balance. Consider reviewing your expenses to identify areas where you can cut back.";
            } else {
              fallbackResponse += "Your spending appears to be manageable. Keep tracking your expenses to maintain good financial health.";
            }
          } else {
            fallbackResponse = "I can analyze your spending patterns once you have some transaction data. Connect your bank accounts to get detailed spending insights.";
          }
        } else if (lowerMessage.includes('transaction') || lowerMessage.includes('payment')) {
          if (hasFinancialData) {
            fallbackResponse = `I can see your last ${recentTransactions.length} transactions. Your most recent spending shows various categories. `;
            fallbackResponse += "Check the transactions tab to review and categorize them for better budgeting insights.";
          } else {
            fallbackResponse = "Your transactions will appear here once your bank accounts are connected and synced.";
          }
        } else if (lowerMessage.includes('budget') || lowerMessage.includes('save')) {
          if (hasFinancialData) {
            const suggestedSavings = Math.max(totalBalance * 0.1, 50);
            fallbackResponse = `Based on your current balance of £${totalBalance.toFixed(2)}, I suggest setting aside £${suggestedSavings.toFixed(2)} for savings. `;
            fallbackResponse += "Try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.";
          } else {
            fallbackResponse = "To help with budgeting, I need to see your transaction data. Connect your bank accounts to get personalized budget recommendations.";
          }
        } else {
          // Generic financial advice fallback
          fallbackResponse = hasFinancialData 
            ? `Hello! I can see you have ${accounts?.length || 0} connected account${accounts?.length === 1 ? '' : 's'} with a total balance of £${totalBalance?.toFixed(2) || '0.00'}. Feel free to ask me about your spending patterns, budgeting tips, or financial goals!`
            : "Hello! I'm your AI financial assistant. I can help you with budgeting, spending analysis, and financial planning. Connect your bank accounts to get personalized insights, or ask me any general financial questions!";
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

  // Get monthly financial report
  getMonthlyReport: async (month?: string, year?: string) => {
    try {
      const response = await aiAPI.get("/ai/monthly-report", {
        params: { month, year }
      });
      return response.data;
    } catch (error: any) {
      console.error("ERROR Error fetching monthly report:", error);
      
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