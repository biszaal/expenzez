/**
 * Banking API Configuration
 * Ensures isolation between development and production environments
 */

export const BANKING_CONFIG = {
  // Development banking API (finexer-integration branch)
  DEVELOPMENT: {
    API_URL: "https://vqto2y9lwf.execute-api.eu-west-2.amazonaws.com",
    STACK_NAME: "expenzez-banking-api-dev",
    ENVIRONMENT: "development",
  },

  // Production banking API (main branch)
  PRODUCTION: {
    API_URL: "https://3br5e90tn8.execute-api.eu-west-2.amazonaws.com/dev",
    STACK_NAME: "expenzez-backend-dev",
    ENVIRONMENT: "production",
  },
};

/**
 * Get the appropriate banking API URL based on environment
 */
export const getBankingApiUrl = (): string => {
  // Check if we're in development mode (finexer-integration branch)
  const isDevelopment = __DEV__ || process.env.NODE_ENV === "development";

  if (isDevelopment) {
    console.log(
      "🏗️ Using DEVELOPMENT banking API for Finexer integration testing"
    );
    return BANKING_CONFIG.DEVELOPMENT.API_URL;
  }

  console.log("🚀 Using PRODUCTION banking API for live app");
  return BANKING_CONFIG.PRODUCTION.API_URL;
};

/**
 * Check if we're using the development banking API
 */
export const isDevelopmentBanking = (): boolean => {
  return getBankingApiUrl() === BANKING_CONFIG.DEVELOPMENT.API_URL;
};
