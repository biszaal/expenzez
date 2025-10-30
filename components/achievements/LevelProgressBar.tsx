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
      {/* Enhanced Header */}
      <View style={styles.headerContainer}>
        <View style={styles.levelBadge}>
          <Ionicons name="diamond" size={24} color="#FFD700" />
          <Text style={styles.levelText}>Level {currentLevel}</Text>
          <View style={styles.levelGlow} />
        </View>
        <View style={styles.xpContainer}>
          <Text style={styles.xpValue}>{progressInCurrentLevel}/100</Text>
          <Text style={styles.xpLabel}>XP</Text>
        </View>
      </View>

      {/* Enhanced Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          {/* Background shimmer */}
          <View style={styles.progressShimmer} />

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

          {/* Enhanced Glow Effect */}
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
                  outputRange: [0, 0.8, 1]
                })
              }
            ]}
          />
        </View>

        {/* Progress Markers */}
        <View style={styles.progressMarkers}>
          <View style={[styles.progressMarker, styles.progressMarkerStart]} />
          <View style={[styles.progressMarker, progressPercentage > 25 && styles.progressMarkerActive]} />
          <View style={[styles.progressMarker, progressPercentage > 50 && styles.progressMarkerActive]} />
          <View style={[styles.progressMarker, progressPercentage > 75 && styles.progressMarkerActive]} />
          <View style={[styles.progressMarker, styles.progressMarkerEnd]} />
        </View>
      </View>

      {/* Next Level Preview */}
      <View style={styles.nextLevelContainer}>
        <View style={styles.nextLevelContent}>
          <Ionicons name="arrow-forward" size={16} color={colors.primary.main} />
          <Text style={styles.nextLevelText}>Level {currentLevel + 1}</Text>
          <View style={styles.nextLevelReward}>
            <Ionicons name="gift" size={14} color="#10B981" />
            <Text style={styles.rewardText}>Reward!</Text>
          </View>
        </View>
        <Text style={styles.remainingText}>
          {pointsToNextLevel} XP remaining
        </Text>
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: 24,
    padding: SPACING.xl,
    marginHorizontal: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: colors.border.light
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main[50],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    position: 'relative'
  },
  levelGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    backgroundColor: '#FFD70020',
    zIndex: -1
  },
  levelText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginLeft: SPACING.xs
  },
  xpContainer: {
    alignItems: 'flex-end'
  },
  xpValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary.main
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  progressContainer: {
    marginBottom: SPACING.lg
  },
  progressTrack: {
    height: 12,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  progressShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary.main[100],
    opacity: 0.3
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 8,
    position: 'relative',
    zIndex: 2
  },
  progressGlow: {
    position: 'absolute',
    top: -2,
    left: 0,
    height: 16,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
    opacity: 0.6,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4
  },
  progressMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    paddingHorizontal: 2
  },
  progressMarker: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border.light
  },
  progressMarkerActive: {
    backgroundColor: colors.primary.main,
    width: 8,
    height: 8,
    borderRadius: 4
  },
  progressMarkerStart: {
    backgroundColor: colors.primary.main,
    width: 8,
    height: 8,
    borderRadius: 4
  },
  progressMarkerEnd: {
    backgroundColor: colors.success.main,
    width: 8,
    height: 8,
    borderRadius: 4
  },
  nextLevelContainer: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    alignItems: 'center'
  },
  nextLevelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs
  },
  nextLevelText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary.main,
    marginLeft: SPACING.xs,
    marginRight: SPACING.sm
  },
  nextLevelReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center'
  }
});