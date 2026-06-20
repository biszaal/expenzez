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

  const styles = createStyles(colors, difficultyColor);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(achievement)}
      activeOpacity={0.85}
    >
      {/* Icon chip + difficulty accent */}
      <View style={styles.topRow}>
        <View style={styles.iconChip}>
          <Ionicons name={typeIcon as any} size={15} color={difficultyColor} />
        </View>
        <Text style={styles.difficultyText}>
          {achievement.difficulty.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {achievement.title}
      </Text>

      <View style={styles.footer}>
        <View style={styles.points}>
          <Ionicons name="star" size={11} color={difficultyColor} />
          <Text style={styles.pointsText}>{achievement.pointsReward}</Text>
        </View>
        <Text style={styles.dateText} numberOfLines={1}>
          {achievementAPI.formatAchievementDate(achievement.earnedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: any, difficultyColor: string) => StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.card.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.card.border,
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 104,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconChip: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: `${difficultyColor}1F`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: difficultyColor,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.1,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  points: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  dateText: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
});