import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Achievement } from '../../services/api/achievementAPI';
import { AchievementBadge } from './AchievementBadge';
import { SPACING, BORDER_RADIUS } from '../../constants/Colors';

interface CelebrationAnimationProps {
  visible: boolean;
  achievement: Achievement | null;
  celebrationMessage?: {
    title: string;
    message: string;
    pointsEarned: number;
    motivationalTip: string;
  } | null;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  visible,
  achievement,
  celebrationMessage,
  onClose
}) => {
  const { colors } = useTheme();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible && achievement) {
      // Start celebration animation sequence
      Animated.sequence([
        // Initial fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        // Badge scale animation
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true
        }),
        // Confetti animation
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        }),
        // Text slide up
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true
        })
      ]).start();

      // Auto-close after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, achievement]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      onClose();
      // Reset animations
      scaleAnim.setValue(0.3);
      confettiAnim.setValue(0);
      slideAnim.setValue(50);
    });
  };

  if (!visible || !achievement) {
    return null;
  }

  const styles = createStyles(colors);

  // Generate confetti particles
  const confettiParticles = Array.from({ length: 20 }, (_, index) => (
    <Animated.View
      key={index}
      style={[
        styles.confettiParticle,
        {
          left: Math.random() * screenWidth,
          backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][
            Math.floor(Math.random() * 5)
          ],
          transform: [
            {
              translateY: confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, screenHeight + 50]
              })
            },
            {
              rotate: confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg']
              })
            }
          ]
        }
      ]}
    />
  ));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Confetti */}
        <View style={styles.confettiContainer}>
          {confettiParticles}
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Achievement Badge */}
          <Animated.View
            style={[
              styles.badgeContainer,
              {
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <AchievementBadge
              achievement={achievement}
              size="large"
              showPoints
            />
          </Animated.View>

          {/* Celebration Text */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                transform: [{ translateY: slideAnim }],
                opacity: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [1, 0]
                })
              }
            ]}
          >
            <Text style={styles.celebrationTitle}>
              🎉 Achievement Unlocked! 🎉
            </Text>

            <Text style={styles.achievementTitle}>
              {achievement.title}
            </Text>

            <Text style={styles.achievementDescription}>
              {achievement.description}
            </Text>

            {celebrationMessage && (
              <>
                <View style={styles.pointsEarnedContainer}>
                  <Ionicons name="star" size={20} color="#FFD700" />
                  <Text style={styles.pointsEarnedText}>
                    +{celebrationMessage.pointsEarned} XP earned
                  </Text>
                </View>

                <Text style={styles.motivationalText}>
                  {celebrationMessage.motivationalTip}
                </Text>
              </>
            )}
          </Animated.View>
        </View>

        {/* Close hint */}
        <Animated.View
          style={[
            styles.closeHint,
            {
              opacity: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0.7, 0]
              })
            }
          ]}
        >
          <Text style={styles.closeHintText}>Tap anywhere to continue</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none'
  },
  confettiParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl
  },
  badgeContainer: {
    marginBottom: SPACING.xl
  },
  textContainer: {
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    maxWidth: screenWidth * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary.main,
    textAlign: 'center',
    marginBottom: SPACING.md
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm
  },
  achievementDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg
  },
  pointsEarnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.light + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md
  },
  pointsEarnedText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent.main,
    marginLeft: SPACING.xs
  },
  motivationalText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20
  },
  closeHint: {
    position: 'absolute',
    bottom: SPACING.xl,
    alignSelf: 'center'
  },
  closeHintText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500'
  }
});