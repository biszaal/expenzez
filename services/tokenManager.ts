import AsyncStorage from '@react-native-async-storage/async-storage';
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
      // Add timeout protection to the entire token validation process
      const tokenTimeout = new Promise<null>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Token validation timeout'));
        }, 35000);
      });

      const tokenPromise = this.getValidAccessTokenInternal();
      return await Promise.race([tokenPromise, tokenTimeout]);
    } catch (error: any) {
      console.error('[TokenManager] Failed to get valid access token:', error);
      
      // Don't immediately clear tokens for network/timeout errors
      
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
    
    // Longer grace periods for trusted devices with persistent sessions
    const maxExpiredTime = isTrustedDevice && persistentSession ? 
      (7 * 24 * 60 * 60 * 1000) : // 7 days for trusted devices
      (2 * 60 * 60 * 1000); // 2 hours for non-trusted devices
    
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
    } catch (error) {
      console.error('[TokenManager] Failed to restore from persistent session:', error);
      return null;
    }
  }

  /**
   * Refresh token using specific refresh token
   */
  private async performTokenRefreshWithToken(refreshToken: string): Promise<string | null> {
    try {
      const axios = await import('axios').then(m => m.default);
      
      const response = await axios.post(
        'https://yqxlmk05s5.execute-api.eu-west-2.amazonaws.com/api/auth/refresh',
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
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
    } catch (error) {
      console.error('[TokenManager] Persistent session refresh failed:', error);
      return null;
    }
  }

  /**
   * Refresh token if needed (with deduplication and retry limits)
   */
  async refreshTokenIfNeeded(): Promise<string | null> {
    // Check if we've tried too many times recently
    const now = Date.now();
    if (now - this.lastRefreshAttempt < 30000) { // 30 seconds
      if (this.refreshAttempts >= 3) {
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
      const storedTokens = await this.getStoredTokens();
      if (!storedTokens) {
        return null; // Don't throw error, just return null
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
          lastError = error;
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
      
      // If we get here, all attempts failed
      throw lastError;
    } catch (error: any) {
      // Only clear tokens for definitive auth failures, not network issues
      if (error.response?.status === 401 && error.message?.includes('invalid_grant')) {
        await this.clearAllTokens();
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
      await AsyncStorage.multiRemove([
        'accessToken',
        'idToken',
        'refreshToken',
        'tokenExpiresAt',
        'isLoggedIn',
        'user'
      ]);
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