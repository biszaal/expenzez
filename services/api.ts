// =====================================================
// REFACTORED API - New modular structure
// =====================================================
// This file maintains backward compatibility while using 
// the new modular API structure under services/api/
// =====================================================

// Re-export all APIs from the new modular structure
export {
  authAPI,
  bankingAPI,
  aiService,
  expenseAPI,
  budgetAPI,
  profileAPI,
  notificationAPI,
  api,
  aiAPI,
  healthCheck,
  getCachedData,
  setCachedData,
  clearCachedData
} from './api/index';

// For backward compatibility, also export as default
import { api } from './api/index';
export default api;