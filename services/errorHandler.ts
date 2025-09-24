/**
 * Production-level error handling service for Expenzez frontend
 * Handles session expiration, network errors, and provides user-friendly fallbacks
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { sessionManager } from './sessionManager';

export interface ErrorContext {
  userId?: string;
  endpoint?: string;
  userAgent?: string;
  timestamp?: number;
  additionalData?: Record<string, any>;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
  correlationId?: string;
  requiresLogout?: boolean;
  retryable?: boolean;
  retryAfter?: number;
}

export class ExpenzezFrontendError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;
  public context?: ErrorContext;
  public correlationId?: string;
  public requiresLogout: boolean;
  public retryable: boolean;
  public retryAfter?: number;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any,
    context?: ErrorContext,
    requiresLogout: boolean = false,
    retryable: boolean = false,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'ExpenzezFrontendError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.context = context;
    this.correlationId = details?.correlationId || `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.requiresLogout = requiresLogout;
    this.retryable = retryable;
    this.retryAfter = retryAfter;
  }
}

// Frontend-specific error codes
export const FrontendErrorCodes = {
  // Session & Authentication
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT',
  BIOMETRIC_AUTH_FAILED: 'BIOMETRIC_AUTH_FAILED',
  
  // Network & Connectivity
  NETWORK_UNAVAILABLE: 'NETWORK_UNAVAILABLE',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',
  
  // API Responses
  API_ERROR: 'API_ERROR',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Financial
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // UI & UX
  CACHE_ERROR: 'CACHE_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  NAVIGATION_ERROR: 'NAVIGATION_ERROR',
  
  // Fallbacks
  FALLBACK_DATA_USED: 'FALLBACK_DATA_USED',
  OFFLINE_MODE: 'OFFLINE_MODE',
  
  // Unknown
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type FrontendErrorCode = typeof FrontendErrorCodes[keyof typeof FrontendErrorCodes];

// User-friendly error messages
const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  [FrontendErrorCodes.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
  [FrontendErrorCodes.TOKEN_REFRESH_FAILED]: 'Unable to refresh your session. Please log in again.',
  'AUTH_SESSION_EXPIRED': 'Your session has expired. Please log in again.',
  'AUTH_TOKEN_EXPIRED': 'Your authentication has expired. Please log in again.',
  'AUTH_REFRESH_FAILED': 'Unable to refresh your session. Please log in again.',
  [FrontendErrorCodes.NETWORK_UNAVAILABLE]: 'No internet connection. Please check your network and try again.',
  [FrontendErrorCodes.REQUEST_TIMEOUT]: 'Request timed out. Please try again.',
  [FrontendErrorCodes.SERVER_UNAVAILABLE]: 'Our servers are temporarily unavailable. Please try again later.',
  [FrontendErrorCodes.RATE_LIMITED]: 'Too many requests. Please wait a moment before trying again.',
  [FrontendErrorCodes.BIOMETRIC_AUTH_FAILED]: 'Biometric authentication failed. Please try again or use your PIN.',
  [FrontendErrorCodes.INSUFFICIENT_PERMISSIONS]: 'You don\'t have permission to perform this action.',
  [FrontendErrorCodes.CACHE_ERROR]: 'Error loading cached data. The app will refresh.',
  [FrontendErrorCodes.STORAGE_ERROR]: 'Error accessing device storage. Please restart the app.',
  [FrontendErrorCodes.OFFLINE_MODE]: 'You\'re currently offline. Some features may be limited.',
  [FrontendErrorCodes.FALLBACK_DATA_USED]: 'Using offline data. Some information may be outdated.',
  [FrontendErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
};

// Recovery actions for different error types
const RECOVERY_ACTIONS: Record<string, string[]> = {
  [FrontendErrorCodes.SESSION_EXPIRED]: ['logout', 'redirect_login'],
  [FrontendErrorCodes.TOKEN_REFRESH_FAILED]: ['logout', 'redirect_login'],
  'AUTH_SESSION_EXPIRED': ['logout', 'redirect_login'],
  'AUTH_TOKEN_EXPIRED': ['logout', 'redirect_login'], 
  'AUTH_REFRESH_FAILED': ['logout', 'redirect_login'],
  [FrontendErrorCodes.NETWORK_UNAVAILABLE]: ['retry', 'use_cache', 'show_offline_message'],
  [FrontendErrorCodes.REQUEST_TIMEOUT]: ['retry', 'show_retry_button'],
  [FrontendErrorCodes.SERVER_UNAVAILABLE]: ['retry_later', 'use_cache', 'show_maintenance_message'],
  [FrontendErrorCodes.RATE_LIMITED]: ['wait_and_retry', 'show_cooldown_timer'],
  [FrontendErrorCodes.BIOMETRIC_AUTH_FAILED]: ['retry_biometric', 'fallback_to_pin'],
  [FrontendErrorCodes.CACHE_ERROR]: ['clear_cache', 'refresh_data'],
  [FrontendErrorCodes.STORAGE_ERROR]: ['clear_storage', 'restart_app'],
  [FrontendErrorCodes.OFFLINE_MODE]: ['use_cache', 'show_offline_banner'],
  [FrontendErrorCodes.FALLBACK_DATA_USED]: ['show_info_banner', 'try_refresh'],
  [FrontendErrorCodes.UNKNOWN_ERROR]: ['retry', 'report_error']
};

class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  
  static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  // Transform various error types into ExpenzezFrontendError
  transformError(error: any, context?: ErrorContext): ExpenzezFrontendError {
    // Already our error type
    if (error instanceof ExpenzezFrontendError) {
      return error;
    }

    // Handle API errors from backend
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      
      // Determine if this error should trigger logout
      const sessionExpirationCodes = [
        'AUTH_SESSION_EXPIRED',
        'AUTH_TOKEN_EXPIRED', 
        'AUTH_REFRESH_FAILED',
        'TOKEN_EXPIRED',
        'SESSION_EXPIRED'
      ];
      
      const shouldLogout = apiError.requiresLogout || 
                          sessionExpirationCodes.includes(apiError.code) ||
                          (error.response.status === 401 && !apiError.retryable);
      
      return new ExpenzezFrontendError(
        apiError.code || FrontendErrorCodes.API_ERROR,
        apiError.message || 'API request failed',
        error.response.status || 500,
        {
          ...apiError.details,
          correlationId: apiError.correlationId,
          originalError: error.message
        },
        context,
        shouldLogout,
        apiError.retryable || false,
        apiError.retryAfter
      );
    }

    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return new ExpenzezFrontendError(
        FrontendErrorCodes.NETWORK_UNAVAILABLE,
        'Network connection unavailable',
        0,
        { originalError: error.message },
        context,
        false,
        true
      );
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new ExpenzezFrontendError(
        FrontendErrorCodes.REQUEST_TIMEOUT,
        'Request timed out',
        408,
        { originalError: error.message },
        context,
        false,
        true
      );
    }

    // Handle HTTP status errors
    if (error.response?.status) {
      const status = error.response.status;
      
      if (status === 401) {
        return new ExpenzezFrontendError(
          FrontendErrorCodes.SESSION_EXPIRED,
          'Your session has expired',
          401,
          { originalError: error.message },
          context,
          true,
          false
        );
      }
      
      if (status === 403) {
        return new ExpenzezFrontendError(
          FrontendErrorCodes.INSUFFICIENT_PERMISSIONS,
          'Insufficient permissions',
          403,
          { originalError: error.message },
          context,
          false,
          false
        );
      }
      
      if (status === 404) {
        // Check if this is a security endpoint 404 (expected during development)
        const isSecurityEndpoint = context?.endpoint?.includes('/security/');

        if (isSecurityEndpoint) {
          // Security endpoints may not be available during development - this is expected
          return new ExpenzezFrontendError(
            'SECURITY_ENDPOINT_UNAVAILABLE',
            'Security service temporarily unavailable',
            404,
            { originalError: error.message, expectedBehavior: true },
            context,
            false,
            false
          );
        }
        
        return new ExpenzezFrontendError(
          'RESOURCE_NOT_FOUND',
          'The requested resource was not found',
          404,
          { originalError: error.message },
          context,
          false,
          false
        );
      }
      
      if (status === 429) {
        return new ExpenzezFrontendError(
          FrontendErrorCodes.RATE_LIMITED,
          'Too many requests',
          429,
          { originalError: error.message },
          context,
          false,
          true,
          error.response.headers?.['retry-after'] ? parseInt(error.response.headers['retry-after']) : 60
        );
      }
      
      if (status >= 500) {
        return new ExpenzezFrontendError(
          FrontendErrorCodes.SERVER_UNAVAILABLE,
          'Server is temporarily unavailable',
          status,
          { originalError: error.message },
          context,
          false,
          true
        );
      }
    }

    // Handle user logout scenarios
    if (error.isUserLoggedOut || error.message === 'User is logged out') {
      return new ExpenzezFrontendError(
        FrontendErrorCodes.USER_LOGGED_OUT,
        'User is logged out',
        401,
        { originalError: error.message },
        context,
        false, // Don't trigger logout since user is already logged out
        false
      );
    }

    // Default unknown error
    return new ExpenzezFrontendError(
      FrontendErrorCodes.UNKNOWN_ERROR,
      'An unexpected error occurred',
      500,
      { originalError: error.message || 'Unknown error' },
      context,
      false,
      true
    );
  }

  // Get user-friendly message for error
  getUserFriendlyMessage(error: ExpenzezFrontendError): string {
    return USER_FRIENDLY_MESSAGES[error.code] || error.message || USER_FRIENDLY_MESSAGES[FrontendErrorCodes.UNKNOWN_ERROR];
  }

  // Get recovery actions for error
  getRecoveryActions(error: ExpenzezFrontendError): string[] {
    return RECOVERY_ACTIONS[error.code] || RECOVERY_ACTIONS[FrontendErrorCodes.UNKNOWN_ERROR];
  }

  // Handle error with appropriate recovery actions
  async handleError(error: any, context?: ErrorContext): Promise<{
    transformedError: ExpenzezFrontendError;
    userMessage: string;
    recoveryActions: string[];
    handled: boolean;
  }> {
    const transformedError = this.transformError(error, context);
    const userMessage = this.getUserFriendlyMessage(transformedError);
    const recoveryActions = this.getRecoveryActions(transformedError);
    
    // Log error (structured for production monitoring)
    this.logError(transformedError, context);
    
    // Perform automatic recovery actions
    let handled = false;
    
    if (transformedError.requiresLogout) {
      console.log(`[ErrorHandler] Session expired - using graceful session manager`);
      try {
        // Use the new session manager for graceful handling
        const sessionRestored = await sessionManager.handleApiSessionExpiration();
        if (sessionRestored) {
          console.log(`[ErrorHandler] Session restored successfully - continuing`);
          handled = true;
        } else {
          console.log(`[ErrorHandler] Session could not be restored - user will be notified`);
          // Session manager handles user notification and graceful logout
          handled = true;
        }
      } catch (sessionError) {
        console.error(`[ErrorHandler] Session manager failed:`, sessionError);
        // Fallback to original logout behavior
        await this.performLogout();
        this.redirectToLogin();
        handled = true;
      }
    }
    
    // Perform other automatic recovery actions
    for (const action of recoveryActions) {
      try {
        handled = await this.performRecoveryAction(action, transformedError) || handled;
      } catch (recoveryError) {
        console.error(`Failed to perform recovery action ${action}:`, recoveryError);
      }
    }
    
    return {
      transformedError,
      userMessage,
      recoveryActions,
      handled
    };
  }

  // Perform specific recovery actions
  private async performRecoveryAction(action: string, error: ExpenzezFrontendError): Promise<boolean> {
    switch (action) {
      case 'logout':
        return await this.performLogout();
      
      case 'redirect_login':
        return this.redirectToLogin();
      
      case 'clear_cache':
        return await this.clearCache();
      
      case 'use_cache':
        // This would be handled by the calling component
        return false;
      
      case 'show_offline_message':
      case 'show_retry_button':
      case 'show_maintenance_message':
      case 'show_reconnect_prompt':
      case 'show_cooldown_timer':
      case 'show_info_banner':
      case 'show_offline_banner':
        // These are UI actions that should be handled by components
        return false;
      
      case 'retry':
      case 'retry_later':
      case 'wait_and_retry':
      case 'try_refresh':
        // These should be handled by the calling component
        return false;
      
      default:
        return false;
    }
  }

  // Perform user logout
  private async performLogout(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove([
        'isLoggedIn',
        'accessToken',
        'idToken',
        'refreshToken',
        'tokenExpiresAt',
        'user',
        'userBudget'
      ]);
      
      console.log('[ErrorHandler] User logged out due to session expiration');
      return true;
    } catch (error) {
      console.error('[ErrorHandler] Failed to clear user session:', error);
      return false;
    }
  }

  // Redirect to login screen
  private redirectToLogin(): boolean {
    try {
      console.log('[ErrorHandler] Redirecting to login screen...');
      router.replace('/auth/Login' as any);
      console.log('[ErrorHandler] Successfully initiated redirect to login');
      return true;
    } catch (error) {
      console.error('[ErrorHandler] Failed to redirect to login:', error);
      return false;
    }
  }

  // Clear app cache
  private async clearCache(): Promise<boolean> {
    try {
      // Clear specific cache keys (implement based on your caching strategy)
      const cacheKeys = await AsyncStorage.getAllKeys();
      const cacheKeysToRemove = cacheKeys.filter(key => 
        key.startsWith('cache_') || 
        key.startsWith('api_cache_') ||
        key.includes('_cached_')
      );
      
      if (cacheKeysToRemove.length > 0) {
        await AsyncStorage.multiRemove(cacheKeysToRemove);
        console.log(`[ErrorHandler] Cleared ${cacheKeysToRemove.length} cache entries`);
      }
      
      return true;
    } catch (error) {
      console.error('[ErrorHandler] Failed to clear cache:', error);
      return false;
    }
  }

  // Log error with structured format
  private logError(error: ExpenzezFrontendError, context?: ErrorContext): void {
    // Don't log expected behaviors as errors
    const isExpectedBehavior = error.details?.expectedBehavior === true;
    
    // Check if this is a development endpoint that's expected to fail
    const isSecurityEndpoint = context?.endpoint?.includes('/security/');
    const isNotificationEndpoint = context?.endpoint?.includes('/notifications/');
    const isDevelopmentEndpoint = isSecurityEndpoint || isNotificationEndpoint;
    
    // Skip logging development endpoint errors in development (404s, timeouts)
    if (isDevelopmentEndpoint && (error.statusCode === 404 || error.code === 'REQUEST_TIMEOUT')) {
      return; // Completely silent for expected development errors
    }
    
    const logLevel = isExpectedBehavior ? 'INFO' : 'ERROR';
    
    const logEntry = {
      level: logLevel,
      timestamp: new Date().toISOString(),
      correlationId: error.correlationId,
      error: {
        name: error.name,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        requiresLogout: error.requiresLogout,
        retryable: error.retryable,
        retryAfter: error.retryAfter,
        details: error.details
      },
      context: { ...error.context, ...context },
      platform: 'mobile',
      userAgent: context?.userAgent || 'unknown'
    };

    // Use structured logging with appropriate level
    if (isExpectedBehavior) {
      console.info('[STRUCTURED_INFO]', JSON.stringify(logEntry));
    } else {
      console.error('[STRUCTURED_ERROR]', JSON.stringify(logEntry));
    }
    
    // Also log human-readable version for development
    if (__DEV__) {
      if (isExpectedBehavior) {
        console.info(`ℹ️ [${error.code}] ${error.message} (Expected behavior)`, {
          statusCode: error.statusCode,
          context: error.context,
          details: error.details,
          correlationId: error.correlationId
        });
      } else {
        console.error(`🚨 [${error.code}] ${error.message}`, {
          statusCode: error.statusCode,
          context: error.context,
          details: error.details,
          correlationId: error.correlationId
        });
      }
    }
  }


  // Check if error should trigger logout
  shouldTriggerLogout(error: ExpenzezFrontendError): boolean {
    const logoutTriggers = [
      'SESSION_EXPIRED',
      'TOKEN_REFRESH_FAILED'
    ];
    return error.requiresLogout || logoutTriggers.includes(error.code);
  }

  // Check if error is retryable
  isRetryable(error: ExpenzezFrontendError): boolean {
    const retryableErrors = [
      'NETWORK_UNAVAILABLE',
      'REQUEST_TIMEOUT', 
      'SERVER_UNAVAILABLE',
      'RATE_LIMITED'
    ];
    return error.retryable || retryableErrors.includes(error.code);
  }

  // Get retry delay for retryable errors
  getRetryDelay(error: ExpenzezFrontendError, attemptNumber: number = 1): number {
    if (error.retryAfter) {
      return error.retryAfter * 1000; // Convert to milliseconds
    }
    
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(Math.pow(2, attemptNumber - 1) * 1000, 30000);
  }
}

// Export singleton instance and utility functions
export const errorHandler = ErrorHandlerService.getInstance();

// Utility functions for common error scenarios
export const createSessionExpiredError = (context?: ErrorContext) =>
  new ExpenzezFrontendError(
    FrontendErrorCodes.SESSION_EXPIRED,
    'Your session has expired',
    401,
    undefined,
    context,
    true
  );

export const createNetworkError = (context?: ErrorContext) =>
  new ExpenzezFrontendError(
    FrontendErrorCodes.NETWORK_UNAVAILABLE,
    'Network connection unavailable',
    0,
    undefined,
    context,
    false,
    true
  );


// Error boundary helper
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: ExpenzezFrontendError;
  userMessage?: string;
  recoveryActions?: string[];
}

export const getErrorBoundaryState = (error: any): ErrorBoundaryState => {
  const transformedError = errorHandler.transformError(error);
  return {
    hasError: true,
    error: transformedError,
    userMessage: errorHandler.getUserFriendlyMessage(transformedError),
    recoveryActions: errorHandler.getRecoveryActions(transformedError)
  };
};