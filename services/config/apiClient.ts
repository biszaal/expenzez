import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CURRENT_API_CONFIG } from "../../config/api";

// API Configuration
const API_BASE_URL = CURRENT_API_CONFIG.baseURL;

// Create main axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: CURRENT_API_CONFIG.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create separate axios instance for AI endpoints
export const aiAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: CURRENT_API_CONFIG.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    console.log(`[API] Interceptor: Requesting token for ${config.url}`);
    try {
      // Import tokenManager dynamically to avoid circular dependency
      const { tokenManager } = await import('../tokenManager');
      const token = await tokenManager.getValidAccessToken();
      if (token) {
        console.log(`[API] Interceptor: Token obtained for ${config.url}`);
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log(`[API] Interceptor: No token available for ${config.url}`);
      }
      return config;
    } catch (error: any) {
      // If token refresh fails due to network issues, log but continue with request
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        console.log(`[API] Interceptor: Network error during token refresh for ${config.url} - continuing without token`);
      } else {
        console.error(`[API] Interceptor: Token error for ${config.url}:`, error);
      }
      return config; // Continue without token
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Request interceptor for AI API
aiAPI.interceptors.request.use(
  async (config) => {
    console.log(`[AI API] Interceptor: Requesting token for ${config.url}`);
    try {
      const { tokenManager } = await import('../tokenManager');
      const token = await tokenManager.getValidAccessToken();
      if (token) {
        console.log(`[AI API] Interceptor: Token obtained for ${config.url}`);
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log(`[AI API] Interceptor: No token available for ${config.url}`);
      }
      return config;
    } catch (error: any) {
      // If token refresh fails due to network issues, don't proceed with the API call
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        console.log(`[AI API] Interceptor: Network error during token refresh for ${config.url} - aborting request`);
        return Promise.reject(new Error('Network error prevented token refresh - request aborted'));
      }
      console.error(`[AI API] Interceptor: Token error for ${config.url}:`, error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for main API
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response: ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log(`[API] 401 Unauthorized: ${originalRequest.url} - Attempting token refresh`);
      originalRequest._retry = true;

      try {
        const { tokenManager } = await import('../tokenManager');
        const newToken = await tokenManager.refreshTokenIfNeeded();
        
        if (newToken) {
          console.log(`[API] Token refreshed successfully for retry: ${originalRequest.url}`);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          console.log(`[API] Token refresh failed - tokens may already be cleared by tokenManager`);
          // Don't clear tokens here - let tokenManager handle token clearing decisions
          await AsyncStorage.setItem('isLoggedIn', 'false');
        }
      } catch (refreshError: any) {
        // If token refresh fails due to network issues, don't mark user as logged out
        if (refreshError.code === 'ERR_NETWORK' || refreshError.message?.includes('Network Error')) {
          console.log(`[API] Token refresh failed due to network issues for ${originalRequest.url} - keeping user logged in`);
          return Promise.reject(error); // Return original 401 error, don't set logged out
        }
        console.error(`[API] Error during token refresh:`, refreshError);
        await AsyncStorage.setItem('isLoggedIn', 'false');
      }
    }

    console.error(`[API] Request failed: ${originalRequest.url}`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    
    return Promise.reject(error);
  }
);

// Response interceptor for AI API (same as main API)
aiAPI.interceptors.response.use(
  (response) => {
    console.log(`[AI API] Response: ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log(`[AI API] 401 Unauthorized: ${originalRequest.url} - Attempting token refresh`);
      originalRequest._retry = true;

      try {
        const { tokenManager } = await import('../tokenManager');
        const newToken = await tokenManager.refreshTokenIfNeeded();
        
        if (newToken) {
          console.log(`[AI API] Token refreshed successfully for retry: ${originalRequest.url}`);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return aiAPI(originalRequest);
        } else {
          console.log(`[AI API] Token refresh failed - tokens may already be cleared by tokenManager`);
          // Don't clear tokens here - let tokenManager handle token clearing decisions
          await AsyncStorage.setItem('isLoggedIn', 'false');
        }
      } catch (refreshError: any) {
        // If token refresh fails due to network issues, don't mark user as logged out
        if (refreshError.code === 'ERR_NETWORK' || refreshError.message?.includes('Network Error')) {
          console.log(`[AI API] Token refresh failed due to network issues for ${originalRequest.url} - keeping user logged in`);
          return Promise.reject(error); // Return original 401 error, don't set logged out
        }
        console.error(`[AI API] Error during token refresh:`, refreshError);
        await AsyncStorage.setItem('isLoggedIn', 'false');
      }
    }

    console.error(`[AI API] Request failed: ${originalRequest.url}`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    
    return Promise.reject(error);
  }
);