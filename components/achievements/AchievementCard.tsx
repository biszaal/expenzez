import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Achievement, achievementAPI } from '../../services/api/achievementAPI';
import { SHADOWS, SPACING, BORDER_RADIUS } from '../../constants/Colors';

interface AchievementCardProps {
  achievement: Achievement;
  onPress?: (achievement: Achievement) => void;
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onPress,
  size = 'medium',
  showDescription = true
}) => {
  const { colors } = useTheme();

  const difficultyColor = achievementAPI.getDifficultyColor(achievement.difficulty);
  const typeIcon = achievementAPI.getTypeIcon(achievement.type);

  const cardSize = {
    small: { width: 120, height: 140, iconSize: 24, fontSize: 12 },
    medium: { width: 160, height: 180, iconSize: 32, fontSize: 14 },
    large: { width: 200, height: 220, iconSize: 40, fontSize: 16 }
  }[size];

  const styles = createStyles(colors, difficultyColor, cardSize);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(achievement)}
      activeOpacity={0.8}
    >
      {/* Difficulty Badge */}
      <View style={styles.difficultyBadge}>
        <Text style={styles.difficultyText}>
          {achievement.difficulty.toUpperCase()}
        </Text>
      </View>

      {/* Achievement Icon */}
      <View style={styles.iconContainer}>
        <Ionicons
          name={typeIcon as any}
          size={cardSize.iconSize}
          color={difficultyColor}
        />
      </View>

      {/* Achievement Info */}
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {achievement.title}
        </Text>

        {showDescription && (
          <Text style={styles.description} numberOfLines={3}>
            {achievement.description}
          </Text>
        )}

        {/* Points and Date */}
        <View style={styles.footerContainer}>
          <View style={styles.pointsContainer}>
            <Ionicons name="star" size={14} color={colors.accent.main} />
            <Text style={styles.pointsText}>
              {achievement.pointsReward}
            </Text>
          </View>

          <Text style={styles.dateText}>
            {achievementAPI.formatAchievementDate(achievement.earnedAt)}
          </Text>
        </View>
      </View>

      {/* Shine Effect */}
      <View style={styles.shineEffect} />
    </TouchableOpacity>
  );
};

const createStyles = (colors: any, difficultyColor: string, cardSize: any) => StyleSheet.create({
  container: {
    width: cardSize.width,
    height: cardSize.height,
    backgroundColor: colors.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: difficultyColor,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.md
  },
  difficultyBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: difficultyColor,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    zIndex: 2
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm
  },
  title: {
    fontSize: cardSize.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs
  },
  description: {
    fontSize: cardSize.fontSize - 2,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: cardSize.fontSize + 2,
    flex: 1
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs
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
  dateText: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '500'
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: `${difficultyColor}20`,
    opacity: 0.3
  }
});