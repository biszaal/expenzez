import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Achievement, achievementAPI } from '../../services/api/achievementAPI';
import { AchievementBadge } from './AchievementBadge';
import { SHADOWS, SPACING, BORDER_RADIUS } from '../../constants/Colors';

interface AchievementToastProps {
  achievement: Achievement | null;
  visible: boolean;
  onDismiss: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  visible,
  onDismiss
}) => {
  const { colors } = useTheme();

  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && achievement) {
      // Slide in from top
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    } else {
      // Slide out to top
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible, achievement]);

  if (!achievement) {
    return null;
  }

  const difficultyColor = achievementAPI.getDifficultyColor(achievement.difficulty);
  const styles = createStyles(colors, difficultyColor);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim
        }
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={onDismiss}
        activeOpacity={0.9}
      >
        {/* Achievement Badge */}
        <View style={styles.badgeContainer}>
          <AchievementBadge
            achievement={achievement}
            size="small"
            showPoints
          />
        </View>

        {/* Achievement Info */}
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>🎉 Achievement Unlocked!</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Ionicons name="close" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {achievement.title}
          </Text>

          <Text style={styles.description} numberOfLines={2}>
            {achievement.description}
          </Text>

          <View style={styles.footer}>
            <View style={styles.pointsContainer}>
              <Ionicons name="star" size={14} color={colors.accent.main} />
              <Text style={styles.pointsText}>
                +{achievement.pointsReward} XP
              </Text>
            </View>

            <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
              <Text style={styles.difficultyText}>
                {achievement.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Sparkle Effect */}
        <View style={styles.sparkleContainer}>
          <Ionicons name="sparkles" size={16} color={colors.accent.main} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (colors: any, difficultyColor: string) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 1000
  },
  toastContent: {
    backgroundColor: colors.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: difficultyColor,
    ...SHADOWS.lg
  },
  badgeContainer: {
    marginRight: SPACING.md
  },
  textContainer: {
    flex: 1
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.main
  },
  closeButton: {
    padding: SPACING.xs
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2
  },
  description: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
    marginBottom: SPACING.sm
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.main,
    marginLeft: 2
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm
  },
  difficultyText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  sparkleContainer: {
    marginLeft: SPACING.sm
  }
});