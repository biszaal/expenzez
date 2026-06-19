import { Link, Stack, useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSecurity } from '@/contexts/SecurityContext';
import { useAuth } from './auth/AuthContext';

// Share-extension deep links arrive as URLs that don't match any expo-router
// route (e.g. expenzez://dataUrl=expenzezShareKey#file). expo-router renders
// this not-found screen briefly before ShareIntentRouter pushes the user into
// /import-statement, causing a "this screen does not exist" flicker.
//
// While a share is processing we show a spinner and let ShareIntentRouter take
// over. But if the shared file is never delivered as a readable PDF (empty
// files / iOS security-scoped URIs / source apps that share oddly), the router
// can't navigate — previously this screen then spun FOREVER with no escape.
// Mitigation: after a bounded grace period, clear the stale intent and drop the
// user on the manual import screen so they can still pick the PDF themselves.
export default function NotFoundScreen() {
  const { hasShareIntent, resetShareIntent } = useShareIntentContext();
  const { isLocked } = useSecurity();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (hasShareIntent) {
      // Behind App Lock the navigator is hidden behind the PIN screen, so the
      // share router legitimately can't navigate yet — wait for unlock rather
      // than firing the recovery prematurely (and losing the auto-parse).
      if (isLocked) return undefined;

      // Safety net: if ShareIntentRouter hasn't navigated us away within the
      // grace window, the shared file couldn't be captured. Don't strand the
      // user — reset the intent and fall back to the import screen when signed
      // in, or home (→ login) when signed out, so we never dump a logged-out
      // user onto the import screen.
      const recover = setTimeout(() => {
        resetShareIntent();
        router.replace(isLoggedIn ? '/import-statement' : '/');
      }, 6000);
      return () => clearTimeout(recover);
    }

    // Genuine not-found (no share in flight): surface the error UI shortly.
    const timer = setTimeout(() => setShowError(true), 1500);
    return () => clearTimeout(timer);
  }, [hasShareIntent, isLocked, isLoggedIn, resetShareIntent, router]);

  if (!showError) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">This screen does not exist.</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
