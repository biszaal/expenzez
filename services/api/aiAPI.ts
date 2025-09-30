import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { aiAPI } from "../config/apiClient";
import { transactionAPI } from "./transactionAPI";
import { goalsAPI, GoalsResponse } from "./goalsAPI";
import { achievementAPI, AchievementResponse } from "./achievementAPI";
import { savingsInsightsAPI, SavingsInsightsResponse } from "./savingsInsightsAPI";
import { BillsAPI } from "./billsAPI";
import SubscriptionOptimizer from "../subscriptionOptimizer";

export const aiService = {
  // AI Assistant functionality
  getAIInsight: async (message: string) => {
    try {
      const token = await SecureStore.getItemAsync("accessToken", { keychainService: 'expenzez-tokens' });

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

        // 💰 SUBSCRIPTION OPTIMIZATION: Analyze recurring bills for duplicates
        try {
          const bills = await BillsAPI.getBills();
          if (bills.length > 0) {
            const subscriptionAnalysis = await SubscriptionOptimizer.analyzeBillsWithPreferences(bills);
            if (subscriptionAnalysis.length > 0) {
              financialContext.subscriptionOptimization = {
                hasDuplicates: true,
                opportunities: subscriptionAnalysis,
                summary: SubscriptionOptimizer.generateAISummary(bills)
              };
            }
          }
        } catch (billError) {
          console.log("AI subscription analysis warning:", billError);
          // Continue without subscription analysis
        }

      } catch (contextError) {
        console.log("AI context gathering error:", contextError);
        // Continue without context - AI will use general responses
      }

      const response = await aiAPI.post("/ai/insight", {
        message,
        financialContext
      });

      // Check if backend returned success but no actual answer
      if (response.data && !response.data.answer && !response.data.response && !response.data.message) {
        console.log('⚠️ [AI] Backend returned success but no answer field, using fallback');
        // Treat as if endpoint returned 404 - trigger fallback
        throw { response: { status: 404 } };
      }

      return response.data;
    } catch (error: any) {
      // Enhanced fallback for when AI endpoints might not be available
      if (error.response?.status === 404 || error.response?.status === 500 || error.response?.status === 502 || error.response?.status === 503) {

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
        } else if (lowerMessage.includes('subscription') || lowerMessage.includes('duplicate') || lowerMessage.includes('cancel')) {
          // Check for subscription optimization opportunities
          try {
            const bills = await BillsAPI.getBills();
            if (bills.length > 0) {
              const duplicates = await SubscriptionOptimizer.analyzeBillsWithPreferences(bills);
              if (duplicates.length > 0) {
                const topSaving = duplicates[0];
                fallbackResponse = `💰 I found ${duplicates.length} way${duplicates.length > 1 ? 's' : ''} to save money on subscriptions!\n\n`;
                fallbackResponse += `**${topSaving.category}**: You're paying £${topSaving.totalMonthlyCost.toFixed(2)}/month for ${topSaving.subscriptions.length} services. `;
                fallbackResponse += `${topSaving.recommendation}\n\n`;
                fallbackResponse += `💵 Potential savings: £${topSaving.potentialAnnualSavings.toFixed(2)}/year\n\n`;
                fallbackResponse += "Ask me 'How do I cancel [service name]?' for step-by-step instructions, or say 'I want to keep all my subscriptions' if you prefer.";
              } else {
                fallbackResponse = "Great news! I didn't find any duplicate subscriptions. Your subscriptions appear to be optimized. Keep tracking your bills to ensure you're not paying for unused services.";
              }
            } else {
              fallbackResponse = "I can help you analyze subscriptions once you add some recurring bills. Go to the Bills tab to add your subscriptions, and I'll analyze them for potential savings.";
            }
          } catch (error) {
            fallbackResponse = "I can analyze your subscriptions for duplicates and suggest cancellations to save money. Add your recurring bills in the Bills tab, and I'll help you optimize your spending!";
          }
        } else if (lowerMessage.includes('how do i cancel') || lowerMessage.includes('how to cancel')) {
          // Extract service name from message
          const serviceMatch = lowerMessage.match(/cancel\s+(.+)/);
          if (serviceMatch) {
            const serviceName = serviceMatch[1].replace(/\?/g, '').trim();
            const guide = SubscriptionOptimizer.generateCancellationGuide(serviceName);
            fallbackResponse = `📱 **How to Cancel ${guide.service}**\n\n`;
            fallbackResponse += `⏱️ Average time: ${guide.averageTime}\n\n`;
            fallbackResponse += guide.steps.join('\n');
            if (guide.warning) {
              fallbackResponse += `\n\n⚠️ ${guide.warning}`;
            }
          } else {
            fallbackResponse = "Which subscription would you like to cancel? Just ask me 'How do I cancel Netflix?' or mention any other service, and I'll provide step-by-step instructions.";
          }
        } else if (lowerMessage.includes('keep all') || lowerMessage.includes('keep my subscription') || lowerMessage.includes('don\'t cancel')) {
          // User wants to keep all their subscriptions
          try {
            const bills = await BillsAPI.getBills();
            const duplicates = await SubscriptionOptimizer.analyzeBillsWithPreferences(bills);

            if (duplicates.length > 0) {
              // Save preference for each duplicate category
              for (const duplicate of duplicates) {
                const subscriptionNames = duplicate.subscriptions.map(s => s.name);
                await SubscriptionOptimizer.saveUserPreference(
                  duplicate.category,
                  subscriptionNames,
                  'keep_all'
                );
              }

              fallbackResponse = `✅ Understood! I've noted that you want to keep all your subscriptions. I won't suggest canceling them again for the next 90 days.\n\n`;
              fallbackResponse += `If you change your mind later, just ask me "Analyze my subscriptions" and I'll check again.`;
            } else {
              fallbackResponse = "I don\'t have any cancellation recommendations active right now. If you want to review your subscriptions, just ask me 'Analyze my subscriptions'.";
            }
          } catch (error) {
            fallbackResponse = "I've noted your preference. If you'd like me to analyze your subscriptions in the future, just ask!";
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

  // Generate proactive insights based on user's financial data
  generateProactiveInsights: async (userId: string): Promise<ProactiveInsight[]> => {
    try {
      console.log('🧠 [AI] Generating proactive insights for user:', userId);

      const insights: ProactiveInsight[] = [];

      // Gather financial context from all APIs
      let goalsData: GoalsResponse | null = null;
      let achievementsData: AchievementResponse | null = null;
      let savingsData: SavingsInsightsResponse | null = null;
      let transactionsData: any = null;

      try {
        const [goals, achievements, savings, transactions] = await Promise.allSettled([
          goalsAPI.getUserGoals(userId),
          achievementAPI.getUserAchievements(userId),
          savingsInsightsAPI.getSavingsOpportunities(userId),
          transactionAPI.getTransactions({ limit: 20 })
        ]);

        if (goals.status === 'fulfilled') goalsData = goals.value;
        if (achievements.status === 'fulfilled') achievementsData = achievements.value;
        if (savings.status === 'fulfilled') savingsData = savings.value;
        if (transactions.status === 'fulfilled') transactionsData = transactions.value;
      } catch (error) {
        console.log('AI insights: Error gathering context, proceeding with available data');
      }

      // Goal-based insights
      if (goalsData) {
        // New goal milestone reached
        if (achievementsData?.newAchievements?.some(a => a.type === 'goal_milestone')) {
          insights.push({
            id: 'goal_milestone_celebration',
            type: 'celebration',
            title: '🎉 Goal Milestone Reached!',
            message: "Congratulations! You've hit a major milestone. This is a great time to review your progress and maybe set your next target even higher.",
            priority: 'high',
            actionable: true,
            suggestedActions: ['Review goal progress', 'Set new milestone', 'Celebrate your success'],
            relatedGoalId: achievementsData.newAchievements.find(a => a.type === 'goal_milestone')?.goalId
          });
        }

        // Goals falling behind - add safety check
        const behindGoals = (goalsData.goalProgress && Array.isArray(goalsData.goalProgress))
          ? goalsData.goalProgress.filter(p => !p.isOnTrack)
          : [];
        if (behindGoals.length > 0) {
          insights.push({
            id: 'goals_behind_schedule',
            type: 'warning',
            title: '⚠️ Some Goals Need Attention',
            message: `You have ${behindGoals.length} goal${behindGoals.length > 1 ? 's' : ''} that might need a strategy adjustment. Let's see how we can get back on track.`,
            priority: 'medium',
            actionable: true,
            suggestedActions: ['Review goal timeline', 'Increase monthly savings', 'Consider goal adjustment'],
            relatedGoalId: behindGoals[0].goalId
          });
        }

        // No active goals
        if (goalsData.activeGoals.length === 0) {
          insights.push({
            id: 'no_active_goals',
            type: 'suggestion',
            title: '🎯 Ready to Set Your First Goal?',
            message: "Financial goals are the foundation of wealth building. Even a small emergency fund of £500 can make a huge difference in your financial confidence.",
            priority: 'high',
            actionable: true,
            suggestedActions: ['Set emergency fund goal', 'Plan vacation savings', 'Start retirement planning']
          });
        }
      }

      // Achievement-based insights
      if (achievementsData?.newAchievements && achievementsData.newAchievements.length > 0) {
        const latestAchievement = achievementsData.newAchievements[0];
        insights.push({
          id: 'new_achievement_earned',
          type: 'celebration',
          title: '🏆 New Achievement Unlocked!',
          message: `You've earned "${latestAchievement.title}"! You're building excellent financial habits. Keep up the momentum!`,
          priority: 'high',
          actionable: true,
          suggestedActions: ['Share your success', 'Set next challenge', 'Review progress']
        });
      }

      // Savings opportunity insights
      if (savingsData?.opportunities && savingsData.opportunities.length > 0) {
        const topOpportunity = savingsData.opportunities[0];
        insights.push({
          id: 'top_savings_opportunity',
          type: 'tip',
          title: '💡 Quick Savings Tip',
          message: `You could save £${topOpportunity.potentialMonthlySavings}/month by ${topOpportunity.title.toLowerCase()}. ${topOpportunity.description}`,
          priority: 'medium',
          actionable: true,
          suggestedActions: topOpportunity.actionSteps?.slice(0, 3) || ['Review expenses', 'Make changes', 'Track savings']
        });
      }

      // Level progression insights
      if (achievementsData?.progress) {
        const { level, pointsToNextLevel } = achievementsData.progress;
        if (pointsToNextLevel <= 50) {
          insights.push({
            id: 'level_up_soon',
            type: 'motivation',
            title: '🚀 Almost Level Up!',
            message: `You're only ${pointsToNextLevel} points away from level ${level + 1}! Complete a few more financial actions to unlock the next level.`,
            priority: 'low',
            actionable: true,
            suggestedActions: ['Add transactions', 'Review budget', 'Set new goal']
          });
        }
      }

      // Time-based insights
      const now = new Date();
      const dayOfMonth = now.getDate();
      const dayOfWeek = now.getDay();

      // Monthly check-in
      if (dayOfMonth >= 28) {
        insights.push({
          id: 'monthly_review',
          type: 'suggestion',
          title: '📊 Month-End Review Time',
          message: "It's the end of the month! This is a perfect time to review your spending, check goal progress, and plan for next month.",
          priority: 'medium',
          actionable: true,
          suggestedActions: ['Review monthly spending', 'Check goal progress', 'Plan next month budget']
        });
      }

      // Weekend planning
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        insights.push({
          id: 'weekend_planning',
          type: 'suggestion',
          title: '🌟 Weekend Financial Planning',
          message: "Weekends are great for financial planning! Take 10 minutes to review your goals and maybe set up some automated savings.",
          priority: 'low',
          actionable: true,
          suggestedActions: ['Review goals', 'Set up auto-save', 'Plan week ahead']
        });
      }

      console.log(`✅ [AI] Generated ${insights.length} proactive insights`);
      return insights;
    } catch (error: any) {
      console.error('❌ [AI] Error generating proactive insights:', error);
      // Return basic insights even if API calls fail
      return [
        {
          id: 'welcome_insight',
          type: 'tip',
          title: '💡 Financial Tip',
          message: "Start small but start today! Even saving £5 a week adds up to £260 a year. Every small step counts towards your financial freedom.",
          priority: 'medium',
          actionable: true,
          suggestedActions: ['Set weekly savings goal', 'Track daily expenses', 'Review spending habits']
        }
      ];
    }
  },

  // Get conversation starters based on user context
  getConversationStarters: async (userId: string): Promise<string[]> => {
    try {
      const insights = await aiService.generateProactiveInsights(userId);
      const starters: string[] = [];

      // Generate contextual conversation starters based on insights
      if (insights.some(i => i.type === 'celebration')) {
        starters.push("Tell me about my recent achievements");
        starters.push("How am I doing with my financial goals?");
      }

      if (insights.some(i => i.type === 'warning')) {
        starters.push("Help me get back on track with my goals");
        starters.push("What can I do to improve my savings rate?");
      }

      // Always include these general starters
      starters.push("What's my spending pattern this month?");
      starters.push("Give me a personalized budget tip");
      starters.push("How can I save money this week?");
      starters.push("What should I focus on financially right now?");

      return starters.slice(0, 6); // Return top 6 starters
    } catch (error) {
      // Fallback starters
      return [
        "What's my spending pattern this month?",
        "How can I save money?",
        "Help me create a budget",
        "Give me a financial tip",
        "How am I doing with my goals?",
        "What should I focus on next?"
      ];
    }
  }
};

// Types for proactive insights
export interface ProactiveInsight {
  id: string;
  type: 'tip' | 'warning' | 'celebration' | 'suggestion' | 'motivation';
  title: string;
  message: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions: string[];
  relatedGoalId?: string;
  expiresAt?: string;
}