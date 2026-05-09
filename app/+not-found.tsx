import { Link, Stack } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Share-extension deep links arrive as URLs that don't match any expo-router
// route (e.g. expenzez://dataUrl=expenzezShareKey#file). expo-router renders
// this not-found screen briefly before ShareIntentRouter has a chance to push
// to /import-statement, causing a "this screen does not exist" flicker.
//
// Mitigation: when this screen mounts, show a loading spinner for a moment.
// If a share intent is being processed, ShareIntentRouter will navigate us
// away. Otherwise we surface the real not-found UI after a short delay.
export default function NotFoundScreen() {
  const { hasShareIntent } = useShareIntentContext();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (hasShareIntent) {
      // ShareIntentRouter will navigate us away shortly.
      return undefined;
    }
    const timer = setTimeout(() => setShowError(true), 1500);
    return () => clearTimeout(timer);
  }, [hasShareIntent]);

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
