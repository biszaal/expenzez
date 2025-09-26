import AsyncStorage from '@react-native-async-storage/async-storage';

interface MilestoneData {
  totalTransactions: number;
  milestonesAchieved: string[]; // Track which milestones were awarded
}

export class MilestoneService {
  private static readonly MILESTONE_STORAGE_KEY = '@user_milestone_data';

  // Milestone thresholds and their XP rewards
  private static readonly MILESTONES = [
    { id: 'transaction-10', count: 10, xpAction: 'transaction-10', xp: 20 },
    { id: 'transaction-25', count: 25, xpAction: 'transaction-25', xp: 50 },
    { id: 'transaction-100', count: 100, xpAction: 'transaction-100', xp: 100 },
    { id: 'transaction-250', count: 250, xpAction: 'transaction-250', xp: 200 },
    { id: 'transaction-500', count: 500, xpAction: 'transaction-500', xp: 300 }
  ];

  /**
   * Initialize milestone data
   */
  static async initializeMilestones(): Promise<MilestoneData> {
    const defaultData: MilestoneData = {
      totalTransactions: 0,
      milestonesAchieved: []
    };

    try {
      const stored = await AsyncStorage.getItem(this.MILESTONE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as MilestoneData;
      }
    } catch (error) {
      console.error('[MilestoneService] Error loading milestone data:', error);
    }

    await this.saveMilestones(defaultData);
    return defaultData;
  }

  /**
   * Record a new transaction and check for milestones
   */
  static async recordTransaction(): Promise<string[]> {
    const milestoneData = await this.initializeMilestones();
    milestoneData.totalTransactions += 1;

    const newMilestones: string[] = [];

    // Check each milestone
    for (const milestone of this.MILESTONES) {
      if (milestoneData.totalTransactions >= milestone.count &&
          !milestoneData.milestonesAchieved.includes(milestone.id)) {

        newMilestones.push(milestone.xpAction);
        milestoneData.milestonesAchieved.push(milestone.id);

        console.log(`🎯 [MilestoneService] Milestone achieved: ${milestone.count} transactions! Awarding ${milestone.xp} XP`);
      }
    }

    await this.saveMilestones(milestoneData);

    console.log(`[MilestoneService] Total transactions: ${milestoneData.totalTransactions}`);

    return newMilestones;
  }

  /**
   * Get current milestone data
   */
  static async getMilestones(): Promise<MilestoneData> {
    return await this.initializeMilestones();
  }

  /**
   * Save milestone data
   */
  private static async saveMilestones(data: MilestoneData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.MILESTONE_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[MilestoneService] Error saving milestone data:', error);
    }
  }
}