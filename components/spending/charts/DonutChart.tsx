import React from 'react';
import { View, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../../contexts/ThemeContext';
import { styles } from './DonutChart.styles';

interface DonutChartProps {
  percentage: number;
  isOverBudget: boolean;
  animatedProgress: Animated.Value;
  animatedScale: Animated.Value;
  size?: number;
  strokeWidth?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const DonutChart: React.FC<DonutChartProps> = ({
  percentage,
  isOverBudget,
  animatedProgress,
  animatedScale,
  size = 200,
  strokeWidth = 24,
}) => {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <Animated.View style={{
      transform: [{ scale: animatedScale }]
    }}>
      <View style={{ 
        width: size, 
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {/* Background Ring */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.background.secondary}
            strokeWidth={strokeWidth}
          />
          
          {/* Progress Ring with Rounded Caps */}
          {percentage > 0 && (
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={isOverBudget ? colors.error[500] : colors.primary[500]}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={animatedProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [circumference, circumference * (1 - Math.min(100, percentage) / 100)]
              })}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </Svg>
      </View>
    </Animated.View>
  );
};