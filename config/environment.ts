import Constants from 'expo-constants';

export interface EnvironmentConfig {
  isProduction: boolean;
  isTestFlight: boolean;
  isDevelopment: boolean;
  apiBaseURL: string;
  websiteURL: string;
  environment: 'development' | 'testflight' | 'production';
}

/**
 * Detect if app is running in TestFlight
 * TestFlight builds have specific characteristics we can detect
 */
const detectTestFlight = (): boolean => {
  // Check if we're on iOS and in release channel but not App Store
  const isIOS = Constants.platform?.ios;
  const releaseChannel = (Constants.expoConfig as any)?.releaseChannel || 'default';
  const appOwnership = Constants.appOwnership;
  
  // TestFlight apps typically have:
  // - appOwnership: 'expo' or 'standalone'
  // - No release channel or 'default'
  // - iOS platform
  
  if (isIOS) {
    // If we have a bundle ID but no release channel, likely TestFlight
    const bundleId = Constants.expoConfig?.ios?.bundleIdentifier;
    if (bundleId && (!releaseChannel || releaseChannel === 'default')) {
      return true;
    }
  }
  
  return false;
};

/**
 * Detect current environment
 */
const detectEnvironment = (): 'development' | 'testflight' | 'production' => {
  if (__DEV__) {
    return 'development';
  }
  
  if (detectTestFlight()) {
    return 'testflight';
  }
  
  return 'production';
};

const environment = detectEnvironment();

/**
 * Environment-specific configuration
 */
export const ENV_CONFIG: EnvironmentConfig = {
  isProduction: environment === 'production',
  isTestFlight: environment === 'testflight',
  isDevelopment: environment === 'development',
  environment,
  
  // API Configuration - ALWAYS use production AWS API Gateway
  apiBaseURL: 'https://jvgwbst4og.execute-api.eu-west-2.amazonaws.com', // Production AWS API Gateway

  // Website URLs
  websiteURL: environment === 'development'
    ? 'http://localhost:3000'
    : 'https://expenzez.com'
};


/**
 * Check if current environment is TestFlight
 */
export const isTestFlight = (): boolean => {
  return ENV_CONFIG.isTestFlight;
};

/**
 * Check if current environment is production (App Store)
 */
export const isProduction = (): boolean => {
  return ENV_CONFIG.isProduction;
};

/**
 * Get environment display name for debugging
 */
export const getEnvironmentName = (): string => {
  switch (ENV_CONFIG.environment) {
    case 'development':
      return 'Development';
    case 'testflight':
      return 'TestFlight';
    case 'production':
      return 'Production';
    default:
      return 'Unknown';
  }
};

/**
 * Log current environment info (for debugging)
 */
export const logEnvironmentInfo = (): void => {
  if (__DEV__) {
    console.log('🏗️ Environment Configuration:', {
      environment: ENV_CONFIG.environment,
      isTestFlight: ENV_CONFIG.isTestFlight,
      isProduction: ENV_CONFIG.isProduction,
      apiBaseURL: ENV_CONFIG.apiBaseURL,
      releaseChannel: (Constants.expoConfig as any)?.releaseChannel || 'default',
      appOwnership: Constants.appOwnership,
      bundleId: Constants.expoConfig?.ios?.bundleIdentifier,
    });
  }
};

// Force log environment on every import for debugging API connection issues
console.log('🔧 [DEBUG] Current API Base URL:', ENV_CONFIG.apiBaseURL);
console.log('🔧 [DEBUG] Environment detected as:', ENV_CONFIG.environment);
console.log('🔧 [DEBUG] __DEV__ flag:', __DEV__);