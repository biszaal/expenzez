import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  G,
  Text as SvgText,
  Mask,
  Rect,
} from "react-native-svg";
import * as Haptics from "expo-haptics";
import {
  LineChartProps,
  ChartDimensions,
  ChartDataPoint,
  GestureState,
} from "./types";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width,
  height,
  animated = true,
  interactive = true,
  gradientColors = ["#8B5CF6", "#3B82F6"],
  lineColor = "#8B5CF6",
  pointColor = "#8B5CF6",
  backgroundColor = "transparent",
  onPointSelect,
  showGrid = true,
  showPoints = true,
  curveType = "bezier",
  gridColor = "#888",
  labelColor = "#888",
}) => {
  // Animation values
  const pathAnimationProgress = useSharedValue(0);
  const gestureX = useSharedValue(0);
  const gestureY = useSharedValue(0);
  const isGestureActive = useSharedValue(false);
  const selectedPointIndex = useSharedValue(-1);

  // State for displaying selected value
  const [selectedValue, setSelectedValue] = useState<{
    value: number;
    label: string;
  } | null>(null);

  // Chart dimensions
  const dimensions: ChartDimensions = useMemo(
    () => ({
      width,
      height,
      paddingHorizontal: 35,
      paddingVertical: 20,
      chartWidth: width - 70,
      chartHeight: height - 40,
    }),
    [width, height]
  );

  // Calculate min/max values for scaling (including comparison data)
  const { minValue, maxValue, valueRange } = useMemo(() => {
    if (!data.values.length) {
      return { minValue: 0, maxValue: 1, valueRange: 1 };
    }

    let allValues = [...data.values];

    // Include comparison data in min/max calculation
    if (data.comparisonData?.values) {
      allValues = [...allValues, ...data.comparisonData.values];
    }

    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    const range = max - min || 1;

    return { minValue: min, maxValue: max, valueRange: range };
  }, [data.values, data.comparisonData]);

  // Process data points with coordinates
  const processedData = useMemo(() => {
    if (!data.values.length) {
      return [];
    }

    return data.values.map((value, index) => {
      // X coordinate: spread points evenly across chart width
      const x =
        dimensions.paddingHorizontal +
        (index / Math.max(1, data.values.length - 1)) * dimensions.chartWidth;

      // Y coordinate: map value to chart height (inverted because SVG y=0 is top)
      const normalizedValue =
        valueRange === 0 ? 0.5 : (value - minValue) / valueRange;
      const y =
        dimensions.height -
        dimensions.paddingVertical -
        normalizedValue * dimensions.chartHeight;

      return {
        value,
        label: data.labels[index] || `${index}`,
        date: data.labels[index] || "",
        x,
        y,
      } as ChartDataPoint;
    });
  }, [data, dimensions, minValue, maxValue, valueRange]);

  // Process comparison data points with coordinates
  const comparisonProcessedData = useMemo(() => {
    if (!data.comparisonData?.values || !data.comparisonData.values.length) {
      return [];
    }

    return data.comparisonData.values.map((value, index) => {
      // X coordinate: spread points evenly across chart width
      const x =
        dimensions.paddingHorizontal +
        (index / Math.max(1, data.comparisonData!.values.length - 1)) *
          dimensions.chartWidth;

      // Y coordinate: map value to chart height using same scale as main data
      const normalizedValue =
        valueRange === 0 ? 0.5 : (value - minValue) / valueRange;
      const y =
        dimensions.height -
        dimensions.paddingVertical -
        normalizedValue * dimensions.chartHeight;

      return {
        value,
        label: data.labels[index] || `${index}`,
        date: data.labels[index] || "",
        x,
        y,
      } as ChartDataPoint;
    });
  }, [
    data.comparisonData,
    data.labels,
    dimensions,
    minValue,
    maxValue,
    valueRange,
  ]);

  // Generate SVG path
  const generatePath = (
    points: ChartDataPoint[],
    type: "linear" | "bezier" = "bezier"
  ): string => {
    if (points.length === 0) return "";

    let path = `M${points[0].x},${points[0].y}`;

    if (type === "linear") {
      for (let i = 1; i < points.length; i++) {
        path += ` L${points[i].x},${points[i].y}`;
      }
    } else {
      // Bezier curve implementation
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const controlPoint1X = current.x + (next.x - current.x) * 0.4;
        const controlPoint1Y = current.y;
        const controlPoint2X = current.x + (next.x - current.x) * 0.6;
        const controlPoint2Y = next.y;

        path += ` C${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${next.x},${next.y}`;
      }
    }

    return path;
  };

  // Generate SVG paths
  const svgPath = useMemo(
    () => generatePath(processedData, curveType),
    [processedData, curveType]
  );
  const comparisonSvgPath = useMemo(
    () => generatePath(comparisonProcessedData, curveType),
    [comparisonProcessedData, curveType]
  );

  // Find closest point to gesture
  const findClosestPoint = (x: number): number => {
    let closestIndex = 0;
    let minDistance = Math.abs(processedData[0]?.x - x);

    processedData.forEach((point, index) => {
      const distance = Math.abs(point.x - x);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  // Gesture handler
  const gestureHandler = Gesture.Pan()
    .onStart(() => {
      "worklet";
      isGestureActive.value = true;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((event) => {
      "worklet";
      // Try using absoluteX/Y to get screen coordinates, then convert to SVG coordinates
      const gestureXCoord = event.x;
      const gestureYCoord = event.y;

      const clampedX = Math.max(
        dimensions.paddingHorizontal,
        Math.min(gestureXCoord, dimensions.width - dimensions.paddingHorizontal)
      );

      // Find closest point inline for better performance
      let closestIndex = 0;
      let minDistance = Math.abs(processedData[0]?.x - clampedX);

      processedData.forEach((point, index) => {
        const distance = Math.abs(point.x - clampedX);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      if (closestIndex !== selectedPointIndex.value) {
        selectedPointIndex.value = closestIndex;

        if (processedData[closestIndex]) {
          // Interpolate Y position directly in the worklet for better performance
          let interpolatedY = processedData[closestIndex].y;

          // Find interpolated Y position based on gesture X
          if (processedData.length > 1) {
            const clampedX = Math.max(
              processedData[0].x,
              Math.min(gestureXCoord, processedData[processedData.length - 1].x)
            );

            // Find bracketing points
            for (let i = 0; i < processedData.length - 1; i++) {
              const current = processedData[i];
              const next = processedData[i + 1];

              if (clampedX >= current.x && clampedX <= next.x) {
                const ratio = (clampedX - current.x) / (next.x - current.x);
                interpolatedY = current.y + ratio * (next.y - current.y);
                break;
              }
            }
          }

          // Position dot using SVG coordinates directly (no screen-based corrections needed)
          // The gesture coordinates should already match the SVG coordinate system
          gestureX.value = gestureXCoord;
          gestureY.value = interpolatedY;

          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);

          // Update selected value for display
          runOnJS(setSelectedValue)({
            value: processedData[closestIndex].value,
            label: processedData[closestIndex].label,
          });

          if (onPointSelect) {
            runOnJS(onPointSelect)(processedData[closestIndex]);
          }
        }
      }
    })
    .onEnd(() => {
      "worklet";
      isGestureActive.value = false;
      selectedPointIndex.value = -1;
      runOnJS(setSelectedValue)(null);
    });

  // Calculate path length for smooth animation
  const pathLength = useMemo(() => {
    if (processedData.length < 2) return 0;

    let totalLength = 0;
    for (let i = 0; i < processedData.length - 1; i++) {
      const dx = processedData[i + 1].x - processedData[i].x;
      const dy = processedData[i + 1].y - processedData[i].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }
    return totalLength;
  }, [processedData]);

  // Animated mask width for revealing line from left to right
  const animatedMaskStyle = useAnimatedStyle(() => {
    // Calculate the actual line width based on data points for more precise masking
    const lineWidth =
      processedData.length > 0
        ? processedData[processedData.length - 1].x -
          processedData[0].x +
          dimensions.paddingHorizontal
        : dimensions.width;

    const revealWidth = interpolate(
      pathAnimationProgress.value,
      [0, 1],
      [
        processedData[0]?.x || dimensions.paddingHorizontal,
        processedData[processedData.length - 1]?.x || dimensions.width,
      ],
      Extrapolate.CLAMP
    );

    return {
      width: revealWidth,
    };
  });

  // Animated end dot position that follows the line animation
  const animatedEndDotStyle = useAnimatedStyle(() => {
    if (processedData.length === 0) {
      return { opacity: 0 };
    }

    const progress = pathAnimationProgress.value;

    // Calculate which point index we should be at based on progress
    const targetIndex = Math.floor(progress * (processedData.length - 1));
    const nextIndex = Math.min(targetIndex + 1, processedData.length - 1);

    // Get the current and next points
    const currentPoint = processedData[targetIndex];
    const nextPoint = processedData[nextIndex];

    if (!currentPoint) {
      return { opacity: 0 };
    }

    // Calculate interpolation within the current segment
    const segmentProgress = progress * (processedData.length - 1) - targetIndex;

    // Interpolate position between current and next point
    const animatedX =
      currentPoint.x + (nextPoint.x - currentPoint.x) * segmentProgress;
    const animatedY =
      currentPoint.y + (nextPoint.y - currentPoint.y) * segmentProgress;

    return {
      transform: [
        { translateX: animatedX - processedData[processedData.length - 1].x },
        { translateY: animatedY - processedData[processedData.length - 1].y },
      ] as any,
      opacity: progress > 0.05 ? 1 : 0, // Show dot early in animation
    };
  });

  const animatedPointStyle = useAnimatedStyle(() => {
    const scale = isGestureActive.value
      ? withSpring(1.3, { damping: 15, stiffness: 200 })
      : withSpring(1, { damping: 15, stiffness: 200 });
    const opacity = isGestureActive.value
      ? withSpring(1, { damping: 15, stiffness: 200 })
      : withSpring(0, { damping: 15, stiffness: 200 });

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Animation on mount - linear timing
  useEffect(() => {
    if (animated && processedData.length > 0) {
      // Reset animation
      pathAnimationProgress.value = 0;
      // Start animation with linear easing
      setTimeout(() => {
        pathAnimationProgress.value = withTiming(1, {
          duration: 1500,
          easing: Easing.linear, // Linear animation
        });
      }, 300);
    }
  }, [processedData, animated, pathAnimationProgress]);

  return (
    <View style={[styles.container, { backgroundColor, width, height }]}>
      {/* Value display overlay */}
      {selectedValue && (
        <Animated.View style={[styles.valueOverlay, animatedPointStyle]}>
          <Text style={styles.valueText}>
            £{selectedValue.value.toFixed(2)}
          </Text>
          <Text style={styles.labelText}>{selectedValue.label}</Text>
        </Animated.View>
      )}

      <GestureDetector gesture={gestureHandler}>
        <Animated.View style={{ width, height }}>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                {gradientColors.map((color, index) => (
                  <Stop
                    key={index}
                    offset={`${(index / (gradientColors.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </LinearGradient>

              {/* Mask for line animation */}
              <Mask id="lineMask">
                <AnimatedRect
                  x={0}
                  y={0}
                  height={dimensions.height}
                  fill="white"
                  animatedProps={animatedMaskStyle}
                />
              </Mask>
            </Defs>

            {/* Grid lines - removed for cleaner look */}

            {/* Main line path with mask animation */}
            <Path
              d={svgPath}
              stroke={lineColor}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              mask={animated ? "url(#lineMask)" : undefined}
            />

            {/* Comparison line (previous month) */}
            {comparisonSvgPath && (
              <Path
                d={comparisonSvgPath}
                stroke="rgba(156, 163, 175, 0.6)" // Faded gray color
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6,4" // Dashed line to differentiate
                opacity={0.8}
              />
            )}

            {/* Data points - disabled to reduce clutter */}

            {/* Today's date dot at end of line - animated */}
            {processedData.length > 0 && (
              <G>
                <AnimatedCircle
                  cx={processedData[processedData.length - 1].x}
                  cy={processedData[processedData.length - 1].y}
                  r={6}
                  fill={lineColor}
                  stroke="white"
                  strokeWidth={2}
                  animatedProps={animatedEndDotStyle as any}
                />
              </G>
            )}

            {/* Y-axis labels - only show 2 labels to prevent overlap */}
            <G>
              {[0, 1].map((ratio, index) => {
                const value = minValue + ratio * (maxValue - minValue);
                const y =
                  dimensions.height -
                  dimensions.paddingVertical -
                  ratio * dimensions.chartHeight;
                return (
                  <SvgText
                    key={`ylabel-${index}`}
                    x={dimensions.paddingHorizontal - 5}
                    y={y + 3}
                    fontSize={9}
                    fill={labelColor}
                    textAnchor="end"
                    fontWeight="500"
                  >
                    £
                    {value >= 1000
                      ? `${(value / 1000).toFixed(1)}k`
                      : Math.round(value)}
                  </SvgText>
                );
              })}
            </G>

            {/* X-axis labels - only show non-empty labels */}
            <G>
              {processedData.map((point, index) => {
                if (data.labels[index] && data.labels[index].trim() !== "") {
                  return (
                    <SvgText
                      key={`xlabel-${index}`}
                      x={point.x}
                      y={dimensions.height - 8}
                      fontSize={10}
                      fill={labelColor}
                      textAnchor="middle"
                      fontWeight="500"
                    >
                      {data.labels[index]}
                    </SvgText>
                  );
                }
                return null;
              })}
            </G>
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
  },
  valueOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  valueText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  labelText: {
    color: "white",
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
});

export default LineChart;
