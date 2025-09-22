import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAchievement } from '../../contexts/AchievementContext';
import { CelebrationAnimation } from './CelebrationAnimation';
import { AchievementToast } from './AchievementToast';
import { LevelUpCelebration } from './LevelUpCelebration';

export const AchievementManager: React.FC = () => {
  const {
    currentCelebration,
    dismissCelebration,
    currentToast,
    dismissToast,
    levelUpData,
    dismissLevelUp,
  } = useAchievement();

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Achievement Toast Notifications */}
      <AchievementToast
        achievement={currentToast}
        visible={!!currentToast}
        onDismiss={dismissToast}
      />

      {/* Full Achievement Celebrations */}
      <CelebrationAnimation
        visible={!!currentCelebration}
        achievement={currentCelebration?.achievement || null}
        celebrationMessage={currentCelebration?.celebrationMessage}
        onClose={dismissCelebration}
      />

      {/* Level Up Celebrations */}
      <LevelUpCelebration
        visible={!!levelUpData}
        level={levelUpData?.level || 1}
        pointsEarned={levelUpData?.pointsEarned || 0}
        onClose={dismissLevelUp}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999
  }
});