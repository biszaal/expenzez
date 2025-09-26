import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { XPService } from '../services/xpService';
import { useAuth } from '../app/auth/AuthContext';

export interface XPReward {
  xpAwarded: number;
  newLevel: number;
  levelUp: boolean;
  message: string;
}

export const useXP = () => {
  const { user } = useAuth();
  const [isAwarding, setIsAwarding] = useState(false);

  const awardXP = useCallback(async (actionId: string, showAlert: boolean = true): Promise<XPReward | null> => {
    console.log(`[useXP] Attempting to award XP for ${actionId}`);

    // Use user ID if available, otherwise use a fallback for logged-in users
    let userId = user?.id;
    if (!userId && user?.email) {
      // Use email as fallback user ID if no ID is available but user exists
      userId = user.email;
      console.log('[useXP] Using email as fallback user ID:', userId);
    }

    // Final fallback - if user object exists (logged in) but no ID/email, use generic ID
    if (!userId && user) {
      userId = 'current_user';
      console.log('[useXP] Using generic fallback user ID for logged-in user');
    }

    if (!userId) {
      console.warn('[useXP] No user available for XP award - user not logged in');
      return null;
    }

    if (isAwarding) {
      console.log('[useXP] XP award already in progress');
      return null;
    }

    try {
      setIsAwarding(true);
      const result = await XPService.awardXP(actionId, userId);

      if (result.xpAwarded > 0) {
        console.log(`[useXP] Awarded ${result.xpAwarded} XP for ${actionId}`);

        // Trigger progress tab refresh by setting a flag
        try {
          await AsyncStorage.setItem('@xp_update_flag', Date.now().toString());
        } catch (error) {
          console.warn('[useXP] Failed to set update flag:', error);
        }

        if (showAlert) {
          if (result.levelUp) {
            Alert.alert(
              '🎉 Level Up!',
              `Congratulations! You've reached level ${result.newLevel}!\n\n${result.message}`,
              [{ text: 'Awesome!', style: 'default' }]
            );
          } else {
            // Show a subtle notification for regular XP
            Alert.alert(
              '⭐ XP Earned!',
              result.message,
              [{ text: 'Nice!', style: 'default' }]
            );
          }
        }

        return result;
      } else {
        // No XP awarded (probably on cooldown)
        if (showAlert && result.message) {
          console.log(`[useXP] ${result.message}`);
        }
        return result;
      }
    } catch (error) {
      console.error('[useXP] Error awarding XP:', error);
      return null;
    } finally {
      setIsAwarding(false);
    }
  }, [user?.id, isAwarding]);

  const awardXPSilently = useCallback((actionId: string) => {
    return awardXP(actionId, false);
  }, [awardXP]);

  const canEarnXP = useCallback(async (actionId: string): Promise<boolean> => {
    try {
      return await XPService.canEarnXP(actionId);
    } catch (error) {
      console.error('[useXP] Error checking XP eligibility:', error);
      return false;
    }
  }, []);

  return {
    awardXP,
    awardXPSilently,
    canEarnXP,
    isAwarding
  };
};