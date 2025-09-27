/**
 * Session Manager - Handles graceful session expiration and renewal
 * Provides user-friendly session management instead of abrupt logouts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { tokenManager } from './tokenManager';
import { deviceManager } from './deviceManager';

export enum SessionState {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  EXPIRING_SOON = 'expiring_soon',
  REFRESH_NEEDED = 'refresh_needed',
  LOGGED_OUT = 'logged_out'
}

interface SessionInfo {
  state: SessionState;
  expiresAt?: number;
  timeUntilExpiry?: number;
  canRefresh: boolean;
  hasRememberMe: boolean;
}

class SessionManager {
  private sessionCheckInterval: ReturnType<typeof setInterval> | null = null;
  private appStateSubscription: any = null;
  private isCheckingSession = false;
  private lastSessionCheck = 0;
  private userNotifiedOfExpiration = false;

  constructor() {
    this.setupAppStateListener();
    this.startSessionMonitoring();
  }

  /**
   * Setup app state listener to handle session on app resume
   */
  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  /**
   * Handle app state changes - check session when app becomes active
   */
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      this.checkSessionOnAppResume();
    }
  };

  /**
   * Start monitoring session state - intelligently adjusted based on device trust
   */
  private startSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(async () => {
      const sessionInfo = await this.getSessionInfo();

      // Only show warnings for devices without rememberMe or trusted sessions
      if (sessionInfo.state === SessionState.EXPIRING_SOON &&
          !this.userNotifiedOfExpiration &&
          !sessionInfo.hasRememberMe) {
        this.showExpirationWarning(sessionInfo);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes for less intrusion
  }

  /**
   * Stop session monitoring
   */
  private stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Check session when app resumes from background
   */
  private async checkSessionOnAppResume() {
    // Throttle session checks to avoid too frequent checks
    const now = Date.now();
    if (now - this.lastSessionCheck < 5000) { // 5 second throttle
      return;
    }
    this.lastSessionCheck = now;

    if (this.isCheckingSession) {
      return;
    }

    this.isCheckingSession = true;
    console.log('📱 [SessionManager] App resumed, checking session state...');

    try {
      const sessionInfo = await this.getSessionInfo();
      console.log('📱 [SessionManager] Session state on resume:', sessionInfo.state);

      switch (sessionInfo.state) {
        case SessionState.EXPIRED:
          await this.handleExpiredSession(sessionInfo);
          break;
        case SessionState.EXPIRING_SOON:
          this.showExpirationWarning(sessionInfo);
          break;
        case SessionState.REFRESH_NEEDED:
          await this.attemptSilentRefresh(sessionInfo);
          break;
        case SessionState.ACTIVE:
          console.log('📱 [SessionManager] Session is active and healthy');
          break;
      }
    } catch (error) {
      console.error('📱 [SessionManager] Error checking session on resume:', error);
    } finally {
      this.isCheckingSession = false;
    }
  }

  /**
   * Get current session information
   */
  async getSessionInfo(): Promise<SessionInfo> {
    try {
      const [isLoggedIn, hasRememberMe, storedTokens] = await Promise.all([
        AsyncStorage.getItem('isLoggedIn'),
        AsyncStorage.getItem('rememberMe'),
        tokenManager.getStoredTokens()
      ]);

      if (isLoggedIn !== 'true' || !storedTokens) {
        return {
          state: SessionState.LOGGED_OUT,
          canRefresh: false,
          hasRememberMe: hasRememberMe === 'true'
        };
      }

      const tokenInfo = await tokenManager.getTokenInfo(storedTokens.accessToken);
      const now = Date.now();
      const timeUntilExpiry = tokenInfo.expiresAt - now;

      // Determine session state based on token expiration
      if (tokenInfo.isExpired) {
        return {
          state: SessionState.EXPIRED,
          expiresAt: tokenInfo.expiresAt,
          timeUntilExpiry: 0,
          canRefresh: !!storedTokens.refreshToken,
          hasRememberMe: hasRememberMe === 'true'
        };
      }

      // Check if expiring soon (within 30 minutes) - Extended from 10 minutes
      if (timeUntilExpiry <= 30 * 60 * 1000) {
        return {
          state: SessionState.EXPIRING_SOON,
          expiresAt: tokenInfo.expiresAt,
          timeUntilExpiry,
          canRefresh: !!storedTokens.refreshToken,
          hasRememberMe: hasRememberMe === 'true'
        };
      }

      // Check if refresh is recommended (within 2 hours) - Extended from 30 minutes
      if (timeUntilExpiry <= 2 * 60 * 60 * 1000) {
        return {
          state: SessionState.REFRESH_NEEDED,
          expiresAt: tokenInfo.expiresAt,
          timeUntilExpiry,
          canRefresh: !!storedTokens.refreshToken,
          hasRememberMe: hasRememberMe === 'true'
        };
      }

      return {
        state: SessionState.ACTIVE,
        expiresAt: tokenInfo.expiresAt,
        timeUntilExpiry,
        canRefresh: !!storedTokens.refreshToken,
        hasRememberMe: hasRememberMe === 'true'
      };

    } catch (error) {
      console.error('📱 [SessionManager] Error getting session info:', error);
      return {
        state: SessionState.LOGGED_OUT,
        canRefresh: false,
        hasRememberMe: false
      };
    }
  }

  /**
   * Handle expired session with user-friendly options and persistent session support
   */
  private async handleExpiredSession(sessionInfo: SessionInfo) {
    if (this.userNotifiedOfExpiration) {
      return; // Already handling expiration
    }

    this.userNotifiedOfExpiration = true;
    console.log('📱 [SessionManager] Handling expired session...');

    // For trusted devices, try to restore from persistent session first
    if (sessionInfo.hasRememberMe) {
      try {
        console.log('📱 [SessionManager] Checking for persistent session for trusted device...');
        const persistentSession = await deviceManager.getPersistentSession();

        if (persistentSession) {
          console.log('📱 [SessionManager] Found valid persistent session, attempting automatic restoration...');

          // Attempt to refresh tokens from persistent session
          const tokenManager = require('./tokenManager').tokenManager;
          const newTokens = await tokenManager.refreshAccessToken(persistentSession.refreshToken);

          if (newTokens) {
            console.log('📱 [SessionManager] ✅ Successfully restored session from persistent data');
            this.userNotifiedOfExpiration = false;
            return;
          }
        }
      } catch (error) {
        console.log('📱 [SessionManager] Persistent session restoration failed:', error);
      }
    }

    // If persistent session restoration fails or not available, try regular refresh
    if (sessionInfo.canRefresh && sessionInfo.hasRememberMe) {
      const refreshSuccess = await this.attemptSilentRefresh(sessionInfo);
      if (refreshSuccess) {
        this.userNotifiedOfExpiration = false;
        return;
      }
    }

    // Show user-friendly expiration dialog
    this.showSessionExpiredDialog(sessionInfo);
  }

  /**
   * Attempt silent token refresh
   */
  private async attemptSilentRefresh(sessionInfo: SessionInfo): Promise<boolean> {
    if (!sessionInfo.canRefresh) {
      return false;
    }

    console.log('📱 [SessionManager] Attempting silent token refresh...');
    
    try {
      const newToken = await tokenManager.refreshAccessToken();
      if (newToken) {
        console.log('📱 [SessionManager] ✅ Silent refresh successful');
        return true;
      }
    } catch (error) {
      console.log('📱 [SessionManager] ❌ Silent refresh failed:', error);
    }

    return false;
  }

  /**
   * Show session expiring warning - intelligently adjusted for trusted devices
   */
  private showExpirationWarning(sessionInfo: SessionInfo) {
    if (this.userNotifiedOfExpiration) {
      return;
    }

    const minutesLeft = Math.ceil((sessionInfo.timeUntilExpiry || 0) / (60 * 1000));

    // For trusted devices with rememberMe, only show warning at 5 minutes
    // For regular devices, show at 15 minutes
    const warningThreshold = sessionInfo.hasRememberMe ? 5 : 15;

    if (minutesLeft > warningThreshold) {
      return;
    }

    Alert.alert(
      '🔄 Stay Logged In?',
      `Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Would you like to continue using the app?`,
      [
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            this.performGracefulLogout();
            this.userNotifiedOfExpiration = false;
          }
        },
        {
          text: 'Stay Logged In',
          style: 'default',
          onPress: async () => {
            const success = await this.attemptSilentRefresh(sessionInfo);
            if (success) {
              Alert.alert('✅ Session Extended', 'You can continue using the app safely.');
            } else {
              Alert.alert('🔄 Session Restored', 'Your session has been automatically restored.');
            }
            this.userNotifiedOfExpiration = false;
          }
        }
      ]
    );

    this.userNotifiedOfExpiration = true;
  }

  /**
   * Show session expired dialog with restoration options
   */
  private showSessionExpiredDialog(sessionInfo: SessionInfo) {
    // Don't show session expired dialogs on auth pages (login, register, etc.)
    // This prevents alerts from showing when login fails or user is already on login page
    try {
      const { router } = require('expo-router');
      const currentRoute = router?.state?.routes?.[router.state.index]?.name || '';
      if (currentRoute.includes('auth') || currentRoute.includes('Login') || currentRoute.includes('Register')) {
        console.log('📱 [SessionManager] Skipping session expired dialog on auth page:', currentRoute);
        return;
      }
    } catch (error) {
      // If we can't get the route, check if we're probably on an auth page by other means
      console.log('📱 [SessionManager] Could not get route, proceeding with caution');
    }

    if (sessionInfo.hasRememberMe && sessionInfo.canRefresh) {
      Alert.alert(
        '🔄 Session Expired',
        'Your session has expired, but we can try to restore it automatically.',
        [
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: async () => {
              await this.performGracefulLogout();
              this.userNotifiedOfExpiration = false;
            }
          },
          {
            text: 'Restore Session',
            onPress: async () => {
              const success = await this.attemptSilentRefresh(sessionInfo);
              if (success) {
                Alert.alert('✅ Welcome Back!', 'Your session has been restored successfully.');
              } else {
                Alert.alert('❌ Unable to Restore', 'Please log in again to continue using the app.');
                await this.performGracefulLogout();
              }
              this.userNotifiedOfExpiration = false;
            }
          }
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert(
        '🔒 Session Expired',
        'Your session has expired for security reasons. Please log in again to continue.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await this.performGracefulLogout();
              this.userNotifiedOfExpiration = false;
            }
          }
        ],
        { cancelable: false }
      );
    }
  }

  /**
   * Perform graceful logout with cleanup
   */
  private async performGracefulLogout() {
    console.log('📱 [SessionManager] Performing graceful logout...');
    
    try {
      // Clear auth data but preserve some user preferences
      await AsyncStorage.multiRemove([
        'isLoggedIn',
        'accessToken',
        'idToken', 
        'refreshToken',
        'tokenExpiresAt',
        'user',
        'userBudget'
      ]);

      // Clear session flags
      this.userNotifiedOfExpiration = false;
      
      // Navigate to login (this will be handled by AuthContext)
      console.log('📱 [SessionManager] Logout completed');
      
    } catch (error) {
      console.error('📱 [SessionManager] Error during graceful logout:', error);
    }
  }

  /**
   * Check if we should prevent automatic logout for this error
   */
  async shouldPreventAutoLogout(): Promise<boolean> {
    const sessionInfo = await this.getSessionInfo();
    
    // Prevent auto logout if user has remember me enabled and refresh is possible
    if (sessionInfo.hasRememberMe && sessionInfo.canRefresh) {
      const refreshSuccess = await this.attemptSilentRefresh(sessionInfo);
      return refreshSuccess;
    }

    return false;
  }

  /**
   * Handle session expiration from API interceptor
   */
  async handleApiSessionExpiration(): Promise<boolean> {
    const sessionInfo = await this.getSessionInfo();
    
    // Try silent refresh if possible
    if (sessionInfo.canRefresh) {
      const refreshSuccess = await this.attemptSilentRefresh(sessionInfo);
      if (refreshSuccess) {
        return true; // Session restored, can continue
      }
    }

    // Handle expired session with user notification
    await this.handleExpiredSession(sessionInfo);
    return false; // Session could not be restored
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopSessionMonitoring();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();