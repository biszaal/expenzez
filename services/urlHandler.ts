import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { isTestFlight, getEnvironmentName } from '../config/environment';

export interface BankingCallbackParams {
  code?: string;
  error?: string;
  error_description?: string;
  state?: string;
}

/**
 * Handle incoming URLs from TrueLayer redirect
 */
export const handleBankingCallback = (url: string): BankingCallbackParams | null => {
  console.log('🔗 Handling URL:', url);
  console.log('🏗️ Environment:', getEnvironmentName());

  try {
    // Parse the URL
    const parsedUrl = Linking.parse(url);
    const params = parsedUrl.queryParams as any;

    console.log('📋 URL Parameters:', params);

    // Check if this is a banking callback
    if (parsedUrl.path?.includes('banking/callback') || 
        parsedUrl.hostname === 'banking' ||
        url.includes('banking/callback')) {
      
      const callbackParams: BankingCallbackParams = {
        code: params.code,
        error: params.error,
        error_description: params.error_description,
        state: params.state
      };

      console.log('✅ Banking callback detected:', callbackParams);
      
      // Navigate to banking callback handler
      if (callbackParams.code) {
        // Success - redirect to banking success page
        router.push('/banking/callback?code=' + callbackParams.code);
      } else if (callbackParams.error) {
        // Error - redirect to banking error page
        router.push('/banking/callback?error=' + callbackParams.error);
      }

      return callbackParams;
    }

    return null;
  } catch (error) {
    console.error('❌ Failed to handle URL:', error);
    return null;
  }
};

/**
 * Setup URL listeners for TrueLayer redirects
 */
export const setupURLHandling = () => {
  console.log('🔗 Setting up URL handling for environment:', getEnvironmentName());

  // Handle initial URL (when app is opened from a URL)
  Linking.getInitialURL().then(url => {
    if (url) {
      console.log('🚀 Initial URL:', url);
      handleBankingCallback(url);
    }
  });

  // Handle URLs when app is already open
  const subscription = Linking.addEventListener('url', ({ url }) => {
    console.log('🔄 URL change:', url);
    handleBankingCallback(url);
  });

  return () => {
    subscription.remove();
  };
};

/**
 * Generate the correct callback URL for current environment
 */
export const getCallbackURL = (): string => {
  if (isTestFlight()) {
    return 'expenzez://banking/callback';
  }
  
  // Production apps should use universal links
  return 'https://expenzez.com/banking/callback';
};

/**
 * Validate if a URL is a valid banking callback
 */
export const isValidBankingCallback = (url: string): boolean => {
  try {
    const parsedUrl = Linking.parse(url);
    
    // Check for custom scheme (TestFlight/Development)
    if (parsedUrl.scheme === 'expenzez' && parsedUrl.hostname === 'banking') {
      return true;
    }
    
    // Check for universal links (Production)
    if (parsedUrl.hostname === 'expenzez.com' && parsedUrl.path?.includes('banking/callback')) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error validating banking callback URL:', error);
    return false;
  }
};