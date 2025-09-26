import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { secureStorage } from './secureStorage';
import { AppState, AppStateStatus } from 'react-native';
import { deviceManager } from './deviceManager';

export interface TokenInfo {
  token: string;
  expiresAt: number;
  isExpired: boolean;
  shouldRefresh: boolean; // If expires in next 5 minutes
}

export interface StoredTokens {
  accessToken: string;
  idToken?: string;
  refreshToken: string;
  tokenExpiresAt?: number;
}

class TokenManager {
  private refreshPromise: Promise<string | null> | null = null;
  private appStateSubscription: any = null;
  private refreshAttempts: number = 0;
  private lastRefreshAttempt: number = 0;

  constructor() {
    this.setupAppStateListener();
  }

  /**
   * Setup app state listener to check tokens when app becomes active
   */
  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  /**
   * Handle app state changes - check tokens when app becomes active
   */
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      this.checkAndRefreshTokenIfNeeded();
    }
  };

  /**
   * Parse JWT token to get expiration time
   */
  private parseJWTExpiration(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
    } catch (_error) {
      return null;
    }
  }

  /**
   * Get token information including expiration status
   */
  async getTokenInfo(token: string): Promise<TokenInfo> {
    const expiresAt = this.parseJWTExpiration(token) || 0;
    const now = Date.now();
    const isExpired = expiresAt <= now;
    const shouldRefresh = expiresAt <= now + 15 * 60 * 1000; // 15 minutes before expiry (increased from 5 minutes)

    return {
      token,
      expiresAt,
      isExpired,
      shouldRefresh
    };
  }

  /**
   * Get stored tokens from AsyncStorage
   */
  async getStoredTokens(): Promise<StoredTokens | null> {
    try {
      const [accessToken, idToken, refreshToken, tokenExpiresAt] = await Promise.all([
        SecureStore.getItemAsync('accessToken', { keychainService: 'expenzez-tokens' }),
        SecureStore.getItemAsync('idToken', { keychainService: 'expenzez-tokens' }),
        SecureStore.getItemAsync('refreshToken', { keychainService: 'expenzez-tokens' }),
        SecureStore.getItemAsync('tokenExpiresAt', { keychainService: 'expenzez-tokens' })
      ]);

      if (!accessToken || !refreshToken) {
        return null;
      }

      return {
        accessToken,
        idToken: idToken || undefined,
        refreshToken,
        tokenExpiresAt: tokenExpiresAt ? parseInt(tokenExpiresAt) : undefined
      };
    } catch (_error) {
      return null;
    }
  }

  /**
   * Store tokens securely
   */
  async storeTokens(tokens: {
    accessToken: string;
    idToken?: string;
    refreshToken: string;
  }): Promise<void> {
    try {
      const expiresAt = this.parseJWTExpiration(tokens.accessToken);

      const storagePromises = [
        SecureStore.setItemAsync('accessToken', tokens.accessToken, {
          keychainService: 'expenzez-tokens',
          requireAuthentication: false
        }),
        SecureStore.setItemAsync('refreshToken', tokens.refreshToken, {
          keychainService: 'expenzez-tokens',
          requireAuthentication: false
        })
      ];

      if (tokens.idToken) {
        storagePromises.push(SecureStore.setItemAsync('idToken', tokens.idToken, {
          keychainService: 'expenzez-tokens',
          requireAuthentication: false
        }));
      }

      if (expiresAt) {
        storagePromises.push(SecureStore.setItemAsync('tokenExpiresAt', expiresAt.toString(), {
          keychainService: 'expenzez-tokens',
          requireAuthentication: false
        }));
      }

      await Promise.all(storagePromises);
    } catch (_error) {
      throw _error;
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string | null> {
    try {
      // Add timeout protection to the entire token validation process
      const tokenTimeout = new Promise<null>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Token validation timeout'));
        }, 35000);
      });

      const tokenPromise = this.getValidAccessTokenInternal();
      return await Promise.race([tokenPromise, tokenTimeout]);
    } catch (error: any) {
      return null;
    }
  }

  private async getValidAccessTokenInternal(): Promise<string | null> {
    const storedTokens = await this.getStoredTokens();
    if (!storedTokens) {
      return null;
    }

    const tokenInfo = await this.getTokenInfo(storedTokens.accessToken);
    
    // If token is not expired and doesn't need refresh, return it
    if (!tokenInfo.isExpired && !tokenInfo.shouldRefresh) {
      return storedTokens.accessToken;
    }

    // Check for persistent session before clearing tokens
    const now = Date.now();
    const timeExpired = now - tokenInfo.expiresAt;
    
    // For trusted devices, extend the grace period significantly
    const isTrustedDevice = await deviceManager.isDeviceTrusted();
    const persistentSession = await deviceManager.getPersistentSession();
    
    // Secure grace periods - maximum 24 hours for security
    const maxExpiredTime = isTrustedDevice && persistentSession ?
      (24 * 60 * 60 * 1000) : // 24 hours for trusted devices (reduced from 30 days for security)
      (2 * 60 * 60 * 1000); // 2 hours for non-trusted devices (reduced from 7 days for security)
    
    if (tokenInfo.isExpired && timeExpired > maxExpiredTime) {
      // Try to restore from persistent session before clearing tokens
      if (persistentSession && isTrustedDevice) {
        return await this.restoreFromPersistentSession(persistentSession);
      } else {
        await this.clearAllTokens();
        return null;
      }
    }

    // If token is expired or needs refresh, attempt refresh
    return await this.refreshTokenIfNeeded();
  }

  /**
   * Restore authentication from persistent session
   */
  private async restoreFromPersistentSession(session: any): Promise<string | null> {
    try {
      // Use the stored refresh token from persistent session
      const storedTokens = await this.getStoredTokens();
      if (!storedTokens) {
        return null;
      }

      // Try to refresh using the persistent session's refresh token
      const refreshToken = session.refreshToken || storedTokens.refreshToken;
      if (!refreshToken) {
        return null;
      }

      // Perform refresh with persistent session token
      return await this.performTokenRefreshWithToken(refreshToken);
    } catch (_error) {
      return null;
    }
  }

  /**
   * Refresh token using specific refresh token
   */
  private async performTokenRefreshWithToken(refreshToken: string): Promise<string | null> {
    try {
      const axios = await import('axios').then(m => m.default);
      
      // Import API config to use correct base URL
      const { CURRENT_API_CONFIG } = await import('../config/api');
      
      const response = await axios.post(
        `${CURRENT_API_CONFIG.baseURL}/auth/refresh`,
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: CURRENT_API_CONFIG.timeout,
        }
      );

      if (response.data?.accessToken) {
        // Store new tokens
        await this.storeTokens({
          accessToken: response.data.accessToken,
          idToken: response.data.idToken,
          refreshToken: refreshToken, // Keep existing refresh token
        });

        return response.data.accessToken;
      } else {
        return null;
      }
    } catch (error: any) {
      // If the refresh token used for restore is also invalid, clear persistent session
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        await deviceManager.clearPersistentSession();
      }
      
      return null;
    }
  }

  /**
   * Refresh token if needed (with deduplication and retry limits)
   */
  async refreshTokenIfNeeded(): Promise<string | null> {
    // Check if we've tried too many times recently - be more lenient
    const now = Date.now();
    if (now - this.lastRefreshAttempt < 60000) { // 1 minute
      if (this.refreshAttempts >= 10) { // Increased from 5 to 10 attempts
        console.log('[TokenManager] Too many refresh attempts, waiting before retry');
        return null;
      }
    } else {
      // Reset attempts if it's been more than 1 minute
      this.refreshAttempts = 0;
    }

    // If refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.refreshAttempts++;
    this.lastRefreshAttempt = now;
    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      if (result) {
        // Reset attempts on successful refresh
        this.refreshAttempts = 0;
      }
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Actually perform the token refresh
   */
  private async performTokenRefresh(): Promise<string | null> {
    try {
      const storedTokens = await this.getStoredTokens();
      if (!storedTokens) {
        return null; // Don't throw error, just return null
      }

      // CRITICAL: Check for banking callback FIRST, before any token refresh attempts
      const isBankingCallbackActive = await this.checkForActiveBankingCallback();
      
      if (isBankingCallbackActive) {
        // Return null to signal that the request should proceed without authentication
        // The API interceptor will handle this scenario for banking callback endpoints
        return null;
      }

      // Add timeout protection to token refresh
      const refreshTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Token refresh timeout after 35 seconds')), 35000);
      });

      // Use direct axios call to avoid circular dependency with the main API client
      const axios = await import('axios').then(m => m.default);
      
      // Retry logic for network errors
      const maxRetries = 3;
      let lastError: any;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          
          // Import API config to use correct base URL
          const { CURRENT_API_CONFIG } = await import('../config/api');
          
          const refreshPromise = axios.post(
            `${CURRENT_API_CONFIG.baseURL}/auth/refresh`,
            { refreshToken: storedTokens.refreshToken },
            {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: attempt === 1 ? 15000 : 30000, // Shorter timeout on first attempt
              validateStatus: (status) => status < 500 || status === 503, // Don't retry on 4xx except 503
            }
          );
          
          const response = await Promise.race([refreshPromise, refreshTimeout]);
          
          if (response.data?.accessToken) {
            // Store new tokens and return early on success
            await this.storeTokens({
              accessToken: response.data.accessToken,
              idToken: response.data.idToken,
              refreshToken: storedTokens.refreshToken
            });

            return response.data.accessToken;
          } else {
            throw new Error('No access token in refresh response');
          }
        } catch (error: any) {
          const _lastError = error;
          
          // Immediately handle 401/403 errors as expired refresh tokens
          if (error.response?.status === 401 || error.response?.status === 403) {
            // Check if there's a persistent session we can use
            const persistentSession = await deviceManager.getPersistentSession();
            if (persistentSession && persistentSession.refreshToken !== storedTokens.refreshToken) {
              try {
                // Try refresh with persistent token
                const freshToken = await this.performTokenRefreshWithToken(persistentSession.refreshToken);
                if (freshToken) {
                  // Save the persistent refresh token for future use
                  await SecureStore.setItemAsync('refreshToken', persistentSession.refreshToken, { keychainService: 'expenzez-tokens' });
                  return freshToken;
                }
              } catch (restoreError) {
                // If persistent session also fails with 401, clear it
                if (restoreError?.response?.status === 401 || restoreError?.response?.status === 403) {
                  await deviceManager.clearPersistentSession();
                }
              }
            } else if (persistentSession && persistentSession.refreshToken === storedTokens.refreshToken) {
              // Same refresh token in persistent session is also expired, clear it
              await deviceManager.clearPersistentSession();
            }
            
            // CRITICAL: Check if this is happening during a banking callback - MUST prevent logout
            const isBankingCallbackActive = await this.checkForActiveBankingCallback();
            
            if (isBankingCallbackActive) {
              return null; // Allow banking callback to complete without logout
            }
            
            // For other 401/403 errors when not in banking callback, just return null
            // Don't automatically log out - let the app handle it
            return null;
          }
          
          const isNetworkError = error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK' || 
                                 error.message?.includes('Network Error') || error.code === 'ECONNREFUSED';
          const isTimeout = error.message?.includes('timeout') || error.code === 'ECONNABORTED';
          const isRetryable = isNetworkError || isTimeout || (error.response?.status >= 500);
          
          // Don't retry for 4xx errors (except 503) as they indicate auth issues
          if (!isRetryable || attempt === maxRetries) {
            break;
          }
          
          // Exponential backoff: wait longer between retries
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }
      
      // If we get here, all attempts failed - check persistent session before logging out
      // Check if there's a persistent session we can use
      const persistentSession = await deviceManager.getPersistentSession();
      
      if (persistentSession && persistentSession.refreshToken) {
        // Try to use the persistent refresh token
        try {
          // Save the persistent refresh token
          await AsyncStorage.setItem('refreshToken', persistentSession.refreshToken);
          
          // Try refresh again with persistent token (only one attempt)
          const freshToken = await this.performTokenRefreshWithToken(persistentSession.refreshToken);
          if (freshToken) {
            return freshToken;
          }
        } catch (restoreError: any) {
          // If it's a network error or 401 during banking callback, don't log out immediately
          if (restoreError.code === 'ERR_NETWORK' || restoreError.message?.includes('Network Error')) {
            return null;
          }
        }
      }
      
      return null;
    } catch (error: any) {
      // Any other error during token refresh - check persistent session first
      // Check if there's a persistent session we can use
      const persistentSession = await deviceManager.getPersistentSession();
      if (persistentSession && persistentSession.refreshToken) {
        try {
          // Save the persistent refresh token
          await AsyncStorage.setItem('refreshToken', persistentSession.refreshToken);
          
          // Try refresh with persistent token
          const freshToken = await this.performTokenRefreshWithToken(persistentSession.refreshToken);
          if (freshToken) {
            return freshToken;
          }
        } catch (restoreError: any) {
          // If it's a network error or 401 during banking callback, don't log out immediately
          if (restoreError.code === 'ERR_NETWORK' || restoreError.message?.includes('Network Error')) {
            return null;
          }
        }
      }
      
      return null;
    }
  }

  /**
   * Check if tokens need refresh and refresh them - now more proactive
   */
  async checkAndRefreshTokenIfNeeded(): Promise<void> {
    try {
      const storedTokens = await this.getStoredTokens();
      if (!storedTokens) {
        return;
      }

      const tokenInfo = await this.getTokenInfo(storedTokens.accessToken);

      // Proactive refresh: if token has less than 75% of its lifetime remaining
      const now = Date.now();
      const tokenLifetime = tokenInfo.expiresAt - (tokenInfo.expiresAt - 3600000); // Assume 1 hour token lifetime
      const timeElapsed = now - (tokenInfo.expiresAt - tokenLifetime);
      const lifetimePercentage = timeElapsed / tokenLifetime;

      const shouldProactivelyRefresh = lifetimePercentage > 0.75; // Refresh when 75% of lifetime has passed

      if (tokenInfo.shouldRefresh || tokenInfo.isExpired || shouldProactivelyRefresh) {
        console.log(`[TokenManager] Proactive token refresh triggered - lifetime: ${Math.round(lifetimePercentage * 100)}%`);
        await this.refreshTokenIfNeeded();
      }
    } catch (_error) {
      // Silently handle errors during token refresh check
    }
  }

  /**
   * Clear all stored tokens - SECURITY: Complete token cleanup
   */
  async clearAllTokens(): Promise<void> {
    try {
      console.log('🚨 [TokenManager] SECURITY: Clearing all tokens and user data');

      // Clear all token-related storage
      await AsyncStorage.multiRemove([
        'accessToken',
        'idToken',
        'refreshToken',
        'tokenExpiresAt',
        'isLoggedIn',
        'user',
        'accounts',
        'transactions',
        'profile',
        'userBudget'
      ]);

      // Clear SecureStore tokens from BOTH keychains
      try {
        // Clear from default keychain
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('idToken');
        await SecureStore.deleteItemAsync('refreshToken');

        // 🚨 CRITICAL: Also clear from 'expenzez-tokens' keychain service
        await SecureStore.deleteItemAsync('accessToken', { keychainService: 'expenzez-tokens' });
        await SecureStore.deleteItemAsync('idToken', { keychainService: 'expenzez-tokens' });
        await SecureStore.deleteItemAsync('refreshToken', { keychainService: 'expenzez-tokens' });

        console.log('🚨 [TokenManager] SECURITY: Cleared tokens from both keychains');
      } catch (secureError) {
        console.warn('⚠️ [TokenManager] SecureStore clear warning:', secureError);
      }

      // Clear refresh promise
      this.refreshPromise = null;

      console.log('✅ [TokenManager] All tokens and user data cleared');
    } catch (error) {
      console.error('❌ [TokenManager] Error clearing tokens:', error);
    }
  }

  /**
   * Check if user is logged in (has valid tokens or can refresh)
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const storedTokens = await this.getStoredTokens();
      if (!storedTokens) {
        return false;
      }

      const tokenInfo = await this.getTokenInfo(storedTokens.accessToken);
      
      // Consider user logged in if token is not expired OR can be refreshed
      if (!tokenInfo.isExpired) {
        return true;
      }
      
      // If token is expired, check if it's been expired for too long
      const now = Date.now();
      const timeExpired = now - tokenInfo.expiresAt;
      const isWithinGracePeriod = timeExpired <= 7 * 24 * 60 * 60 * 1000; // Allow up to 7 days of expiry (increased from 2 hours)
      return isWithinGracePeriod;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Check if there's an active banking callback in progress
   */
  private async checkForActiveBankingCallback(): Promise<boolean> {
    try {
      // Get all AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter for requisition keys
      const requisitionKeys = allKeys.filter(key => key.startsWith('requisition_expenzez_'));
      
      if (requisitionKeys.length === 0) {
        return false;
      }
      
      // Check if any are recent - extended time window for banking callbacks
      const currentTime = Date.now();
      
      for (const key of requisitionKeys) {
        const match = key.match(/requisition_expenzez_(\d+)/);
        if (match) {
          const timestamp = parseInt(match[1]);
          const age = currentTime - timestamp;
          const isRecent = age < 15 * 60 * 1000; // Extended to 15 minutes for banking callbacks
          if (isRecent) {
            return true;
          }
        }
      }
      
      return false;
    } catch (_error) {
      return false; // Fail safe - assume no banking callback
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }

  /**
   * Public method to refresh access token (for session manager)
   */
  async refreshAccessToken(): Promise<string | null> {
    return await this.refreshTokenIfNeeded();
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();

// Export class for testing
export { TokenManager };