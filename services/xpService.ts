import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { AchievementCalculator } from "./achievementCalculator";
import { profileAPI } from "./api/profileAPI";

export interface XPAction {
  id: string;
  name: string;
  description: string;
  xp: number;
  category: "daily" | "weekly" | "milestone";
  cooldown?: number; // cooldown in minutes
}

export interface UserXPData {
  totalXP: number;
  level: number;
  lastActions: { [actionId: string]: string }; // timestamp of last action
  dailyXP: number;
  weeklyXP: number;
  monthlyXP: number;
  lastResetDate: string;
}

// Flag to track if we've synced from server on this session
let hasInitializedFromServer = false;

export class XPService {
  private static readonly XP_STORAGE_KEY = "@user_xp_data";
  private static readonly XP_PER_LEVEL = 100;

  // XP Actions matching our UI guide
  private static readonly XP_ACTIONS: XPAction[] = [
    // Daily Activities
    {
      id: "add-expense",
      name: "Add Expense",
      description: "Track your daily spending",
      xp: 5,
      category: "daily",
      cooldown: 5, // 5 minutes between rewards
    },
    {
      id: "add-income",
      name: "Add Income",
      description: "Track your income sources",
      xp: 5,
      category: "daily",
      cooldown: 5, // 5 minutes between rewards
    },
    {
      id: "check-progress",
      name: "Check Progress",
      description: "Review your financial stats",
      xp: 3,
      category: "daily",
      cooldown: 60, // 1 hour between rewards
    },

    // Weekly Goals
    {
      id: "week-streak",
      name: "7-Day Streak",
      description: "Track expenses for a full week",
      xp: 25,
      category: "weekly",
    },
    {
      id: "budget-review",
      name: "Budget Review",
      description: "Stay within weekly budget",
      xp: 20,
      category: "weekly",
    },

    // Major Milestones
    {
      id: "transaction-10",
      name: "10 Transactions",
      description: "First milestone reached",
      xp: 20,
      category: "milestone",
    },
    {
      id: "transaction-25",
      name: "25 Transactions",
      description: "Getting into the habit",
      xp: 50,
      category: "milestone",
    },
    {
      id: "transaction-100",
      name: "100 Transactions",
      description: "Century milestone",
      xp: 100,
      category: "milestone",
    },
    {
      id: "transaction-250",
      name: "250 Transactions",
      description: "Expert tracker",
      xp: 200,
      category: "milestone",
    },
    {
      id: "transaction-500",
      name: "500 Transactions",
      description: "Master of tracking",
      xp: 300,
      category: "milestone",
    },
    {
      id: "master-saver",
      name: "Master Saver",
      description: "Save 20% of income for 3 months",
      xp: 300,
      category: "milestone",
    },
  ];

  /**
   * Initialize user XP data - loads from server first, falls back to local storage
   */
  static async initializeUserXP(): Promise<UserXPData> {
    const defaultData: UserXPData = {
      totalXP: 0,
      level: 1,
      lastActions: {},
      dailyXP: 0,
      weeklyXP: 0,
      monthlyXP: 0,
      lastResetDate: dayjs().format("YYYY-MM-DD"),
    };

    try {
      // On first load of session, try to get data from server
      if (!hasInitializedFromServer) {
        try {
          console.log("[XPService] Fetching progress from server...");
          const serverData = await profileAPI.getUserProgress();

          if (serverData && serverData.totalXP !== undefined) {
            console.log("[XPService] Got progress from server:", {
              totalXP: serverData.totalXP,
              level: serverData.level,
            });

            // Save to local storage for offline access
            await this.saveUserXPLocal(serverData);
            hasInitializedFromServer = true;

            // Reset daily/weekly counters if needed
            return this.resetCountersIfNeeded(serverData);
          }
        } catch (serverError) {
          console.warn("[XPService] Failed to fetch from server, using local:", serverError);
        }
      }

      // Fall back to local storage
      const stored = await AsyncStorage.getItem(this.XP_STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored) as UserXPData;
        // Reset daily/weekly counters if needed
        return this.resetCountersIfNeeded(userData);
      }
    } catch (error) {
      console.error("[XPService] Error loading XP data:", error);
    }

    await this.saveUserXPLocal(defaultData);
    return defaultData;
  }

  /**
   * Award XP for a specific action
   */
  static async awardXP(
    actionId: string,
    userId: string
  ): Promise<{
    xpAwarded: number;
    newLevel: number;
    levelUp: boolean;
    message: string;
  }> {
    const action = this.XP_ACTIONS.find((a) => a.id === actionId);
    if (!action) {
      throw new Error(`Unknown XP action: ${actionId}`);
    }

    const userData = await this.initializeUserXP();
    const now = dayjs().toISOString();

    // Check cooldown
    if (action.cooldown && userData.lastActions[actionId]) {
      const lastAction = dayjs(userData.lastActions[actionId]);
      const minutesSince = dayjs().diff(lastAction, "minute");

      if (minutesSince < action.cooldown) {
        return {
          xpAwarded: 0,
          newLevel: userData.level,
          levelUp: false,
          message: `Wait ${action.cooldown - minutesSince} minutes before earning XP for this action again`,
        };
      }
    }

    // Award XP
    const oldLevel = userData.level;
    userData.totalXP += action.xp;
    userData.lastActions[actionId] = now;

    // Update category counters
    switch (action.category) {
      case "daily":
        userData.dailyXP += action.xp;
        break;
      case "weekly":
        userData.weeklyXP += action.xp;
        break;
      case "milestone":
        userData.monthlyXP += action.xp;
        break;
    }

    // Calculate new level
    const newLevel = Math.floor(userData.totalXP / this.XP_PER_LEVEL) + 1;
    const levelUp = newLevel > oldLevel;
    userData.level = newLevel;

    // Save data
    await this.saveUserXP(userData);

    console.log(
      `[XPService] Awarded ${action.xp} XP for ${action.name}. Total: ${userData.totalXP}, Level: ${newLevel}`
    );

    return {
      xpAwarded: action.xp,
      newLevel,
      levelUp,
      message: `+${action.xp} XP for ${action.name}!`,
    };
  }

  /**
   * Get current user XP data
   */
  static async getUserXP(): Promise<UserXPData> {
    return await this.initializeUserXP();
  }

  /**
   * Calculate level progress
   */
  static calculateLevelProgress(totalXP: number): {
    level: number;
    currentLevelXP: number;
    xpToNextLevel: number;
    progressPercent: number;
  } {
    const level = Math.floor(totalXP / this.XP_PER_LEVEL) + 1;
    const currentLevelXP = totalXP % this.XP_PER_LEVEL;
    const xpToNextLevel = this.XP_PER_LEVEL - currentLevelXP;
    const progressPercent = (currentLevelXP / this.XP_PER_LEVEL) * 100;

    return {
      level,
      currentLevelXP,
      xpToNextLevel,
      progressPercent,
    };
  }

  /**
   * Reset daily/weekly counters if needed
   */
  private static resetCountersIfNeeded(userData: UserXPData): UserXPData {
    const today = dayjs().format("YYYY-MM-DD");
    const lastReset = dayjs(userData.lastResetDate);

    // Reset daily counter
    if (!dayjs().isSame(lastReset, "day")) {
      userData.dailyXP = 0;
    }

    // Reset weekly counter
    if (!dayjs().isSame(lastReset, "week")) {
      userData.weeklyXP = 0;
    }

    // Reset monthly counter
    if (!dayjs().isSame(lastReset, "month")) {
      userData.monthlyXP = 0;
    }

    userData.lastResetDate = today;
    return userData;
  }

  /**
   * Save user XP data to local storage only
   */
  private static async saveUserXPLocal(userData: UserXPData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.XP_STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error("[XPService] Error saving XP data locally:", error);
    }
  }

  /**
   * Save user XP data to both local storage and server
   */
  private static async saveUserXP(userData: UserXPData): Promise<void> {
    try {
      // Always save locally first for immediate access
      await this.saveUserXPLocal(userData);

      // Then sync to server (don't await to avoid blocking)
      this.syncToServer(userData).catch((err) => {
        console.warn("[XPService] Background sync to server failed:", err);
      });
    } catch (error) {
      console.error("[XPService] Error saving XP data:", error);
    }
  }

  /**
   * Sync XP data to server
   */
  private static async syncToServer(userData: UserXPData): Promise<void> {
    try {
      console.log("[XPService] Syncing progress to server:", {
        totalXP: userData.totalXP,
        level: userData.level,
      });
      await profileAPI.updateUserProgress(userData);
      console.log("[XPService] Progress synced to server successfully");
    } catch (error) {
      console.error("[XPService] Failed to sync to server:", error);
      throw error;
    }
  }

  /**
   * Force sync current data to server (call when user explicitly wants to sync)
   */
  static async forceSyncToServer(): Promise<void> {
    const userData = await this.initializeUserXP();
    await this.syncToServer(userData);
  }

  /**
   * Reset the session initialization flag (call when user logs out)
   */
  static resetSession(): void {
    hasInitializedFromServer = false;
  }

  /**
   * Clear all local XP data (call when user logs out)
   */
  static async clearLocalData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.XP_STORAGE_KEY);
      hasInitializedFromServer = false;
      console.log("[XPService] Local XP data cleared");
    } catch (error) {
      console.error("[XPService] Error clearing local XP data:", error);
    }
  }

  /**
   * Get available XP actions
   */
  static getXPActions(): XPAction[] {
    return [...this.XP_ACTIONS];
  }

  /**
   * Check if user can earn XP for an action
   */
  static async canEarnXP(actionId: string): Promise<boolean> {
    const action = this.XP_ACTIONS.find((a) => a.id === actionId);
    if (!action || !action.cooldown) return true;

    const userData = await this.initializeUserXP();
    if (!userData.lastActions[actionId]) return true;

    const lastAction = dayjs(userData.lastActions[actionId]);
    const minutesSince = dayjs().diff(lastAction, "minute");

    return minutesSince >= action.cooldown;
  }

  /**
   * Integrate with existing achievement system
   */
  static async syncWithAchievements(userId: string): Promise<void> {
    try {
      // Get achievement data to sync XP
      const achievementData =
        await AchievementCalculator.calculateUserAchievements(userId);
      const userData = await this.initializeUserXP();

      // Only sync if this is the first time (user has no XP yet)
      // This ensures achievement XP is added initially but daily XP is preserved
      const achievementXP = achievementData.progress.totalPoints;
      if (userData.totalXP === 0 && achievementXP > 0) {
        console.log(
          "[XPService] Initial sync with achievements:",
          achievementXP,
          "XP"
        );
        userData.totalXP = achievementXP;
        userData.level = Math.floor(userData.totalXP / this.XP_PER_LEVEL) + 1;
        await this.saveUserXP(userData);
      } else {
        console.log(
          "[XPService] Preserving existing XP progress:",
          userData.totalXP,
          "XP"
        );
      }
    } catch (error) {
      console.error("[XPService] Error syncing with achievements:", error);
    }
  }
}
