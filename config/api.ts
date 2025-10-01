import { ENV_CONFIG } from './environment';

export const CURRENT_API_CONFIG = {
  // Environment-specific API base URL
  baseURL: ENV_CONFIG.apiBaseURL,
  timeout: 30000, // 30s timeout for AI requests (OpenAI can take 10-15s)
};
