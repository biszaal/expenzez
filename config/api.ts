// API Configuration for different environments
export const API_CONFIG = {
  // Production - AWS Lambda
  production: {
    baseURL: "https://td9m2wqin1.execute-api.eu-west-2.amazonaws.com",
    timeout: 30000,
  },

  // Development - Local network
  development: {
    baseURL: "http://192.168.0.93:3001/api",
    timeout: 30000,
  },

  // Work network
  work: {
    baseURL: "http://192.168.1.76:3001/api",
    timeout: 30000,
  },
};

// Get current environment
const getEnvironment = () => {
  // You can set this based on your build environment
  // For now, default to production (EC2)
  return "production";
};

export const getApiConfig = () => {
  const env = getEnvironment();
  return API_CONFIG[env as keyof typeof API_CONFIG] || API_CONFIG.production;
};

// Export current config
export const CURRENT_API_CONFIG = getApiConfig();
