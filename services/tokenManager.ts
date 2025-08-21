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
      const storedTokens = await this.getStoredTokens();
      if (!storedTokens) {
        return null;
      }

      const tokenInfo = await this.getTokenInfo(storedTokens.accessToken);
      
      // If token is not expired and doesn't need refresh, return it
      if (!tokenInfo.isExpired && !tokenInfo.shouldRefresh) {
        return storedTokens.accessToken;
      }

      // If token is expired or needs refresh, refresh it
      return await this.refreshTokenIfNeeded();
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      return null;
    }
  }

  /**
   * Refresh token if needed (with deduplication)
   */
  async refreshTokenIfNeeded(): Promise<string | null> {
    // If refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
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
        throw new Error('No stored tokens found');
      }

      // Import authAPI dynamically to avoid circular dependency
      const { authAPI } = await import('./api');
      
      const response = await authAPI.refreshToken(storedTokens.refreshToken);
      
      if (response.accessToken) {
        // Store new tokens
        await this.storeTokens({
          accessToken: response.accessToken,
          idToken: response.idToken,
          refreshToken: storedTokens.refreshToken
        });

        console.log('✅ Token refreshed successfully');
        return response.accessToken;
      } else {
        throw new Error('No access token in refresh response');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // Clear all tokens on refresh failure
      await this.clearAllTokens();
      
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
      await AsyncStorage.multiRemove([
        'accessToken',
        'idToken',
        'refreshToken',
        'tokenExpiresAt',
        'isLoggedIn',
        'user'
      ]);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Check if user is logged in (has valid tokens)
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const storedTokens = await this.getStoredTokens();
      if (!storedTokens) {
        return false;
      }

      const tokenInfo = await this.getTokenInfo(storedTokens.accessToken);
      return !tokenInfo.isExpired;
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