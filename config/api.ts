import { ENV_CONFIG } from './environment';

export const CURRENT_API_CONFIG = {
  // Environment-specific API base URL
  baseURL: ENV_CONFIG.apiBaseURL,
  timeout: 10000, // Reduced from 30s to 10s for faster development feedback
};
