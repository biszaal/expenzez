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
  AUTH_CALLBACK: `${APP_SCHEME}://auth/callback`,
};

// API Configuration - ALWAYS use current production AWS API Gateway
const API_CONFIG = {
  BASE_URL: 'https://jvgwbst4og.execute-api.eu-west-2.amazonaws.com', // Current production AWS API Gateway
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