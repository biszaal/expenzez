// Export all API modules
export { authAPI } from './authAPI';
export { bankingAPI } from './bankingAPI';
export { aiService } from './aiAPI';
export { expenseAPI } from './expenseAPI';
export { budgetAPI } from './budgetAPI';
export { profileAPI } from './profileAPI';
export { notificationAPI } from './notificationAPI';

// Export configuration and utilities
export { api, aiAPI } from '../config/apiClient';
export { getCachedData, setCachedData, clearCachedData } from '../config/apiCache';

// Health check function
import { api } from '../config/apiClient';

export const healthCheck = async () => {
  const response = await api.get("/health");
  return response.data;
};

export default api;