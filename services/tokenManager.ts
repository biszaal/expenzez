import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

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
    } catch (error) {
      console.error('Failed to parse JWT expiration:', error);
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
    const shouldRefresh = expiresAt <= now + 5 * 60 * 1000; // 5 minutes before expiry

    // Debug logging for token timing
    const timeUntilExpiry = expiresAt - now;
    console.log(`[TokenManager] Token info: expires in ${Math.round(timeUntilExpiry / 1000 / 60)} minutes, isExpired: ${isExpired}, shouldRefresh: ${shouldRefresh}`);

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
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('idToken'),
        AsyncStorage.getItem('refreshToken'),
        AsyncStorage.getItem('tokenExpiresAt')
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
    } catch (error) {
      console.error('Failed to get stored tokens:', error);
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
        AsyncStorage.setItem('accessToken', tokens.accessToken),
        AsyncStorage.setItem('refreshToken', tokens.refreshToken)
      ];

      if (tokens.idToken) {
        storagePromises.push(AsyncStorage.setItem('idToken', tokens.idToken));
      }

      if (expiresAt) {
        storagePromises.push(AsyncStorage.setItem('tokenExpiresAt', expiresAt.toString()));
      }

      await Promise.all(storagePromises);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw error;
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string | null> {
    try {
      console.log('[TokenManager] Getting valid access token...');
      
      // Add timeout protection to the entire token validation process
      const tokenTimeout = new Promise<null>((_, reject) => {
        setTimeout(() => {
          console.log('[TokenManager] Token validation timeout after 35 seconds');
          reject(new Error('Token validation timeout'));
        }, 35000);
      });

      const tokenPromise = this.getValidAccessTokenInternal();
      return await Promise.race([tokenPromise, tokenTimeout]);
    } catch (error: any) {
      console.error('[TokenManager] Failed to get valid access token:', error);
      
      // Don't immediately clear tokens for network/timeout errors
      if (error.message?.includes('timeout') || error.code === 'NETWORK_ERROR') {
        console.log('[TokenManager] Token validation failed due to network/timeout - keeping stored tokens for retry');
      }
      
      return null;
    }
  }

  private async getValidAccessTokenInternal(): Promise<string | null> {
    const storedTokens = await this.getStoredTokens();
    if (!storedTokens) {
      console.log('[TokenManager] No stored tokens found');
      return null;
    }

    const tokenInfo = await this.getTokenInfo(storedTokens.accessToken);
    
    // If token is not expired and doesn't need refresh, return it
    if (!tokenInfo.isExpired && !tokenInfo.shouldRefresh) {
      console.log('[TokenManager] Token is valid, returning existing token');
      return storedTokens.accessToken;
    }

    // If token is expired for more than 2 hours, clear tokens and force re-login
    const now = Date.now();
    const timeExpired = now - tokenInfo.expiresAt;
    const maxExpiredTime = 2 * 60 * 60 * 1000; // 2 hours instead of 30 minutes
    
    if (tokenInfo.isExpired && timeExpired > maxExpiredTime) {
      console.log(`[TokenManager] Token expired ${Math.round(timeExpired / 1000 / 60)} minutes ago (max: ${maxExpiredTime / 1000 / 60} minutes), clearing tokens and forcing re-login`);
      await this.clearAllTokens();
      return null;
    } else if (tokenInfo.isExpired) {
      console.log(`[TokenManager] Token expired ${Math.round(timeExpired / 1000 / 60)} minutes ago, but within grace period - attempting refresh`);
    }

    // If token is expired or needs refresh, attempt refresh
    console.log('[TokenManager] Token expired or needs refresh, attempting refresh...');
    return await this.refreshTokenIfNeeded();
  }

  /**
   * Refresh token if needed (with deduplication and retry limits)
   */
  async refreshTokenIfNeeded(): Promise<string | null> {
    // Check if we've tried too many times recently
    const now = Date.now();
    if (now - this.lastRefreshAttempt < 30000) { // 30 seconds
      if (this.refreshAttempts >= 3) {
        console.log('[TokenManager] Too many refresh attempts, clearing tokens and forcing re-login');
        await this.clearAllTokens();
        return null;
      }
    } else {
      // Reset attempts if it's been more than 30 seconds
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
      console.log('[TokenManager] Starting token refresh...');
      const storedTokens = await this.getStoredTokens();
      if (!storedTokens) {
        console.log('[TokenManager] ⚠️ No stored tokens found during refresh - checking individual tokens:');
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        console.log(`[TokenManager] Debug - accessToken: ${accessToken ? 'exists' : 'missing'}, refreshToken: ${refreshToken ? 'exists' : 'missing'}`);
        return null; // Don't throw error, just return null
      }

      // Add timeout protection to token refresh
      const refreshTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Token refresh timeout after 35 seconds')), 35000);
      });

      console.log('[TokenManager] Making token refresh API call...');
      
      // Use direct axios call to avoid circular dependency with the main API client
      const axios = await import('axios').then(m => m.default);
      
      // Retry logic for network errors
      const maxRetries = 3;
      let lastError: any;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Only log first attempt to reduce spam
          if (attempt === 1) {
            console.log(`[TokenManager] Starting token refresh (will retry up to ${maxRetries} times if needed)`);
          }
          
          const refreshPromise = axios.post(
            'https://yqxlmk05s5.execute-api.eu-west-2.amazonaws.com/api/auth/refresh',
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
            console.log(`✅ [TokenManager] Token refresh succeeded on attempt ${attempt}`);
            // Store new tokens and return early on success
            await this.storeTokens({
              accessToken: response.data.accessToken,
              idToken: response.data.idToken,
              refreshToken: storedTokens.refreshToken
            });

            console.log('✅ Token refreshed successfully');
            return response.data.accessToken;
          } else {
            throw new Error('No access token in refresh response');
          }
        } catch (error: any) {
          lastError = error;
          const isNetworkError = error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK' || 
                                 error.message?.includes('Network Error') || error.code === 'ECONNREFUSED';
          const isTimeout = error.message?.includes('timeout') || error.code === 'ECONNABORTED';
          const isRetryable = isNetworkError || isTimeout || (error.response?.status >= 500);
          
          // Only log detailed errors on the final attempt to reduce log spam
          if (attempt === maxRetries || !isRetryable) {
            console.log(`❌ [TokenManager] Token refresh attempt ${attempt} failed:`, {
              code: error.code,
              status: error.response?.status,
              isRetryable,
              willRetry: false
            });
          }
          
          // Don't retry for 4xx errors (except 503) as they indicate auth issues
          if (!isRetryable || attempt === maxRetries) {
            break;
          }
          
          // Exponential backoff: wait longer between retries
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          if (attempt < maxRetries) {
            console.log(`⏳ [TokenManager] Retrying in ${backoffDelay}ms... (${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }
      
      // If we get here, all attempts failed
      throw lastError;
    } catch (error: any) {
      // Provide more detailed but less alarming error information
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error') || error.code === 'ECONNREFUSED') {
        console.log('🌐 [TokenManager] Token refresh failed due to network connectivity - will keep existing tokens');
      } else if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
        console.log('⏱️ [TokenManager] Token refresh timed out - server may be slow, will keep existing tokens');
      } else if (error.response?.status === 401) {
        console.error('❌ [TokenManager] Refresh token is invalid or expired');
      } else if (error.response?.status >= 500) {
        console.log('🔧 [TokenManager] Server error during token refresh - will keep existing tokens');
      } else {
        console.error('❌ [TokenManager] Token refresh failed:', error);
      }
      
      // Only clear tokens for definitive auth failures, not network issues
      if (error.response?.status === 401 && error.message?.includes('invalid_grant')) {
        console.log('🔄 Clearing tokens due to invalid refresh token');
        await this.clearAllTokens();
      } else {
        console.log('🔄 [TokenManager] Keeping tokens - error may be temporary or network-related');
      }
      
      return null;
    }
  }

  /**
   * Check if tokens need refresh and refresh them
   */
  async checkAndRefreshTokenIfNeeded(): Promise<void> {
    try {
      const storedTokens = await this.getStoredTokens();
      if (!storedTokens) {
        return;
      }

      const tokenInfo = await this.getTokenInfo(storedTokens.accessToken);
      
      if (tokenInfo.shouldRefresh || tokenInfo.isExpired) {
        console.log('🔄 Token needs refresh, refreshing...');
        await this.refreshTokenIfNeeded();
      }
    } catch (error) {
      console.error('Failed to check and refresh token:', error);
    }
  }

  /**
   * Clear all stored tokens
   */
  async clearAllTokens(): Promise<void> {
    try {
      console.log('🧹 [TokenManager] Clearing all tokens - this will log out the user');
      console.trace('[TokenManager] Token clear stack trace:'); // This will show us where tokens are being cleared from
      
      await AsyncStorage.multiRemove([
        'accessToken',
        'idToken',
        'refreshToken',
        'tokenExpiresAt',
        'isLoggedIn',
        'user'
      ]);
      
      console.log('✅ [TokenManager] All tokens cleared successfully');
    } catch (error) {
      console.error('❌ [TokenManager] Failed to clear tokens:', error);
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
      const isWithinGracePeriod = timeExpired <= 2 * 60 * 60 * 1000; // Allow up to 2 hours of expiry
      console.log(`[TokenManager] Token expired ${Math.round(timeExpired / 1000 / 60)} minutes ago, within grace period: ${isWithinGracePeriod}`);
      return isWithinGracePeriod;
    } catch (error) {
      console.error('Failed to check login status:', error);
      return false;
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
}

// Export singleton instance
export const tokenManager = new TokenManager();

// Export class for testing
export { TokenManager };