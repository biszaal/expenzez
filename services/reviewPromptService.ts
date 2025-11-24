import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';

const STORAGE_KEY = '@expenzez_review_prompt_state';

// Platform-specific store URLs
const APP_STORE_URL = 'https://apps.apple.com/app/id6739113889';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.biszaal.expenzez';

const STORE_URL = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;

interface ReviewPromptState {
  dismissedCount: number;
  lastShownDate: string | null;
  permanentOptOut: boolean;
  installDate: string;
  completedReview: boolean;
}

/**
 * Review Prompt Service
 *
 * Manages app store review prompts with intelligent timing:
 * - Shows after milestones (10, 25, 100 transactions)
 * - 7-day grace period after install
 * - Auto-stops after 2 dismissals
 * - Maximum 3 attempts with 30/90 day delays
 * - Respects user opt-out
 */
class ReviewPromptService {
  private state: ReviewPromptState | null = null;

  /**
   * Initialize service and load state
   */
  async initialize(): Promise<void> {
    await this.loadState();

    // Set install date if first time
    if (!this.state?.installDate) {
      const now = new Date().toISOString();
      await this.saveState({
        dismissedCount: 0,
        lastShownDate: null,
        permanentOptOut: false,
        installDate: now,
        completedReview: false,
      });
    }
  }

  /**
   * Load review prompt state from storage
   */
  private async loadState(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[ReviewPrompt] Error loading state:', error);
    }
  }

  /**
   * Save review prompt state to storage
   */
  private async saveState(state: ReviewPromptState): Promise<void> {
    try {
      this.state = state;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[ReviewPrompt] Error saving state:', error);
    }
  }

  /**
   * Check if review prompt should be shown
   *
   * @param transactionCount - Current user transaction count
   * @returns true if prompt should be shown
   */
  async shouldShowReviewPrompt(transactionCount: number): Promise<boolean> {
    // Ensure state is loaded
    if (!this.state) {
      await this.initialize();
    }

    if (!this.state) {
      return false;
    }

    // Check if user has completed review
    if (this.state.completedReview) {
      console.log('[ReviewPrompt] User already completed review');
      return false;
    }

    // Check if user opted out permanently
    if (this.state.permanentOptOut) {
      console.log('[ReviewPrompt] User opted out permanently');
      return false;
    }

    // Auto-stop after 2 dismissals (smart "Not Now" limit)
    if (this.state.dismissedCount >= 2) {
      console.log('[ReviewPrompt] Auto-stopped after 2 dismissals');
      return false;
    }

    // Check if maximum attempts reached (3 total)
    const totalAttempts = this.state.dismissedCount + (this.state.lastShownDate ? 1 : 0);
    if (totalAttempts >= 3) {
      console.log('[ReviewPrompt] Maximum 3 attempts reached');
      return false;
    }

    // Check 7-day grace period after install
    const installDate = new Date(this.state.installDate);
    const now = new Date();
    const daysSinceInstall = (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceInstall < 7) {
      console.log('[ReviewPrompt] Still in 7-day grace period');
      return false;
    }

    // Check if milestone reached (10, 25, or 100 transactions)
    const milestones = [10, 25, 100];
    const isAtMilestone = milestones.includes(transactionCount);

    if (!isAtMilestone) {
      return false;
    }

    // If never shown before, show now
    if (!this.state.lastShownDate) {
      console.log('[ReviewPrompt] First time showing at milestone', transactionCount);
      return true;
    }

    // Check retry delays based on dismissed count
    const lastShown = new Date(this.state.lastShownDate);
    const daysSinceLastShown = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60 * 24);

    if (this.state.dismissedCount === 0) {
      // Already shown once, this shouldn't happen but handle gracefully
      return false;
    } else if (this.state.dismissedCount === 1) {
      // Second attempt: wait 30 days
      if (daysSinceLastShown < 30) {
        console.log('[ReviewPrompt] Waiting for 30-day delay (2nd attempt)');
        return false;
      }
      console.log('[ReviewPrompt] 30 days passed, showing 2nd attempt at milestone', transactionCount);
      return true;
    } else if (this.state.dismissedCount === 2) {
      // Third attempt: wait 90 days (though auto-stop should prevent this)
      if (daysSinceLastShown < 90) {
        console.log('[ReviewPrompt] Waiting for 90-day delay (3rd attempt)');
        return false;
      }
      console.log('[ReviewPrompt] 90 days passed, showing 3rd attempt at milestone', transactionCount);
      return true;
    }

    return false;
  }

  /**
   * Show the review prompt
   *
   * Displays a native alert with options to rate the app or dismiss.
   * Uses expo-store-review for iOS native review experience.
   */
  async showReviewPrompt(): Promise<void> {
    if (!this.state) {
      await this.initialize();
    }

    if (!this.state) {
      return;
    }

    // Update last shown date
    const updatedState = {
      ...this.state,
      lastShownDate: new Date().toISOString(),
    };
    await this.saveState(updatedState);

    // Show native alert
    const storeText = Platform.OS === 'ios' ? 'App Store' : 'Play Store';
    Alert.alert(
      'Enjoying Expenzez?',
      `If you love using Expenzez, would you mind taking a moment to rate it on the ${storeText}? It helps us improve!`,
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: () => this.handleDismiss(),
        },
        {
          text: 'Rate Expenzez',
          onPress: () => this.handleRateApp(),
        },
      ],
      { cancelable: true, onDismiss: () => this.handleDismiss() }
    );
  }

  /**
   * Handle "Rate App" button press
   * Opens App Store review or native review sheet
   */
  private async handleRateApp(): Promise<void> {
    if (!this.state) return;

    console.log('[ReviewPrompt] User chose to rate app');

    // Mark as completed
    await this.saveState({
      ...this.state,
      completedReview: true,
    });

    try {
      // Check if native review is available
      const isAvailable = await StoreReview.isAvailableAsync();

      if (isAvailable) {
        // Use native in-app review (iOS 10.3+, Android 5.0+)
        console.log('[ReviewPrompt] Opening native review sheet');
        await StoreReview.requestReview();
      } else {
        // Fallback to App Store URL
        console.log('[ReviewPrompt] Opening App Store URL');
        const url = await StoreReview.storeUrl();
        if (url) {
          await Linking.openURL(url);
        } else {
          // Final fallback to platform-specific store URL
          await Linking.openURL(STORE_URL);
        }
      }
    } catch (error) {
      console.error('[ReviewPrompt] Error opening review:', error);

      // Fallback: try to open store directly
      try {
        await Linking.openURL(STORE_URL);
      } catch (fallbackError) {
        console.error('[ReviewPrompt] Fallback store URL also failed:', fallbackError);
      }
    }
  }

  /**
   * Handle "Not Now" button press or dismissal
   * Increments dismissed count (auto-stops after 2)
   */
  private async handleDismiss(): Promise<void> {
    if (!this.state) return;

    const newDismissedCount = this.state.dismissedCount + 1;
    console.log('[ReviewPrompt] User dismissed prompt, count:', newDismissedCount);

    await this.saveState({
      ...this.state,
      dismissedCount: newDismissedCount,
    });

    // Auto-stop after 2 dismissals
    if (newDismissedCount >= 2) {
      console.log('[ReviewPrompt] Auto-stopped after 2 dismissals');
    }
  }

  /**
   * Reset review prompt state (for testing/debugging)
   * WARNING: Only use in development
   */
  async resetState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      this.state = null;
      console.log('[ReviewPrompt] State reset');
    } catch (error) {
      console.error('[ReviewPrompt] Error resetting state:', error);
    }
  }

  /**
   * Get current state (for debugging)
   */
  async getState(): Promise<ReviewPromptState | null> {
    if (!this.state) {
      await this.loadState();
    }
    return this.state;
  }
}

// Export singleton instance
export const reviewPromptService = new ReviewPromptService();
