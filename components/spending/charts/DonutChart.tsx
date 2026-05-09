import React from "react";
import { View, Animated } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { useTheme } from "../../../contexts/ThemeContext";

interface DonutChartProps {
  percentage: number;
  isOverBudget: boolean;
  animatedProgress: Animated.Value;
  animatedScale: Animated.Value;
  size?: number;
  strokeWidth?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// v1.5 redesign — gradient stroke (primary → lime) when within budget,
// rose stroke when over. Track uses the new low-opacity ring color.
export const DonutChart: React.FC<DonutChartProps> = ({
  percentage,
  isOverBudget,
  animatedProgress,
  animatedScale,
  size = 200,
  strokeWidth = 24,
}) => {
  const { colors, isDark } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const trackColor = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(40,20,80,0.08)";

  const strokeRef = isOverBudget ? colors.rose[500] : "url(#donutGradient)";

  return (
    <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
      <View
        style={{
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Defs>
            <SvgLinearGradient id="donutGradient" x1="0" y1="0" x2={size} y2={size}>
              <Stop offset="0" stopColor={colors.primary[500]} />
              <Stop offset="1" stopColor={colors.lime[500]} />
            </SvgLinearGradient>
          </Defs>

          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />

          {percentage > 0 && (
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={strokeRef}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={animatedProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  circumference,
                  circumference * (1 - Math.min(100, percentage) / 100),
                ],
              })}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </Svg>
      </View>
    </Animated.View>
  );
};
