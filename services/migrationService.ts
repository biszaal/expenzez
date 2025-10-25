/**
 * Migration Service
 * Manages data migrations from AsyncStorage to SecureStore
 * Handles backward compatibility and safe migration strategies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Migration version tracking
const MIGRATION_VERSION_KEY = '@expenzez_migration_version';
const CURRENT_MIGRATION_VERSION = 2; // Increment when adding new migrations

// Old AsyncStorage keys to clean up after migration
const OLD_KEYS_TO_CLEAN = [
  '@expenzez_app_password', // Plain text PIN (CRITICAL - must migrate)
  'user', // User data (CRITICAL - must migrate)
  'trusted_devices', // Device data (optional encryption)
  'device_registrations', // Device registrations (optional encryption)
];

interface MigrationResult {
  success: boolean;
  migrationsRun: string[];
  errors: { [key: string]: string };
  cleanedKeys: string[];
}

export class MigrationService {
  /**
   * Run all pending migrations
   */
  static async runMigrations(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migrationsRun: [],
      errors: {},
      cleanedKeys: [],
    };

    try {
      // Get current migration version
      const currentVersion = await this.getMigrationVersion();
      console.log(`[Migration] Current version: ${currentVersion}, Target: ${CURRENT_MIGRATION_VERSION}`);

      // Run migrations based on version
      if (currentVersion < 1) {
        console.log('[Migration] Running migration v1: PIN encryption');
        try {
          await this.migratePINToSecureStore();
          result.migrationsRun.push('PIN encryption (v1)');
        } catch (error) {
          result.errors['PIN migration'] = String(error);
          result.success = false;
        }
      }

      if (currentVersion < 2) {
        console.log('[Migration] Running migration v2: User data encryption');
        try {
          await this.migrateUserDataToSecureStore();
          result.migrationsRun.push('User data encryption (v2)');
        } catch (error) {
          result.errors['User data migration'] = String(error);
          result.success = false;
        }
      }

      // Clean up old keys after successful migrations
      if (result.success && result.migrationsRun.length > 0) {
        console.log('[Migration] Cleaning up old AsyncStorage keys');
        const cleaned = await this.cleanupOldKeys();
        result.cleanedKeys = cleaned;
      }

      // Update migration version if migrations succeeded
      if (result.success) {
        await this.setMigrationVersion(CURRENT_MIGRATION_VERSION);
        console.log(`[Migration] Successfully updated to version ${CURRENT_MIGRATION_VERSION}`);
      } else {
        console.warn('[Migration] Some migrations failed, version not updated');
      }

      return result;
    } catch (error) {
      console.error('[Migration] Fatal error during migrations:', error);
      result.success = false;
      result.errors['fatal'] = String(error);
      return result;
    }
  }

  /**
   * Migration v1: Migrate PIN from AsyncStorage to SecureStore
   * This is CRITICAL for security
   */
  private static async migratePINToSecureStore(): Promise<void> {
    try {
      console.log('[Migration v1] Starting PIN migration...');

      // Get old PIN from AsyncStorage
      const oldPin = await AsyncStorage.getItem('@expenzez_app_password');

      if (!oldPin) {
        console.log('[Migration v1] No old PIN found, skipping');
        return;
      }

      // Store PIN in SecureStore (expo-secure-store uses device keychain)
      await SecureStore.setItemAsync('app_pin', oldPin);
      console.log('[Migration v1] PIN successfully migrated to SecureStore');

      // Also migrate PIN-related flags
      const hasPin = await AsyncStorage.getItem('@expenzez_has_pin');
      if (hasPin) {
        await SecureStore.setItemAsync('has_pin', hasPin);
      }

      const lastUnlock = await AsyncStorage.getItem('@expenzez_last_unlock');
      if (lastUnlock) {
        await SecureStore.setItemAsync('last_unlock', lastUnlock);
      }

      console.log('[Migration v1] PIN migration complete');
    } catch (error) {
      console.error('[Migration v1] Error migrating PIN:', error);
      throw new Error(`PIN migration failed: ${error}`);
    }
  }

  /**
   * Migration v2: Migrate user data from AsyncStorage to SecureStore
   * This is CRITICAL for user privacy
   */
  private static async migrateUserDataToSecureStore(): Promise<void> {
    try {
      console.log('[Migration v2] Starting user data migration...');

      // Get old user data from AsyncStorage
      const oldUserData = await AsyncStorage.getItem('user');

      if (!oldUserData) {
        console.log('[Migration v2] No old user data found, skipping');
        return;
      }

      // Validate user data is valid JSON
      try {
        const userData = JSON.parse(oldUserData);
        console.log('[Migration v2] User data is valid JSON');
      } catch (parseError) {
        console.warn('[Migration v2] Old user data is invalid JSON, skipping migration');
        return;
      }

      // Store user data in SecureStore
      await SecureStore.setItemAsync('user_data', oldUserData);
      console.log('[Migration v2] User data successfully migrated to SecureStore');

      // Migrate related profile data if it exists
      const profileData = await AsyncStorage.getItem('profile');
      if (profileData) {
        await SecureStore.setItemAsync('user_profile', profileData);
      }

      console.log('[Migration v2] User data migration complete');
    } catch (error) {
      console.error('[Migration v2] Error migrating user data:', error);
      throw new Error(`User data migration failed: ${error}`);
    }
  }

  /**
   * Clean up old AsyncStorage keys after successful migration
   */
  private static async cleanupOldKeys(): Promise<string[]> {
    const cleaned: string[] = [];

    for (const key of OLD_KEYS_TO_CLEAN) {
      try {
        const exists = await AsyncStorage.getItem(key);
        if (exists !== null) {
          await AsyncStorage.removeItem(key);
          cleaned.push(key);
          console.log(`[Migration] Cleaned up key: ${key}`);
        }
      } catch (error) {
        console.warn(`[Migration] Failed to clean up key ${key}:`, error);
      }
    }

    // Also clean up PIN-related keys
    const pinRelatedKeys = [
      '@expenzez_has_pin',
      '@expenzez_last_unlock',
      '@expenzez_app_locked',
      '@expenzez_pin_removed',
    ];

    for (const key of pinRelatedKeys) {
      try {
        const exists = await AsyncStorage.getItem(key);
        if (exists !== null) {
          await AsyncStorage.removeItem(key);
          cleaned.push(key);
        }
      } catch (error) {
        console.warn(`[Migration] Failed to clean up key ${key}:`, error);
      }
    }

    return cleaned;
  }

  /**
   * Get current migration version
   */
  private static async getMigrationVersion(): Promise<number> {
    try {
      const version = await AsyncStorage.getItem(MIGRATION_VERSION_KEY);
      return version ? parseInt(version, 10) : 0;
    } catch (error) {
      console.error('[Migration] Error reading version:', error);
      return 0;
    }
  }

  /**
   * Set migration version
   */
  private static async setMigrationVersion(version: number): Promise<void> {
    try {
      await AsyncStorage.setItem(MIGRATION_VERSION_KEY, version.toString());
    } catch (error) {
      console.error('[Migration] Error setting version:', error);
      throw error;
    }
  }

  /**
   * Reset migration version (for testing only)
   */
  static async resetMigrationVersion(): Promise<void> {
    try {
      await AsyncStorage.removeItem(MIGRATION_VERSION_KEY);
      console.log('[Migration] Version reset for testing');
    } catch (error) {
      console.error('[Migration] Error resetting version:', error);
    }
  }

  /**
   * Get migration status
   */
  static async getMigrationStatus(): Promise<{
    currentVersion: number;
    targetVersion: number;
    needsMigration: boolean;
  }> {
    const currentVersion = await this.getMigrationVersion();
    return {
      currentVersion,
      targetVersion: CURRENT_MIGRATION_VERSION,
      needsMigration: currentVersion < CURRENT_MIGRATION_VERSION,
    };
  }
}

export default MigrationService;
