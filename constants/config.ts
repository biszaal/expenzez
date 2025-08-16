/**
 * App configuration - environment-specific settings
 */

import Constants from 'expo-constants';

// Environment detection
const isDevelopment = __DEV__;
const isProduction = !__DEV__;

// App scheme for deep linking
const APP_SCHEME = Constants.expoConfig?.scheme || 'expenzez';

// Deep link URLs
const DEEP_LINK_URLS = {
  BANK_CALLBACK: `${APP_SCHEME}://banks/callback`,
  AUTH_CALLBACK: `${APP_SCHEME}://auth/callback`,
};

// API Configuration
const API_CONFIG = {
  BASE_URL: isProduction 
    ? 'https://a95uq2n8k7.execute-api.eu-west-2.amazonaws.com' 
    : 'https://a95uq2n8k7.execute-api.eu-west-2.amazonaws.com', // Use production API for dev too
  TIMEOUT: 30000, // 30 seconds
};

export {
  isDevelopment,
  isProduction,
  APP_SCHEME,
  DEEP_LINK_URLS,
  API_CONFIG,
};

export default {
  isDevelopment,
  isProduction,
  APP_SCHEME,
  DEEP_LINK_URLS,
  API_CONFIG,
};