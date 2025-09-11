import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { AppState, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { SecurityProvider, useSecurity } from "../contexts/SecurityContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { NetworkProvider } from "../contexts/NetworkContext";
import BiometricSecurityLock from "../components/BiometricSecurityLock";
import { AppLoadingScreen } from "../components/ui/AppLoadingScreen";

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>Something went wrong</Text>
          <Text style={{ textAlign: 'center' }}>Please restart the app</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function RootLayoutNav() {
  const auth = useAuth();
  const isLoggedIn = auth?.isLoggedIn ?? false;
  const loading = auth?.loading ?? true;
  const { isLocked, isSecurityEnabled, unlockApp } = useSecurity();
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  // Quick session check on app startup
  useEffect(() => {
    const quickSessionCheck = async () => {
      try {
        const storedLogin = await AsyncStorage.getItem('isLoggedIn');
        const accessToken = await AsyncStorage.getItem('accessToken');
        
        // Also check for banking callback URLs which should preserve logged in state
        const initialUrl = await Linking.getInitialURL();
        const isBankingCallback = initialUrl && (
          initialUrl.includes('banks/callback') || 
          initialUrl.includes('banking/callback') ||
          initialUrl.includes('ref=expenzez_')
        );
        
        if ((storedLogin === 'true' && accessToken && accessToken !== 'null') || isBankingCallback) {
          console.log('🔄 [Layout] Found valid session during startup', { 
            storedLogin: storedLogin === 'true', 
            hasToken: !!accessToken,
            isBankingCallback 
          });
          setHasValidSession(true);
        }
      } catch (error) {
        console.log('❌ [Layout] Error checking session:', error);
      }
    };
    
    quickSessionCheck();
  }, []);

  useEffect(() => {
    // Wait for auth state to be loaded
    console.log(`🔄 [Layout] Loading state changed: auth.loading=${loading}, isLoading=${isLoading}`);
    if (!loading) {
      console.log('✅ [Layout] Auth loading complete, setting isLoading to false');
      setIsLoading(false);
    }
  }, [loading]);


  useEffect(() => {
    // Ensure in-app browser closes and returns to app after OAuth redirect
    try {
      WebBrowser.maybeCompleteAuthSession();
    } catch (error) {
      console.log("[WebBrowser] Session completion error:", error);
    }
    
    // Clear any stale navigation state that might cause routing issues
    const clearStaleNavigationState = async () => {
      try {
        // Get the initial URL and check if it's a banking callback
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('[Layout] Detected initial URL on app startup:', initialUrl);
          // If it's a stale banking callback URL, we'll ignore it
          if (initialUrl.includes('banking/callback') || initialUrl.includes('banks/callback')) {
            console.log('[Layout] Ignoring stale banking callback URL');
          }
        }
        
        // Clear all Expo Router persistent states that might cause banking callback navigation
        await AsyncStorage.removeItem('expo-router-last-route');
        await AsyncStorage.removeItem('expo-router-state'); 
        await AsyncStorage.removeItem('expo-router-navigation-state');
        await AsyncStorage.removeItem('bankingCallbackState');
        await AsyncStorage.removeItem('pendingNavigation');
        
        // Clear any cached navigation state that might trigger banking callback
        await AsyncStorage.removeItem('navigationState');
        await AsyncStorage.removeItem('lastRoute');
        await AsyncStorage.removeItem('activeCallback');
        
        // AGGRESSIVE CLEANUP: Remove ALL banking references on normal app startup
        // Only keep them if this is an actual banking callback from a URL
        const keys = await AsyncStorage.getAllKeys();
        const requisitionKeys = keys.filter(key => key.startsWith('requisition_') || key.includes('banking') || key.includes('nordigen'));
        
        // Check if this is actually a banking callback navigation
        const isBankingCallback = initialUrl && (
          initialUrl.includes('banks/callback') || 
          initialUrl.includes('banking/callback') ||
          initialUrl.includes('ref=expenzez_')
        );
        
        console.log(`[Layout] Banking callback detection: isBankingCallback=${isBankingCallback}, initialUrl=${initialUrl}`);
        console.log(`[Layout] Found banking keys:`, requisitionKeys);
        
        if (!isBankingCallback) {
          // Check for recent banking activity and valid session before preserving references
          // Banking references should only be preserved if user is still logged in
          const storedLogin = await AsyncStorage.getItem('isLoggedIn');
          const accessToken = await AsyncStorage.getItem('accessToken');
          const hasValidSession = storedLogin === 'true' && accessToken && accessToken !== 'null';
          
          console.log(`[Layout] Session validity check: hasValidSession=${hasValidSession}, storedLogin=${storedLogin}, hasToken=${!!accessToken}`);
          
          const recentBankingKeys = [];
          const staleBankingKeys = [];
          
          for (const key of requisitionKeys) {
            if (key.startsWith('requisition_expenzez_')) {
              const match = key.match(/requisition_expenzez_(\d+)/);
              if (match) {
                const timestamp = parseInt(match[1]);
                const age = Date.now() - timestamp;
                const isRecent = age < 15 * 60 * 1000; // 15 minutes - matches TokenManager
                
                // Only preserve recent banking keys if user has valid session
                if (isRecent && hasValidSession) {
                  recentBankingKeys.push(key);
                } else {
                  staleBankingKeys.push(key);
                  if (isRecent && !hasValidSession) {
                    console.log(`[Layout] Recent banking key ${key} marked for removal - no valid session`);
                  }
                }
              }
            } else {
              // Other banking keys without timestamps - consider stale after startup
              staleBankingKeys.push(key);
            }
          }
          
          console.log(`[Layout] Banking reference analysis: recent=${recentBankingKeys.length}, stale=${staleBankingKeys.length}`);
          
          if (recentBankingKeys.length > 0) {
            console.log('[Layout] Preserving recent banking references with valid session:', recentBankingKeys);
          }
          
          // Remove all stale references (including recent ones without valid session)
          if (staleBankingKeys.length > 0) {
            console.log('[Layout] Removing banking references without valid session:', staleBankingKeys);
            await AsyncStorage.multiRemove(staleBankingKeys);
            console.log('[Layout] Cleared banking references:', staleBankingKeys);
          }
        } else {
          console.log('[Layout] Banking callback detected - keeping all references');
        }
        
        console.log('[Layout] Cleared stale navigation state');
      } catch (error) {
        console.error('[Layout] Error clearing stale navigation state:', error);
      }
    };
    clearStaleNavigationState();
  }, []);

  // Periodic cache maintenance when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Clear corrupted cache when app becomes active (every time user opens app)
        setTimeout(() => {
          if (auth?.clearCorruptedCache) {
            console.log('🔄 [Layout] App became active, clearing corrupted cache');
            auth.clearCorruptedCache();
          }
        }, 1000); // Small delay to avoid interfering with app startup
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [auth]);

  if (isLoading || loading) {
    console.log(`🔄 [Layout] Showing loading screen: isLoading=${isLoading}, loading=${loading}`);
    return <AppLoadingScreen message="Setting up your account..." />;
  }

  // Show security lock if app is locked
  if (isLoggedIn && isLocked) {
    return <BiometricSecurityLock isVisible={true} onUnlock={unlockApp} />;
  }

  // Determine if user should be treated as logged in
  const shouldTreatAsLoggedIn = isLoggedIn || hasValidSession;
  
  return (
    <Stack 
      screenOptions={{ headerShown: false }}
      initialRouteName={shouldTreatAsLoggedIn ? "(tabs)" : "auth/Login"}
    >
      <Stack.Screen name="auth/Login" />
      <Stack.Screen name="auth/Register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile/index" />
      <Stack.Screen name="profile/personal" />
      <Stack.Screen name="security/index" />
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="payment/index" />
      <Stack.Screen name="help/index" />
      <Stack.Screen name="terms/index" />
      <Stack.Screen name="banks/index" />
      <Stack.Screen name="banks/callback" />
      <Stack.Screen name="banks/select" />
      <Stack.Screen name="banking/callback" />
      <Stack.Screen name="credit-score/index" />
      <Stack.Screen name="target/index" />
      <Stack.Screen name="transactions/index" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="CompleteProfile" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NetworkProvider>
          <AuthProvider>
            <SecurityProvider>
              <NotificationProvider>
                <RootLayoutNav />
              </NotificationProvider>
            </SecurityProvider>
          </AuthProvider>
        </NetworkProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
