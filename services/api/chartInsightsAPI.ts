import { api } from "../config/apiClient";

export type ChartType = "balance" | "spending" | "budget" | "forecast" | "category";

export interface ChartInsightRequest {
  chartType: ChartType;
  data: any;
  context?: any;
}

export interface ChartInsightResponse {
  success: boolean;
  insight: string;
  expandedInsight?: string;
  priority: "high" | "medium" | "low";
  actionable?: string;
  cached?: boolean;
}

/**
 * Generate AI-powered insight for a chart or data visualization
 */
export const generateChartInsight = async (
  request: ChartInsightRequest
): Promise<ChartInsightResponse> => {
  try {
    console.log(`[ChartInsightsAPI] Requesting ${request.chartType} insight...`);

    const response = await api.post("/ai/chart-insight", request);

    if (response.data.cached) {
      console.log(`[ChartInsightsAPI] ✅ Received cached ${request.chartType} insight`);
    } else {
      console.log(`[ChartInsightsAPI] ✅ Generated fresh ${request.chartType} insight`);
    }

    return response.data;
  } catch (error: any) {
    // Handle rate limiting (429) gracefully
    if (error?.response?.status === 429 || error?.statusCode === 429) {
      console.warn(`[ChartInsightsAPI] ⚠️ Rate limit reached for ${request.chartType} insight`);
      // Return a friendly fallback response instead of throwing
      return {
        success: false,
        insight: "AI insights are temporarily unavailable due to high demand. Please try again in a few minutes.",
        priority: "low",
        actionable: "The AI insight feature has a rate limit to ensure fair usage. Your request will be available shortly.",
      };
    }

    // Handle other errors (like missing OpenAI configuration)
    console.warn(`[ChartInsightsAPI] ⚠️ ${request.chartType} insight unavailable (OpenAI may not be configured)`);
    throw error;
  }
};

/**
 * Generate balance card insight
 */
export const getBalanceInsight = async (
  currentBalance: number,
  previousBalance: number,
  income: number,
  expenses: number,
  period: string = "week"
): Promise<ChartInsightResponse> => {
  return generateChartInsight({
    chartType: "balance",
    data: {
      currentBalance,
      previousBalance,
      income,
      expenses,
      period,
    },
  });
};

/**
 * Generate spending chart insight
 */
export const getSpendingInsight = async (
  currentSpending: number,
  previousSpending: number,
  peakDay?: string,
  peakAmount?: number,
  dailyAverage?: number,
  trend?: "up" | "down" | "stable"
): Promise<ChartInsightResponse> => {
  return generateChartInsight({
    chartType: "spending",
    data: {
      currentSpending,
      previousSpending,
      peakDay,
      peakAmount,
      dailyAverage,
      trend,
    },
  });
};

/**
 * Generate budget progress insight
 */
export const getBudgetInsight = async (
  category: string,
  spent: number,
  limit: number,
  daysRemaining: number
): Promise<ChartInsightResponse> => {
  const percentUsed = (spent / limit) * 100;

  return generateChartInsight({
    chartType: "budget",
    data: {
      category,
      spent,
      limit,
      daysRemaining,
      percentUsed,
    },
  });
};

/**
 * Generate forecast insight
 */
export const getForecastInsight = async (
  predictedSpending: number,
  confidence: "high" | "medium" | "low",
  averageSpending: number,
  factors?: string[]
): Promise<ChartInsightResponse> => {
  return generateChartInsight({
    chartType: "forecast",
    data: {
      predictedSpending,
      confidence,
      averageSpending,
      factors,
    },
  });
};

/**
 * Generate category distribution insight
 */
export const getCategoryInsight = async (
  categories: Array<{ name: string; amount: number }>,
  totalSpending: number
): Promise<ChartInsightResponse> => {
  const topCategory = categories[0];

  return generateChartInsight({
    chartType: "category",
    data: {
      categories,
      topCategory: topCategory?.name,
      topAmount: topCategory?.amount,
      totalSpending,
    },
  });
};
