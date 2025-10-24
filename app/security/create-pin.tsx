import React from 'react';
import { useRouter } from 'expo-router';
import PinSetupScreen from '../auth/PinSetup';
import { useSecurity } from '../../contexts/SecurityContext';
import { enhancedSecurityAPI } from '../../services/api/enhancedSecurityAPI';

export default function CreatePinScreen() {
  const router = useRouter();
  const { syncSecurityPreferences, checkSecurityStatus } = useSecurity();

  const handlePinCreated = async () => {
    console.log('🔐 [CreatePin] PIN created successfully for this device');

    try {
      // Set unlock session to prevent immediate lock
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('@expenzez_last_unlock', Date.now().toString());
      await AsyncStorage.setItem('@expenzez_app_locked', 'false');
      console.log('🔐 [CreatePin] Set unlock session after PIN creation');

      // CRITICAL FIX: Enable app lock preference when PIN is created with RETRY
      console.log('🔐 [CreatePin] Enabling app lock preference after PIN creation');

      let enableResult;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          enableResult = await enhancedSecurityAPI.enableAppLock();

          if (enableResult.success) {
            console.log('🔐 [CreatePin] ✅ App lock preference enabled successfully');
            break;
          } else {
            console.log(`🔐 [CreatePin] ⚠️ Enable app lock returned success=false, retrying (${retryCount + 1}/${maxRetries})`);
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
            }
          }
        } catch (enableError) {
          console.error(`🔐 [CreatePin] Enable app lock failed (${retryCount + 1}/${maxRetries}):`, enableError);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
          }
        }
      }

      if (retryCount >= maxRetries) {
        console.error('🔐 [CreatePin] ❌ Failed to enable app lock after 3 retries');
      }

      // Notify the enhanced security API that PIN setup is complete
      await enhancedSecurityAPI.onPinSetupComplete();
      console.log('🔐 [CreatePin] Notified enhanced security API of PIN completion');

      console.log('🔐 [CreatePin] Navigating back to security settings');

      // Navigate back immediately - don't wait for security context updates
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }

      // Do immediate updates after navigation to refresh UI state
      // Use setImmediate equivalent for React Native to ensure it runs after navigation
      setTimeout(async () => {
        try {
          console.log('🔐 [CreatePin] Running immediate security preference sync');
          await syncSecurityPreferences();
          await checkSecurityStatus();
          console.log('🔐 [CreatePin] Immediate security sync complete');
        } catch (error) {
          console.error('🔐 [CreatePin] Immediate security sync error (non-critical):', error);
        }
      }, 100); // Much shorter delay to update UI faster

    } catch (error) {
      console.error('🔐 [CreatePin] Error in PIN completion:', error);
      // Always navigate back even on error
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    }
  };

  return (
    <PinSetupScreen onComplete={handlePinCreated} />
  );
}