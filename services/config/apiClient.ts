import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CURRENT_API_CONFIG } from "../../config/api";
import { errorHandler, FrontendErrorCodes } from "../errorHandler";

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

    try {
      // Import tokenManager dynamically to avoid circular dependency
      const { tokenManager } = await import('../tokenManager');
      const token = await tokenManager.getValidAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
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
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Create error context for better logging
    const errorContext = {
      endpoint: originalRequest.url,
      timestamp: Date.now(),
      additionalData: {
        method: originalRequest.method?.toUpperCase(),
        headers: originalRequest.headers
      }
    };
    
    // Don't attempt token refresh for auth endpoints - they're supposed to return 401 sometimes
    const authEndpoints = [
      '/auth/login',
      '/auth/register', 
      '/auth/confirm-signup',
      '/auth/resend-verification',
      '/auth/forgot-password',
      '/auth/confirm-forgot-password'
    ];
    
    // Don't trigger session expiry for security endpoints - 401 is expected for wrong PINs
    const securityEndpoints = [
      '/security/validate-pin',
      '/security/setup-pin',
      '/security/change-pin'
    ];
    
    const isAuthEndpoint = authEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));
    const isSecurityEndpoint = securityEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const { tokenManager } = await import('../tokenManager');
        const newToken = await tokenManager.refreshTokenIfNeeded();
        
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          console.log(`[API] Token refresh failed - checking if this is a critical endpoint`);
          
          // For critical endpoints like banking callbacks and security validation, allow the request to proceed without token
          const criticalEndpoints = [
            '/nordigen/callback',
            '/banking/callback',
            '/banks/callback',
            '/security/validate-pin',  // Allow PIN validation failures without logout
            '/security/setup-pin',     // Allow PIN setup failures without logout
            '/security/change-pin',    // Allow PIN change failures without logout
          ];

          // Endpoints that should fail gracefully without triggering immediate logout (GET requests only)
          const gracefulDegradationEndpoints = [
            '/notifications/preferences',
            '/notifications/history',
          ];

          // Special handling for subscription endpoint - only GET requests should degrade gracefully
          const requestMethod = originalRequest.method?.toUpperCase() || 'GET';
          const isSubscriptionEndpoint = originalRequest.url?.includes('/subscription');
          const isSubscriptionGet = isSubscriptionEndpoint && requestMethod === 'GET';

          const isCriticalEndpoint = criticalEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));
          const isGracefulDegradationEndpoint = gracefulDegradationEndpoints.some(endpoint => originalRequest.url?.includes(endpoint)) || isSubscriptionGet;

          // Also check if we're in a banking callback context (even for auth/refresh)
          let isBankingCallbackContext = false;
          try {
            // Check if there are recent banking requisitions (within 3 minutes for active contexts)
            // Note: This is different from session preservation (15 minutes) - this is for active banking flows
            const keys = await import('@react-native-async-storage/async-storage').then(m =>
              m.default.getAllKeys().then(keys => keys.filter(key => key.startsWith('requisition_expenzez_')))
            );


            isBankingCallbackContext = keys.some(key => {
              const match = key.match(/requisition_expenzez_(\d+)/);
              if (match) {
                const timestamp = parseInt(match[1]);
                const age = Date.now() - timestamp;
                const isActive = age < 3 * 60 * 1000; // 3 minutes for active banking flows
                return isActive;
              }
              return false;
            });

          } catch (error) {
            console.log(`[API] Error checking banking callback context:`, error);
          }

          // Special handling for subscription POST requests during trial activation
          const isSubscriptionPost = isSubscriptionEndpoint && requestMethod === 'POST';
          const isTrialActivation = isSubscriptionPost && originalRequest.data?.status === 'trialing';

          const shouldAllowWithoutAuth = isCriticalEndpoint || (isBankingCallbackContext && originalRequest.url?.includes('/auth/refresh'));
          console.log(`[API] Critical endpoint check: ${isCriticalEndpoint}, Banking context: ${isBankingCallbackContext}, Graceful degradation: ${isGracefulDegradationEndpoint} (Subscription GET: ${isSubscriptionGet}), Trial activation: ${isTrialActivation}, Should allow: ${shouldAllowWithoutAuth} for URL ${originalRequest.url} (Method: ${requestMethod})`);

          if (shouldAllowWithoutAuth) {
            console.log(`[API] Allowing ${isCriticalEndpoint ? 'critical endpoint' : 'auth/refresh during banking callback'} ${originalRequest.url} to proceed without authentication`);
            delete originalRequest.headers.Authorization; // Remove auth header
            return api(originalRequest);
          } else if (isGracefulDegradationEndpoint) {
            // For graceful degradation endpoints, return a 401 error without triggering logout
            console.log(`[API] Graceful degradation endpoint ${originalRequest.url} failed - returning 401 without logout`);
            const error = {
              response: {
                status: 401,
                data: { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } }
              },
              message: 'Authentication required for this endpoint'
            };
            return Promise.reject(error);
          } else if (isTrialActivation) {
            // For trial activation, return a 401 error without triggering logout
            console.log(`[API] Trial activation subscription save failed - returning 401 without logout`);
            const error = {
              response: {
                status: 401,
                data: { error: { code: 'TRIAL_SAVE_AUTH_REQUIRED', message: 'Trial activated locally, database save will be retried' } }
              },
              message: 'Trial subscription save failed - will retry later'
            };
            return Promise.reject(error);
          } else {
            // Use error handler for session expiration
            const sessionError = await errorHandler.handleError(
              {
                response: { status: 401, data: { error: { code: 'AUTH_SESSION_EXPIRED' } } },
                message: 'Session expired - please log in again'
              },
              errorContext
            );

            return Promise.reject(sessionError.transformedError);
          }
        }
      } catch (refreshError: any) {
        // If token refresh fails due to network issues, don't mark user as logged out
        if (refreshError.code === 'ERR_NETWORK' || refreshError.message?.includes('Network Error')) {
          console.log(`[API] Token refresh failed due to network issues for ${originalRequest.url} - keeping user logged in`);
          // Transform network error using error handler
          const networkError = await errorHandler.handleError(refreshError, errorContext);
          return Promise.reject(networkError.transformedError);
        }
        
        // Handle token refresh failure
        const refreshFailureError = await errorHandler.handleError(
          {
            response: { status: 401, data: { error: { code: 'AUTH_REFRESH_FAILED' } } },
            message: 'Token refresh failed - session expired'
          },
          errorContext
        );
        
        return Promise.reject(refreshFailureError.transformedError);
      }
    }
    
    // For auth endpoints with 401, just pass through the error without token refresh
    if (isAuthEndpoint && error.response?.status === 401) {
      console.log(`[API] Auth endpoint ${originalRequest.url} returned 401 - this is expected, not attempting token refresh`);
    }

    // For security endpoints with 401, pass through without session expiry logic
    if (isSecurityEndpoint && (error.response?.status === 401 || error.response?.status === 400)) {
      console.log(`[API] Security endpoint ${originalRequest.url} returned ${error.response?.status} - this is expected for wrong PIN, not triggering logout`);
      return Promise.reject(error); // Pass through raw error without error handler
    }

    // Don't spam console with errors if user is already logged out
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'false') {
      // Still transform the error for consistency
      const transformedError = await errorHandler.handleError(error, errorContext);
      return Promise.reject(transformedError.transformedError);
    }

    // Use centralized error handler for all other errors
    const handledError = await errorHandler.handleError(error, errorContext);
    return Promise.reject(handledError.transformedError);
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
    
    // Create error context for better logging
    const errorContext = {
      endpoint: originalRequest.url,
      timestamp: Date.now(),
      additionalData: {
        method: originalRequest.method?.toUpperCase(),
        apiType: 'AI'
      }
    };
    
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
          // Don't immediately log out on AI API failures - use graceful degradation
          console.log('[AI API] Token refresh failed - API will return null/fallback data');

          // Return a user-friendly error that doesn't trigger logout
          const aiError = new Error('AI features temporarily unavailable');
          aiError.name = 'AI_TEMPORARILY_UNAVAILABLE';
          return Promise.reject(aiError);
        }
      } catch (refreshError: any) {
        // If token refresh fails due to network issues, don't mark user as logged out
        if (refreshError.code === 'ERR_NETWORK' || refreshError.message?.includes('Network Error')) {
          console.log(`[AI API] Token refresh failed due to network issues for ${originalRequest.url} - keeping user logged in`);
          // Transform network error using error handler
          const networkError = await errorHandler.handleError(refreshError, errorContext);
          return Promise.reject(networkError.transformedError);
        }
        
        // Handle token refresh failure gracefully for AI API
        console.log('[AI API] Token refresh failed - AI features will be temporarily unavailable');
        const aiError = new Error('AI features temporarily unavailable due to authentication');
        aiError.name = 'AI_TEMPORARILY_UNAVAILABLE';

        return Promise.reject(aiError);
      }
    }
    
    // For auth endpoints with 401, just pass through the error without token refresh
    if (isAuthEndpoint && error.response?.status === 401) {
      console.log(`[AI API] Auth endpoint ${originalRequest.url} returned 401 - this is expected, not attempting token refresh`);
    }

    // Don't spam console with errors if user is already logged out
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'false') {
      // Still transform the error for consistency
      const transformedError = await errorHandler.handleError(error, errorContext);
      return Promise.reject(transformedError.transformedError);
    }

    // Use centralized error handler for all other errors
    const handledError = await errorHandler.handleError(error, errorContext);
    return Promise.reject(handledError.transformedError);
  }
);