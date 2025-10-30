import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/Colors';

interface LevelUpCelebrationProps {
  visible: boolean;
  level: number;
  pointsEarned: number;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  visible,
  level,
  pointsEarned,
  onClose
}) => {
  const { colors } = useTheme();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const starAnimations = useRef(
    Array.from({ length: 8 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (visible) {
      // Start level up animation sequence
      Animated.sequence([
        // Initial fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        // Trophy scale animation
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true
        })
      ]).start();

      // Pulsing trophy effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          })
        ])
      ).start();

      // Stars animation
      const starDelay = 200;
      starAnimations.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: index * starDelay,
          useNativeDriver: true
        }).start();
      });

      // Auto-close after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      onClose();
      // Reset animations
      scaleAnim.setValue(0.3);
      pulseAnim.setValue(1);
      starAnimations.forEach(anim => anim.setValue(0));
    });
  };

  if (!visible) {
    return null;
  }

  const styles = createStyles(colors);

  // Star positions around the trophy
  const starPositions = [
    { top: '15%' as any, left: '20%' as any },
    { top: '10%' as any, left: '45%' as any },
    { top: '15%' as any, right: '20%' as any },
    { top: '35%' as any, left: '10%' as any },
    { top: '35%' as any, right: '10%' as any },
    { bottom: '35%' as any, left: '15%' as any },
    { bottom: '30%' as any, left: '45%' as any },
    { bottom: '35%' as any, right: '15%' as any }
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Animated Stars */}
        {starAnimations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.star,
              starPositions[index],
              {
                opacity: anim,
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1]
                    })
                  },
                  {
                    rotate: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }
                ]
              }
            ]}
          >
            <Ionicons name="star" size={20} color="#FFD700" />
          </Animated.View>
        ))}

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Trophy Icon */}
          <Animated.View
            style={[
              styles.trophyContainer,
              {
                transform: [
                  { scale: Animated.multiply(scaleAnim, pulseAnim) }
                ]
              }
            ]}
          >
            <View style={styles.trophyGlow}>
              <Ionicons name="trophy" size={80} color="#FFD700" />
            </View>
          </Animated.View>

          {/* Level Up Text */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: scaleAnim,
                transform: [
                  {
                    translateY: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0]
                    })
                  }
                ]
              }
            ]}
          >
            <Text style={styles.levelUpTitle}>
              🎉 LEVEL UP! 🎉
            </Text>

            <Text style={styles.newLevelText}>
              Level {level}
            </Text>

            <Text style={styles.achievedText}>
              Congratulations! You&apos;ve reached a new level in your financial journey.
            </Text>

            {pointsEarned > 0 && (
              <View style={styles.pointsContainer}>
                <Ionicons name="star" size={24} color={colors.accent.main} />
                <Text style={styles.pointsText}>
                  +{pointsEarned} XP Bonus
                </Text>
              </View>
            )}

            <Text style={styles.motivationalText}>
              Keep building those wealth habits! 💪
            </Text>
          </Animated.View>
        </View>

        {/* Close hint */}
        <Animated.View
          style={[
            styles.closeHint,
            {
              opacity: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.7]
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
  star: {
    position: 'absolute'
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl
  },
  trophyContainer: {
    marginBottom: SPACING.xl
  },
  trophyGlow: {
    padding: SPACING.lg,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20
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
  levelUpTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary.main,
    textAlign: 'center',
    marginBottom: SPACING.md
  },
  newLevelText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: SPACING.md,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  achievedText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.light + '20',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent.main,
    marginLeft: SPACING.sm
  },
  motivationalText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic'
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