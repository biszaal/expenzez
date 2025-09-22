import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Achievement, achievementAPI } from '../../services/api/achievementAPI';
import { SPACING, BORDER_RADIUS } from '../../constants/Colors';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
  showPoints?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'medium',
  showPoints = false
}) => {
  const difficultyColor = achievementAPI.getDifficultyColor(achievement.difficulty);
  const typeIcon = achievementAPI.getTypeIcon(achievement.type);

  const badgeSize = {
    small: { size: 40, iconSize: 20, fontSize: 10 },
    medium: { size: 60, iconSize: 28, fontSize: 12 },
    large: { size: 80, iconSize: 36, fontSize: 14 }
  }[size];

  const styles = createStyles(difficultyColor, badgeSize);

  return (
    <View style={styles.container}>
      {/* Badge Circle */}
      <View style={styles.badge}>
        <Ionicons
          name={typeIcon as any}
          size={badgeSize.iconSize}
          color="#FFFFFF"
        />
      </View>

      {/* Points Indicator */}
      {showPoints && (
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsText}>
            +{achievement.pointsReward}
          </Text>
        </View>
      )}

      {/* Difficulty Indicator */}
      <View style={styles.difficultyDot} />
    </View>
  );
};

const createStyles = (difficultyColor: string, badgeSize: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  badge: {
    width: badgeSize.size,
    height: badgeSize.size,
    borderRadius: badgeSize.size / 2,
    backgroundColor: difficultyColor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: difficultyColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  pointsContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFD700',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center'
  },
  pointsText: {
    fontSize: badgeSize.fontSize,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center'
  },
  difficultyDot: {
    position: 'absolute',
    bottom: -2,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: difficultyColor,
    borderWidth: 2,
    borderColor: '#FFFFFF'
  }
});