import { api } from "../config/apiClient";

export interface CategorizationRequest {
  description: string;
  amount: number;
  merchantName?: string;
  date?: string;
}

export interface CategorizationResponse {
  success: boolean;
  category: string;
  confidence: number;
  reasoning?: string;
  tokensUsed?: number;
}

/**
 * AI-powered transaction categorization
 * Uses GPT-4o-mini to intelligently categorize transactions
 */
export const categorizeTransaction = async (
  request: CategorizationRequest
): Promise<CategorizationResponse> => {
  try {
    console.log(`[CategorizationAPI] Requesting categorization for: "${request.description}"`);

    const response = await api.post("/ai/categorize", request);

    console.log(`[CategorizationAPI] ✅ Categorized as "${response.data.category}" (${response.data.confidence})`);

    return response.data;
  } catch (error) {
    console.error("[CategorizationAPI] Error categorizing transaction:", error);

    // Fallback to basic categorization
    return {
      success: false,
      category: "Other",
      confidence: 0.3,
    };
  }
};

/**
 * Batch categorize multiple transactions
 */
export const categorizeBatch = async (
  transactions: CategorizationRequest[]
): Promise<CategorizationResponse[]> => {
  try {
    console.log(`[CategorizationAPI] Batch categorizing ${transactions.length} transactions...`);

    // Process in parallel with rate limiting (max 5 concurrent)
    const batchSize = 5;
    const results: CategorizationResponse[] = [];

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((tx) => categorizeTransaction(tx))
      );
      results.push(...batchResults);

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < transactions.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(`[CategorizationAPI] ✅ Batch categorization complete`);
    return results;
  } catch (error) {
    console.error("[CategorizationAPI] Error in batch categorization:", error);
    return transactions.map(() => ({
      success: false,
      category: "Other",
      confidence: 0.3,
    }));
  }
};
