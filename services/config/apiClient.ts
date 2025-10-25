import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { CURRENT_API_CONFIG } from "../../config/api";
import { errorHandler, FrontendErrorCodes } from "../errorHandler";

// API Configuration
const API_BASE_URL = CURRENT_API_CONFIG.baseURL;

// Helper function to check if user is logged in by checking for tokens
const checkIsLoggedIn = async (): Promise<boolean> => {
  try {
    // Check both AsyncStorage (for backward compatibility) and SecureStore
    const [asyncLoggedIn, accessToken] = await Promise.all([
      AsyncStorage.getItem("isLoggedIn"),
      SecureStore.getItemAsync("accessToken", {
        keychainService: "expenzez-tokens",
      }),
    ]);

    // User is logged in if either AsyncStorage says so or we have tokens in SecureStore
    return asyncLoggedIn === "true" || !!accessToken;
  } catch (error) {
    console.log("[API] Error checking login status:", error);
    // Fallback to AsyncStorage check
    try {
      const asyncLoggedIn = await AsyncStorage.getItem("isLoggedIn");
      return asyncLoggedIn === "true";
    } catch (fallbackError) {
      console.log(
        "[API] Error checking AsyncStorage login status:",
        fallbackError
      );
      return false;
    }
  }
};

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
    // Exception: Allow auth endpoints even when logged out
    const isLoggedIn = await checkIsLoggedIn();
    const allowedWhenLoggedOut = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh",
      "/auth/confirm-signup",
      "/auth/resend-verification",
      "/auth/forgot-password",
      "/auth/confirm-forgot-password",
      "/auth/apple-login",
      "/auth/check-user-status",
    ];

    const isAllowedEndpoint = allowedWhenLoggedOut.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (!isLoggedIn && !isAllowedEndpoint) {
      console.log(
        `[API] Interceptor: User logged out, cancelling request to ${config.url}`
      );
      const error = new Error("User is logged out");
      (error as any).config = config;
      (error as any).isUserLoggedOut = true;
      return Promise.reject(error);
    }

    // Don't add tokens to auth endpoints (they don't need/want them)
    const authEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/confirm-signup",
      "/auth/resend-verification",
      "/auth/forgot-password",
      "/auth/confirm-forgot-password",
      "/auth/apple-login",
    ];

    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (isAuthEndpoint) {
      console.log(
        `[API] Interceptor: Auth endpoint ${config.url} - skipping token`
      );
      return config;
    }

    try {
      // Import tokenManager dynamically to avoid circular dependency
      const { tokenManager } = await import("../tokenManager");
      const token = await tokenManager.getValidAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
      }
      return config;
    } catch (error: any) {
      // If token refresh fails due to network issues, log but continue with request
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("Network Error")
      ) {
        console.log(
          `[API] Interceptor: Network error during token refresh for ${config.url} - continuing without token`
        );
      } else {
        console.error(
          `[API] Interceptor: Token error for ${config.url}:`,
          error
        );
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
    const isLoggedIn = await checkIsLoggedIn();
    if (!isLoggedIn) {
      console.log(
        `[AI API] Interceptor: User logged out, cancelling request to ${config.url}`
      );
      const error = new Error("User is logged out");
      (error as any).config = config;
      (error as any).isUserLoggedOut = true;
      return Promise.reject(error);
    }

    console.log(`[AI API] Interceptor: Requesting token for ${config.url}`);
    try {
      const { tokenManager } = await import("../tokenManager");
      const token = await tokenManager.getValidAccessToken();
      if (token) {
        console.log(`[AI API] Interceptor: Token obtained for ${config.url}`);
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log(
          `[AI API] Interceptor: No token available for ${config.url}`
        );
      }
      return config;
    } catch (error: any) {
      // If token refresh fails due to network issues, don't proceed with the API call
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("Network Error")
      ) {
        console.log(
          `[AI API] Interceptor: Network error during token refresh for ${config.url} - aborting request`
        );
        return Promise.reject(
          new Error("Network error prevented token refresh - request aborted")
        );
      }
      console.error(
        `[AI API] Interceptor: Token error for ${config.url}:`,
        error
      );
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

    // 🔍 DEBUG: Log raw axios error for /bills/preferences requests
    if (originalRequest.url?.includes('/bills/preferences')) {
      console.log('[API Interceptor] RAW ERROR for /bills/preferences:', {
        url: originalRequest.url,
        method: originalRequest.method,
        requestData: originalRequest.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers,
        errorMessage: error.message
      });
    }

    // Create error context for better logging
    const errorContext = {
      endpoint: originalRequest.url,
      timestamp: Date.now(),
      additionalData: {
        method: originalRequest.method?.toUpperCase(),
        headers: originalRequest.headers,
      },
    };

    // Don't attempt token refresh for auth endpoints - they're supposed to return 401 sometimes
    const authEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/confirm-signup",
      "/auth/resend-verification",
      "/auth/forgot-password",
      "/auth/confirm-forgot-password",
    ];

    // Don't trigger session expiry for security endpoints - 401 is expected for wrong PINs
    const securityEndpoints = [
      "/security/validate-pin",
      "/security/setup-pin",
      "/security/change-pin",
    ];

    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint)
    );
    const isSecurityEndpoint = securityEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint)
    );

    // Check for optional/graceful degradation endpoints first - these should fail silently
    const optionalEndpoints = [
      "/briefs/daily",
      "/alerts/pending",
      "/ai/monthly-report/latest",
      "/notifications/preferences",
      "/notifications/history",
      "/subscription/usage", // Usage tracking - non-critical, can fail silently
      "/insights/savings-opportunities", // Savings insights - optional feature
      "/achievements", // Achievement system - optional gamification feature
      "/savings-insights", // Savings insights - optional feature (alternative endpoint)
      "/goals", // Goals system - optional feature with fallback data
    ];
    const isOptionalEndpoint = optionalEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint)
    );

    // For optional endpoints, fail silently without token refresh or error handler
    if (
      isOptionalEndpoint &&
      (error.response?.status === 401 ||
        error.response?.status === 404 ||
        error.response?.status === 503)
    ) {
      console.log(
        `[API] Optional endpoint ${originalRequest.url} failed (${error.response?.status}) - continuing without this feature`
      );
      // Mark this error as expected so error handler skips logging
      error.isOptionalEndpoint = true;
      error.suppressErrorLogging = true;
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint &&
      !isSecurityEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const { tokenManager } = await import("../tokenManager");
        const newToken = await tokenManager.refreshTokenIfNeeded();

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          console.log(
            `[API] Token refresh failed - checking if this is a critical endpoint`
          );

          // For critical endpoints like security validation, allow the request to proceed without token
          const criticalEndpoints = [
            "/security/validate-pin", // Allow PIN validation failures without logout
            "/security/setup-pin", // Allow PIN setup failures without logout
            "/security/change-pin", // Allow PIN change failures without logout
          ];

          // Endpoints that should fail gracefully without triggering immediate logout (GET requests only)
          const gracefulDegradationEndpoints = [
            "/notifications/preferences",
            "/notifications/history",
            "/subscription/usage", // Usage tracking - non-critical, can fail silently
          ];

          // Special handling for subscription endpoint - only GET requests should degrade gracefully
          const requestMethod = originalRequest.method?.toUpperCase() || "GET";
          const isSubscriptionEndpoint =
            originalRequest.url?.includes("/subscription");
          const isSubscriptionGet =
            isSubscriptionEndpoint && requestMethod === "GET";

          const isCriticalEndpoint = criticalEndpoints.some((endpoint) =>
            originalRequest.url?.includes(endpoint)
          );
          const isGracefulDegradationEndpoint =
            gracefulDegradationEndpoints.some((endpoint) =>
              originalRequest.url?.includes(endpoint)
            ) || isSubscriptionGet;

          // Special handling for subscription POST requests during trial activation
          const isSubscriptionPost =
            isSubscriptionEndpoint && requestMethod === "POST";
          const isTrialActivation =
            isSubscriptionPost && originalRequest.data?.status === "trialing";

          const shouldAllowWithoutAuth = isCriticalEndpoint;
          console.log(
            `[API] Critical endpoint check: ${isCriticalEndpoint}, Graceful degradation: ${isGracefulDegradationEndpoint} (Subscription GET: ${isSubscriptionGet}), Trial activation: ${isTrialActivation}, Should allow: ${shouldAllowWithoutAuth} for URL ${originalRequest.url} (Method: ${requestMethod})`
          );

          if (shouldAllowWithoutAuth) {
            console.log(
              `[API] Allowing critical endpoint ${originalRequest.url} to proceed without authentication`
            );
            delete originalRequest.headers.Authorization; // Remove auth header
            return api(originalRequest);
          } else if (isGracefulDegradationEndpoint) {
            // For graceful degradation endpoints, return a 401 error without triggering logout
            console.log(
              `[API] Graceful degradation endpoint ${originalRequest.url} failed - returning 401 without logout`
            );
            const error = {
              response: {
                status: 401,
                data: {
                  error: {
                    code: "AUTH_REQUIRED",
                    message: "Authentication required",
                  },
                },
              },
              message: "Authentication required for this endpoint",
            };
            return Promise.reject(error);
          } else if (isTrialActivation) {
            // For trial activation, return a 401 error without triggering logout
            console.log(
              `[API] Trial activation subscription save failed - returning 401 without logout`
            );
            const error = {
              response: {
                status: 401,
                data: {
                  error: {
                    code: "TRIAL_SAVE_AUTH_REQUIRED",
                    message:
                      "Trial activated locally, database save will be retried",
                  },
                },
              },
              message: "Trial subscription save failed - will retry later",
            };
            return Promise.reject(error);
          } else {
            // Use error handler for session expiration
            const sessionError = await errorHandler.handleError(
              {
                response: {
                  status: 401,
                  data: { error: { code: "AUTH_SESSION_EXPIRED" } },
                },
                message: "Session expired - please log in again",
              },
              errorContext
            );

            return Promise.reject(sessionError.transformedError);
          }
        }
      } catch (refreshError: any) {
        // If token refresh fails due to network issues, don't mark user as logged out
        if (
          refreshError.code === "ERR_NETWORK" ||
          refreshError.message?.includes("Network Error")
        ) {
          console.log(
            `[API] Token refresh failed due to network issues for ${originalRequest.url} - keeping user logged in`
          );
          // Transform network error using error handler
          const networkError = await errorHandler.handleError(
            refreshError,
            errorContext
          );
          return Promise.reject(networkError.transformedError);
        }

        // Handle token refresh failure
        const refreshFailureError = await errorHandler.handleError(
          {
            response: {
              status: 401,
              data: { error: { code: "AUTH_REFRESH_FAILED" } },
            },
            message: "Token refresh failed - session expired",
          },
          errorContext
        );

        return Promise.reject(refreshFailureError.transformedError);
      }
    }

    // For auth endpoints with 401, just pass through the error without token refresh
    if (isAuthEndpoint && error.response?.status === 401) {
      console.log(
        `[API] Auth endpoint ${originalRequest.url} returned 401 - this is expected, not attempting token refresh`
      );
    }

    // For security endpoints with 401, pass through without session expiry logic
    if (
      isSecurityEndpoint &&
      (error.response?.status === 401 || error.response?.status === 400)
    ) {
      console.log(
        `[API] Security endpoint ${originalRequest.url} returned ${error.response?.status} - this is expected for wrong PIN, not triggering logout`
      );
      return Promise.reject(error); // Pass through raw error without error handler
    }

    // Don't spam console with errors if user is already logged out
    const isLoggedIn = await checkIsLoggedIn();
    if (!isLoggedIn) {
      // Still transform the error for consistency
      const transformedError = await errorHandler.handleError(
        error,
        errorContext
      );
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
    console.log(
      `[AI API] Response: ${response.config.url} - ${response.status}`
    );
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
        apiType: "AI",
      },
    };

    // Don't attempt token refresh for auth endpoints - they're supposed to return 401 sometimes
    const authEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/confirm-signup",
      "/auth/resend-verification",
      "/auth/forgot-password",
      "/auth/confirm-forgot-password",
    ];

    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint)
    );

    // Check for optional AI endpoints that should fail silently
    const optionalAIEndpoints = [
      "/ai/chat-history", // Reading history is optional
      "/ai/insight", // Newer endpoint with fallback to /ai/chat-message
      "/ai/monthly-report/latest",
      "/ai/predict", // Predictive analytics - optional feature
    ];
    const isOptionalAIEndpoint = optionalAIEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint)
    );

    // For optional AI endpoints, fail silently without token refresh or error handler
    if (
      isOptionalAIEndpoint &&
      (error.response?.status === 401 ||
        error.response?.status === 404 ||
        error.response?.status === 503)
    ) {
      console.log(
        `[AI API] Optional endpoint ${originalRequest.url} failed (${error.response?.status}) - continuing without this feature`
      );
      // Mark this error as expected so error handler skips logging
      error.isOptionalEndpoint = true;
      error.suppressErrorLogging = true;
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      console.log(
        `[AI API] 401 Unauthorized: ${originalRequest.url} - Attempting token refresh`
      );
      originalRequest._retry = true;

      try {
        const { tokenManager } = await import("../tokenManager");
        const newToken = await tokenManager.refreshTokenIfNeeded();

        if (newToken) {
          console.log(
            `[AI API] Token refreshed successfully for retry: ${originalRequest.url}`
          );
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return aiAPI(originalRequest);
        } else {
          // Don't immediately log out on AI API failures - use graceful degradation
          console.log(
            "[AI API] Token refresh failed - API will return null/fallback data"
          );

          // Return a user-friendly error that doesn't trigger logout
          const aiError = new Error("AI features temporarily unavailable");
          aiError.name = "AI_TEMPORARILY_UNAVAILABLE";
          return Promise.reject(aiError);
        }
      } catch (refreshError: any) {
        // If token refresh fails due to network issues, don't mark user as logged out
        if (
          refreshError.code === "ERR_NETWORK" ||
          refreshError.message?.includes("Network Error")
        ) {
          console.log(
            `[AI API] Token refresh failed due to network issues for ${originalRequest.url} - keeping user logged in`
          );
          // Transform network error using error handler
          const networkError = await errorHandler.handleError(
            refreshError,
            errorContext
          );
          return Promise.reject(networkError.transformedError);
        }

        // Handle token refresh failure gracefully for AI API
        console.log(
          "[AI API] Token refresh failed - AI features will be temporarily unavailable"
        );
        const aiError = new Error(
          "AI features temporarily unavailable due to authentication"
        );
        aiError.name = "AI_TEMPORARILY_UNAVAILABLE";

        return Promise.reject(aiError);
      }
    }

    // For auth endpoints with 401, just pass through the error without token refresh
    if (isAuthEndpoint && error.response?.status === 401) {
      console.log(
        `[AI API] Auth endpoint ${originalRequest.url} returned 401 - this is expected, not attempting token refresh`
      );
    }

    // Handle rate limiting (429) errors specially - don't transform them
    if (error.response?.status === 429) {
      console.log(
        `[AI API] Rate limit hit (429) for ${originalRequest.url} - passing through for retry logic`
      );
      return Promise.reject(error);
    }

    // Check if this is an optional endpoint that should fail silently
    if (
      error.suppressErrorLogging === true ||
      error.isOptionalEndpoint === true
    ) {
      console.log(
        `[AI API] Optional endpoint ${originalRequest.url} failed - continuing without this feature`
      );
      return Promise.reject(error);
    }

    // Don't spam console with errors if user is already logged out
    const isLoggedIn = await checkIsLoggedIn();
    if (!isLoggedIn) {
      // Still transform the error for consistency
      const transformedError = await errorHandler.handleError(
        error,
        errorContext
      );
      return Promise.reject(transformedError.transformedError);
    }

    // Use centralized error handler for all other errors
    const handledError = await errorHandler.handleError(error, errorContext);
    return Promise.reject(handledError.transformedError);
  }
);
