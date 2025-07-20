import { api } from "./api";

// Test function to verify EC2 backend connection
export const testEC2Connection = async () => {
  try {
    console.log("Testing connection to EC2 backend...");
    console.log("API Base URL:", api.defaults.baseURL);

    // Test health endpoint
    const healthResponse = await api.get("/health");
    console.log("Health check response:", healthResponse.data);

    // Test API health endpoint
    const apiHealthResponse = await api.get("/api/health");
    console.log("API health check response:", apiHealthResponse.data);

    return {
      success: true,
      health: healthResponse.data,
      apiHealth: apiHealthResponse.data,
    };
  } catch (error: any) {
    console.error("EC2 connection test failed:", error.message);
    return {
      success: false,
      error: error.message,
      details: error.response?.data || "No response data",
    };
  }
};

// Test function for authentication endpoints
export const testAuthEndpoints = async () => {
  try {
    console.log("Testing auth endpoints...");

    // Test if auth endpoints are accessible
    const response = await api.get("/auth/test");
    console.log("Auth test response:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Auth endpoints test failed:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Test function for banking endpoints
export const testBankingEndpoints = async () => {
  try {
    console.log("Testing banking endpoints...");

    // Test banking health
    const response = await api.get("/banking/test-nordigen");
    console.log("Banking test response:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Banking endpoints test failed:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};
