import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Typography from './Typography';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../constants/theme';

interface TabLoadingScreenProps {
  message?: string;
}

export const TabLoadingScreen: React.FC<TabLoadingScreenProps> = ({ 
  message = "Loading..." 
}) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [fadeAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.content}>
        {/* Simple animated dots */}
        <View style={styles.dotsContainer}>
          <Animated.View 
            style={[
              styles.dot,
              { 
                backgroundColor: colors.primary.main,
                opacity: fadeAnim 
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.dot,
              { 
                backgroundColor: colors.primary.main,
                opacity: fadeAnim 
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.dot,
              { 
                backgroundColor: colors.primary.main,
                opacity: fadeAnim 
              }
            ]} 
          />
        </View>
        
        <Typography
          variant="body"
          style={[styles.message, { color: colors.text.secondary }]}
          align="center"
        >
          {message}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  message: {
    fontSize: 14,
    opacity: 0.7,
  },
});

export default TabLoadingScreen;