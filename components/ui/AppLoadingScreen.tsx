import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typography from './Typography';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../constants/theme';

interface AppLoadingScreenProps {
  message?: string;
  showIcon?: boolean;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({ 
  message = "Loading your financial overview...", 
  showIcon = true 
}) => {
  const { colors } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Spin animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, [spinValue, pulseValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.primary.main }]}>
      {showIcon && (
        <Animated.View 
          style={[
            styles.iconContainer,
            { 
              backgroundColor: 'white',
              transform: [{ scale: pulseValue }] 
            }
          ]}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="wallet-outline" size={60} color={colors.primary.main} />
          </Animated.View>
        </Animated.View>
      )}
      
      <View style={styles.textContainer}>
        <Typography
          variant="h2"
          style={[styles.title, { color: 'white' }]}
          align="center"
        >
          Expenzez
        </Typography>
        
        <Typography
          variant="body"
          style={[styles.message, { color: 'rgba(255,255,255,0.8)' }]}
          align="center"
        >
          {message}
        </Typography>
      </View>

      {/* Loading dots */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <LoadingDot key={index} delay={index * 200} color="white" />
        ))}
      </View>
    </View>
  );
};

const LoadingDot: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    const timeout = setTimeout(() => {
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [opacity, delay]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { 
          backgroundColor: color,
          opacity 
        }
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  message: {
    fontSize: 16,
    maxWidth: '80%',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default AppLoadingScreen;