import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/Colors';

interface LevelProgressBarProps {
  currentLevel: number;
  totalPoints: number;
  pointsToNextLevel: number;
  animated?: boolean;
}

export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({
  currentLevel,
  totalPoints,
  pointsToNextLevel,
  animated = true
}) => {
  const { colors } = useTheme();
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.9)).current;

  const currentLevelPoints = currentLevel * 100;
  const nextLevelPoints = (currentLevel + 1) * 100;
  const progressInCurrentLevel = totalPoints - (currentLevel - 1) * 100;
  const progressPercentage = (progressInCurrentLevel / 100) * 100;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(progressAnimation, {
          toValue: progressPercentage / 100,
          duration: 1500,
          useNativeDriver: false
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true
        })
      ]).start();
    } else {
      progressAnimation.setValue(progressPercentage / 100);
      scaleAnimation.setValue(1);
    }
  }, [progressPercentage, animated]);

  const styles = createStyles(colors);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnimation }] }]}>
      {/* Level Badge */}
      <View style={styles.levelBadge}>
        <Ionicons name="trophy" size={20} color="#FFD700" />
        <Text style={styles.levelText}>Level {currentLevel}</Text>
      </View>

      {/* Progress Bar Container */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]}
          />

          {/* Progress Glow Effect */}
          <Animated.View
            style={[
              styles.progressGlow,
              {
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                }),
                opacity: progressAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.7, 1]
                })
              }
            ]}
          />
        </View>

        {/* Progress Labels */}
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>
            {progressInCurrentLevel} / 100 XP
          </Text>
          <Text style={styles.remainingText}>
            {pointsToNextLevel} to next level
          </Text>
        </View>
      </View>

      {/* Next Level Preview */}
      <View style={styles.nextLevelContainer}>
        <Ionicons name="arrow-forward" size={16} color={colors.text.secondary} />
        <Text style={styles.nextLevelText}>Level {currentLevel + 1}</Text>
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md
  },
  levelText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: SPACING.xs
  },
  progressContainer: {
    marginBottom: SPACING.sm
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    position: 'relative'
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: BORDER_RADIUS.sm
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: colors.primary.light,
    borderRadius: BORDER_RADIUS.sm,
    opacity: 0.5
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary
  },
  nextLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light
  },
  nextLevelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginLeft: SPACING.xs
  }
});