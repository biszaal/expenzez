// Export all API modules
// Health check function
import { api } from '../config/apiClient';

export { authAPI } from './authAPI';
export { aiService } from './aiAPI';
export { expenseAPI } from './expenseAPI';
export { budgetAPI } from './budgetAPI';
export { profileAPI } from './profileAPI';
export { notificationAPI } from './notificationAPI';
export { securityAPI } from './securityAPI';
export { transactionAPI } from './transactionAPI';
export { achievementAPI } from './achievementAPI';
export { savingsInsightsAPI } from './savingsInsightsAPI';
export { goalsAPI } from './goalsAPI';

// Export configuration and utilities
export { api, aiAPI } from '../config/apiClient';
export { getCachedData, setCachedData, clearCachedData } from '../config/apiCache';

export const healthCheck = async () => {
  const response = await api.get("/health");
  return response.data;
};

export default api;