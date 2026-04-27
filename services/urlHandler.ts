import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { getEnvironmentName } from '../config/environment';

/**
 * Map an incoming deep-link path segment to an in-app route.
 *
 * Supports:
 *   expenzez://auth/reset-password?code=...&email=...
 *   expenzez://auth/verify-email?code=...&email=...
 *   expenzez://auth/forgot-password
 *   expenzez://auth/login
 *   expenzez://subscription
 *   https://expenzez.com/... (universal links, same path grammar)
 *
 * Returns the in-app path for router.push, or null if the path is unknown.
 */
function routeForPath(
  path: string | null | undefined,
  queryParams: Record<string, string | string[] | undefined> | undefined
): string | null {
  if (!path) return null;

  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  // Flatten query params into an URLSearchParams-style suffix.
  const qs = queryParams
    ? Object.entries(queryParams)
        .filter(([, v]) => v !== undefined)
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(
              Array.isArray(v) ? v[0] : String(v)
            )}`
        )
        .join('&')
    : '';
  const suffix = qs ? `?${qs}` : '';

  // Recognised path prefixes -> expo-router paths.
  // Keep this list explicit so unknown paths can't side-route.
  const routes: Record<string, string> = {
    'auth/reset-password': '/auth/ResetPassword',
    'auth/verify-email': '/auth/VerifyEmail',
    'auth/forgot-password': '/auth/ForgotPassword',
    'auth/login': '/auth/login',
    subscription: '/subscription',
    settings: '/settings',
  };

  const joined = segments.join('/');
  const match = routes[joined];
  if (!match) return null;
  return `${match}${suffix}`;
}

/**
 * Handle incoming URLs for app navigation.
 * Called on initial URL (cold start) and on every subsequent deep link.
 */
export const handleAppURL = (url: string) => {
  console.log('🔗 Handling URL:', url);
  console.log('🏗️ Environment:', getEnvironmentName());

  try {
    const parsedUrl = Linking.parse(url);
    console.log('📋 URL Parameters:', parsedUrl);

    const target = routeForPath(parsedUrl.path, parsedUrl.queryParams);
    if (!target) {
      console.log('🔗 No route mapping for path:', parsedUrl.path);
      return;
    }

    console.log('🚦 Routing to:', target);
    router.push(target as any);
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