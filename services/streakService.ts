import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

// Extend dayjs with weekOfYear plugin
dayjs.extend(weekOfYear);

interface StreakData {
  lastActivityDate: string;
  currentStreak: number;
  longestStreak: number;
  weeklyStreakAwarded: boolean; // Prevent multiple awards per week
}

export class StreakService {
  private static readonly STREAK_STORAGE_KEY = '@user_streak_data';

  /**
   * Initialize streak data
   */
  static async initializeStreak(): Promise<StreakData> {
    const defaultData: StreakData = {
      lastActivityDate: '',
      currentStreak: 0,
      longestStreak: 0,
      weeklyStreakAwarded: false
    };

    try {
      const stored = await AsyncStorage.getItem(this.STREAK_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as StreakData;
      }
    } catch (error) {
      console.error('[StreakService] Error loading streak data:', error);
    }

    await this.saveStreak(defaultData);
    return defaultData;
  }

  /**
   * Record daily activity and update streak
   */
  static async recordDailyActivity(): Promise<{ newStreak: number; shouldAwardWeekly: boolean }> {
    const streakData = await this.initializeStreak();
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    // Don't count multiple activities on the same day
    if (streakData.lastActivityDate === today) {
      return { newStreak: streakData.currentStreak, shouldAwardWeekly: false };
    }

    // Check if streak continues (today or was yesterday)
    if (streakData.lastActivityDate === yesterday || streakData.lastActivityDate === '') {
      // Continue or start streak
      streakData.currentStreak += 1;
    } else {
      // Reset streak if gap > 1 day
      streakData.currentStreak = 1;
      streakData.weeklyStreakAwarded = false; // Reset weekly award
    }

    // Update longest streak
    if (streakData.currentStreak > streakData.longestStreak) {
      streakData.longestStreak = streakData.currentStreak;
    }

    streakData.lastActivityDate = today;

    // Check if should award weekly streak (7+ days, not awarded this week)
    const shouldAwardWeekly = streakData.currentStreak >= 7 && !streakData.weeklyStreakAwarded;

    if (shouldAwardWeekly) {
      streakData.weeklyStreakAwarded = true;
    }

    // Reset weekly award flag each new week
    const lastWeek = dayjs(streakData.lastActivityDate).week();
    const currentWeek = dayjs().week();
    if (currentWeek !== lastWeek) {
      streakData.weeklyStreakAwarded = false;
    }

    await this.saveStreak(streakData);

    console.log(`[StreakService] Current streak: ${streakData.currentStreak} days`);

    return { newStreak: streakData.currentStreak, shouldAwardWeekly };
  }

  /**
   * Get current streak data
   */
  static async getStreak(): Promise<StreakData> {
    return await this.initializeStreak();
  }

  /**
   * Save streak data
   */
  private static async saveStreak(data: StreakData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STREAK_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[StreakService] Error saving streak data:', error);
    }
  }
}