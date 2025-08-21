import { ENV_CONFIG } from './environment';

export const CURRENT_API_CONFIG = {
  // Environment-specific API base URL
  baseURL: ENV_CONFIG.apiBaseURL,
  // Previous API (backup): "https://g77tomv0vk.execute-api.eu-west-2.amazonaws.com"
  timeout: 30000,
};
