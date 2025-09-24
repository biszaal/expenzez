import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { getEnvironmentName } from '../config/environment';

/**
 * Handle incoming URLs for app navigation
 */
export const handleAppURL = (url: string) => {
  console.log('🔗 Handling URL:', url);
  console.log('🏗️ Environment:', getEnvironmentName());

  try {
    // Parse the URL
    const parsedUrl = Linking.parse(url);
    console.log('📋 URL Parameters:', parsedUrl);

    // Handle other app URLs as needed
    // TODO: Add any other URL handling logic here

  } catch (error) {
    console.error('❌ Failed to handle URL:', error);
  }
};

/**
 * Setup URL listeners for app navigation
 */
export const setupURLHandling = () => {
  console.log('🔗 Setting up URL handling for environment:', getEnvironmentName());

  // Handle initial URL (when app is opened from a URL)
  Linking.getInitialURL().then(url => {
    if (url) {
      console.log('🚀 Initial URL:', url);
      handleAppURL(url);
    }
  });

  // Handle URLs when app is already open
  const subscription = Linking.addEventListener('url', ({ url }) => {
    console.log('🔄 URL change:', url);
    handleAppURL(url);
  });

  return () => {
    subscription.remove();
  };
};