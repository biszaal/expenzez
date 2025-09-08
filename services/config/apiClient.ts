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
    // Check if user is logged out to prevent unnecessary API calls
    // Exception: Allow banking callbacks and auth endpoints even when logged out
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    const allowedWhenLoggedOut = [
      '/nordigen/callback',
      '/banking/callback', 
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/confirm-signup',
      '/auth/resend-verification',
      '/auth/forgot-password',
      '/auth/confirm-forgot-password'
    ];
    
    const isAllowedEndpoint = allowedWhenLoggedOut.some(endpoint => config.url?.includes(endpoint));
    
    if (isLoggedIn === 'false' && !isAllowedEndpoint) {
      console.log(`[API] Interceptor: User logged out, cancelling request to ${config.url}`);
      const error = new Error('User is logged out');
      (error as any).config = config;
      (error as any).isUserLoggedOut = true;
      return Promise.reject(error);
    }

    // Don't add tokens to auth endpoints (they don't need/want them)
    const authEndpoints = [
      '/auth/login',
      '/auth/register', 
      '/auth/confirm-signup',
      '/auth/resend-verification',
      '/auth/forgot-password',
      '/auth/confirm-forgot-password'
    ];
    
    const isAuthEndpoint = authEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (isAuthEndpoint) {
      console.log(`[API] Interceptor: Auth endpoint ${config.url} - skipping token`);
      return config;
    }

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
    // Check if user is logged out to prevent unnecessary API calls
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'false') {
      console.log(`[AI API] Interceptor: User logged out, cancelling request to ${config.url}`);
      const error = new Error('User is logged out');
      (error as any).config = config;
      (error as any).isUserLoggedOut = true;
      return Promise.reject(error);
    }

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
    
    // Don't attempt token refresh for auth endpoints - they're supposed to return 401 sometimes
    const authEndpoints = [
      '/auth/login',
      '/auth/register', 
      '/auth/confirm-signup',
      '/auth/resend-verification',
      '/auth/forgot-password',
      '/auth/confirm-forgot-password'
    ];
    
    const isAuthEndpoint = authEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
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
          console.log(`[API] Token refresh failed - checking if this is a critical endpoint`);
          console.log(`[API] Request URL: ${originalRequest.url}`);
          
          // For critical endpoints like banking callbacks, allow the request to proceed without token
          const criticalEndpoints = ['/nordigen/callback', '/banking/callback', '/banks/callback'];
          const isCriticalEndpoint = criticalEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));
          
          // Also check if we're in a banking callback context (even for auth/refresh)
          let isBankingCallbackContext = false;
          try {
            // Check if there are recent banking requisitions (within 15 minutes - same as TokenManager)
            const keys = await import('@react-native-async-storage/async-storage').then(m => 
              m.default.getAllKeys().then(keys => keys.filter(key => key.startsWith('requisition_expenzez_')))
            );
            
            console.log(`[API] Banking callback detection - found keys:`, keys);
            
            isBankingCallbackContext = keys.some(key => {
              const match = key.match(/requisition_expenzez_(\d+)/);
              if (match) {
                const timestamp = parseInt(match[1]);
                const age = Date.now() - timestamp;
                const isRecent = age < 15 * 60 * 1000; // 15 minutes - same as TokenManager
                console.log(`[API] Key ${key}: timestamp=${timestamp}, age=${age}ms (${Math.round(age/1000)}s), isRecent=${isRecent}`);
                return isRecent;
              }
              return false;
            });
            
            console.log(`[API] Banking callback context detection result:`, isBankingCallbackContext);
          } catch (error) {
            console.log(`[API] Error checking banking callback context:`, error);
          }
          
          const shouldAllowWithoutAuth = isCriticalEndpoint || (isBankingCallbackContext && originalRequest.url?.includes('/auth/refresh'));
          console.log(`[API] Critical endpoint check: ${isCriticalEndpoint}, Banking context: ${isBankingCallbackContext}, Should allow: ${shouldAllowWithoutAuth} for URL ${originalRequest.url}`);
          
          if (shouldAllowWithoutAuth) {
            console.log(`[API] Allowing ${isCriticalEndpoint ? 'critical endpoint' : 'auth/refresh during banking callback'} ${originalRequest.url} to proceed without authentication`);
            delete originalRequest.headers.Authorization; // Remove auth header
            return api(originalRequest);
          } else {
            // Session has truly expired, clear auth state and redirect to login
            await AsyncStorage.setItem('isLoggedIn', 'false');
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('idToken');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('tokenExpiresAt');
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('userBudget');
            
            return Promise.reject(new Error('Session expired - please log in again'));
          }
        }
      } catch (refreshError: any) {
        // If token refresh fails due to network issues, don't mark user as logged out
        if (refreshError.code === 'ERR_NETWORK' || refreshError.message?.includes('Network Error')) {
          console.log(`[API] Token refresh failed due to network issues for ${originalRequest.url} - keeping user logged in`);
          return Promise.reject(error); // Return original 401 error, don't set logged out
        }
        
        // Session has truly expired, clear auth state
        await AsyncStorage.setItem('isLoggedIn', 'false');
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('idToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('tokenExpiresAt');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('userBudget');
        
        return Promise.reject(new Error('Session expired - please log in again'));
      }
    }
    
    // For auth endpoints with 401, just pass through the error without token refresh
    if (isAuthEndpoint && error.response?.status === 401) {
      console.log(`[API] Auth endpoint ${originalRequest.url} returned 401 - this is expected, not attempting token refresh`);
    }

    // Don't spam console with errors if user is already logged out
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'false') {
      return Promise.reject(error);
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
    
    // Don't attempt token refresh for auth endpoints - they're supposed to return 401 sometimes
    const authEndpoints = [
      '/auth/login',
      '/auth/register', 
      '/auth/confirm-signup',
      '/auth/resend-verification',
      '/auth/forgot-password',
      '/auth/confirm-forgot-password'
    ];
    
    const isAuthEndpoint = authEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
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
          // Session has truly expired, clear auth state and redirect to login
          await AsyncStorage.setItem('isLoggedIn', 'false');
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('idToken');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('tokenExpiresAt');
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('userBudget');
          
          return Promise.reject(new Error('Session expired - please log in again'));
        }
      } catch (refreshError: any) {
        // If token refresh fails due to network issues, don't mark user as logged out
        if (refreshError.code === 'ERR_NETWORK' || refreshError.message?.includes('Network Error')) {
          console.log(`[AI API] Token refresh failed due to network issues for ${originalRequest.url} - keeping user logged in`);
          return Promise.reject(error); // Return original 401 error, don't set logged out
        }
        
        // Session has truly expired, clear auth state
        await AsyncStorage.setItem('isLoggedIn', 'false');
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('idToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('tokenExpiresAt');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('userBudget');
        
        return Promise.reject(new Error('Session expired - please log in again'));
      }
    }
    
    // For auth endpoints with 401, just pass through the error without token refresh
    if (isAuthEndpoint && error.response?.status === 401) {
      console.log(`[AI API] Auth endpoint ${originalRequest.url} returned 401 - this is expected, not attempting token refresh`);
    }

    // Don't spam console with errors if user is already logged out
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'false') {
      return Promise.reject(error);
    }

    console.error(`[AI API] Request failed: ${originalRequest.url}`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    
    return Promise.reject(error);
  }
);