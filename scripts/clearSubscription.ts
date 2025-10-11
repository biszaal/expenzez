/**
 * Temporary script to clear subscription data
 * Run this from your app to reset the trial
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearSubscriptionData = async () => {
  try {
    console.log('🧹 Clearing subscription data...');

    // Remove subscription backup from AsyncStorage
    await AsyncStorage.removeItem('subscription_backup');

    console.log('✅ Subscription data cleared successfully');
    console.log('📱 Please restart the app to complete the reset');

    return true;
  } catch (error) {
    console.error('❌ Failed to clear subscription data:', error);
    return false;
  }
};

// Also export a function to view current subscription backup
export const viewSubscriptionBackup = async () => {
  try {
    const backupData = await AsyncStorage.getItem('subscription_backup');

    if (backupData) {
      const backup = JSON.parse(backupData);
      console.log('📊 Current subscription backup:', {
        tier: backup.tier,
        isActive: backup.isActive,
        trialEndDate: backup.trialEndDate,
        lastUpdated: backup.lastUpdated,
        backendSynced: backup.backendSynced
      });
      return backup;
    } else {
      console.log('ℹ️ No subscription backup found');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to view subscription backup:', error);
    return null;
  }
};
