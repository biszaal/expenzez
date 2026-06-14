import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useCurrency } from "../../contexts/CurrencyContext";
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
  Line,
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
import { fontFamily } from "../../constants/theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width,
  height,
  animated = true,
  interactive = true,
  gradientColors = ["#7B2D8E", "#3B82F6"],
  lineColor = "#7B2D8E",
  pointColor = "#7B2D8E",
  backgroundColor = "transparent",
  onPointSelect,
  showGrid = true,
  showPoints = true,
  curveType = "bezier",
  gridColor = "#888",
  labelColor = "#888",
  endDotRingColor = "#FFFFFF",
}) => {
  const { symbol, formatAmount } = useCurrency();
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

  // Chart dimensions. Left gutter is wider to seat the Y-axis labels; the right
  // inset gives the animated end-dot breathing room so it never clips the edge.
  const dimensions: ChartDimensions = useMemo(
    () => ({
      width,
      height,
      paddingLeft: 36,
      paddingRight: 18,
      paddingVertical: 20,
      chartWidth: width - 36 - 18,
      chartHeight: height - 40,
    }),
    [width, height]
  );

  // Scale the data. `dataMax` is the true peak (used for the top axis label);
  // `scaleMax` adds ~12% headroom above it so the curve and end-dot never touch
  // the top edge. The baseline is pinned to 0 (or below, if values ever go
  // negative) so the area fills to a meaningful £0 origin.
  const { scaleMin, scaleRange, dataMax } = useMemo(() => {
    if (!data.values.length) {
      return { scaleMin: 0, scaleRange: 1, dataMax: 0 };
    }

    let allValues = [...data.values];

    // Include comparison data in min/max calculation
    if (data.comparisonData?.values) {
      allValues = [...allValues, ...data.comparisonData.values];
    }

    const max = Math.max(...allValues);
    const min = Math.min(0, ...allValues);
    const headroom = (max - min) * 0.12;
    const ceiling = max + headroom || 1;
    const range = ceiling - min || 1;

    return { scaleMin: min, scaleRange: range, dataMax: max };
  }, [data.values, data.comparisonData]);

  // Map a data value to a Y pixel coordinate (SVG y grows downward).
  const valueToY = useMemo(
    () => (value: number) =>
      dimensions.height -
      dimensions.paddingVertical -
      ((value - scaleMin) / scaleRange) * dimensions.chartHeight,
    [dimensions, scaleMin, scaleRange]
  );

  // Process data points with coordinates
  const processedData = useMemo(() => {
    if (!data.values.length) {
      return [];
    }

    return data.values.map((value, index) => {
      // X coordinate: spread points evenly across chart width
      const x =
        dimensions.paddingLeft +
        (index / Math.max(1, data.values.length - 1)) * dimensions.chartWidth;

      // Y coordinate: map value to chart height (inverted because SVG y=0 is top)
      const y = valueToY(value);

      return {
        value,
        label: data.labels[index] || `${index}`,
        date: data.labels[index] || "",
        x,
        y,
      } as ChartDataPoint;
    });
  }, [data, dimensions, valueToY]);

  // Process comparison data points with coordinates
  const comparisonProcessedData = useMemo(() => {
    if (!data.comparisonData?.values || !data.comparisonData.values.length) {
      return [];
    }

    return data.comparisonData.values.map((value, index) => {
      // X coordinate: spread points evenly across chart width
      const x =
        dimensions.paddingLeft +
        (index / Math.max(1, data.comparisonData!.values.length - 1)) *
          dimensions.chartWidth;

      // Y coordinate: map value to chart height using same scale as main data
      const y = valueToY(value);

      return {
        value,
        label: data.labels[index] || `${index}`,
        date: data.labels[index] || "",
        x,
        y,
      } as ChartDataPoint;
    });
  }, [data.comparisonData, data.labels, dimensions, valueToY]);

  // Monotone cubic interpolation (Fritsch–Carlson). Unlike the naive bezier
  // below, this guarantees the curve never overshoots or dips between points —
  // essential for the step-like cumulative spend series, which is monotonic and
  // would otherwise wobble. Tangents are clamped, then emitted as cubic-bezier
  // `C` segments with control points a third of the way along each tangent.
  const generateMonotonePath = (points: ChartDataPoint[]): string => {
    const n = points.length;
    if (n < 2) return n === 1 ? `M${points[0].x},${points[0].y}` : "";

    // Secant slopes between consecutive points.
    const dx: number[] = [];
    const slope: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const h = points[i + 1].x - points[i].x || 1;
      dx.push(h);
      slope.push((points[i + 1].y - points[i].y) / h);
    }

    // Per-point tangents, then clamp to preserve monotonicity.
    const m: number[] = new Array(n);
    m[0] = slope[0];
    m[n - 1] = slope[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (slope[i - 1] * slope[i] <= 0) {
        m[i] = 0;
      } else {
        m[i] = (slope[i - 1] + slope[i]) / 2;
      }
    }
    for (let i = 0; i < n - 1; i++) {
      if (slope[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
      } else {
        const a = m[i] / slope[i];
        const b = m[i + 1] / slope[i];
        const s = a * a + b * b;
        if (s > 9) {
          const t = 3 / Math.sqrt(s);
          m[i] = t * a * slope[i];
          m[i + 1] = t * b * slope[i];
        }
      }
    }

    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < n - 1; i++) {
      const c1x = points[i].x + dx[i] / 3;
      const c1y = points[i].y + (m[i] * dx[i]) / 3;
      const c2x = points[i + 1].x - dx[i] / 3;
      const c2y = points[i + 1].y - (m[i + 1] * dx[i]) / 3;
      path += ` C${c1x},${c1y} ${c2x},${c2y} ${points[i + 1].x},${points[i + 1].y}`;
    }
    return path;
  };

  // Generate SVG path
  const generatePath = (
    points: ChartDataPoint[],
    type: "linear" | "bezier" | "monotone" = "bezier"
  ): string => {
    if (points.length === 0) return "";

    if (type === "monotone") {
      return generateMonotonePath(points);
    }

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

  // Closed area path used to fill the region under the line with a
  // vertical purple→transparent gradient (matches screens/spending.jsx).
  const areaPath = useMemo(() => {
    if (!svgPath || processedData.length < 2) return null;
    const firstX = processedData[0].x;
    const lastX = processedData[processedData.length - 1].x;
    const bottomY = dimensions.height - dimensions.paddingVertical;
    return `${svgPath} L${lastX.toFixed(2)},${bottomY.toFixed(2)} L${firstX.toFixed(2)},${bottomY.toFixed(2)} Z`;
  }, [svgPath, processedData, dimensions]);

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
        dimensions.paddingLeft,
        Math.min(gestureXCoord, dimensions.width - dimensions.paddingRight)
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
    const revealWidth = interpolate(
      pathAnimationProgress.value,
      [0, 1],
      [
        processedData[0]?.x || dimensions.paddingLeft,
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

  // Compact GBP for axis ticks: £0, £659, £1.3k.
  const formatAxisValue = (v: number) =>
    v >= 1000 ? `${symbol}${(v / 1000).toFixed(1)}k` : `${symbol}${Math.round(v)}`;

  return (
    <View style={[styles.container, { backgroundColor, width, height }]}>
      {/* Value display overlay */}
      {selectedValue && (
        <Animated.View style={[styles.valueOverlay, animatedPointStyle]}>
          <Text style={styles.valueText}>
            {formatAmount(selectedValue.value)}
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

              {/* Vertical area-fill gradient — kept light so the fill reads as
                  a soft tint under the line rather than a heavy block. */}
              <LinearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={lineColor} stopOpacity={0.2} />
                <Stop offset="0.55" stopColor={lineColor} stopOpacity={0.04} />
                <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
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

            {/* Faint horizontal gridlines at the 0 / mid / max levels. Drawn
                first, behind everything, so they read as quiet guides. The
                bottom line doubles as the £0 baseline. */}
            {showGrid && dataMax > 0 && (
              <G>
                {[0, dataMax / 2, dataMax].map((level, index) => {
                  const y = valueToY(level);
                  return (
                    <Line
                      key={`grid-${index}`}
                      x1={dimensions.paddingLeft}
                      y1={y}
                      x2={dimensions.width - dimensions.paddingRight}
                      y2={y}
                      stroke={gridColor}
                      strokeWidth={1}
                      opacity={0.07}
                    />
                  );
                })}
              </G>
            )}

            {/* Soft area fill under the curve. Drawn first so the line and
                end-dot sit on top. Reuses the same horizontal sweep mask so
                the fill animates in alongside the stroke. */}
            {areaPath && (
              <Path
                d={areaPath}
                fill="url(#lineAreaGradient)"
                stroke="none"
                mask={animated ? "url(#lineMask)" : undefined}
              />
            )}

            {/* Comparison line (previous month) — a thin, soft dashed
                reference. Drawn under the main line so the current month always
                reads as the hero. */}
            {comparisonSvgPath && (
              <Path
                d={comparisonSvgPath}
                stroke={labelColor}
                strokeWidth={1.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4,4"
                opacity={0.4}
              />
            )}

            {/* Main line path with mask animation */}
            <Path
              d={svgPath}
              stroke={lineColor}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              mask={animated ? "url(#lineMask)" : undefined}
            />

            {/* Data points - disabled to reduce clutter */}

            {/* End-of-line marker — soft halo, a ring punched in the card
                colour, and a solid core. Follows the line as it animates in. */}
            {processedData.length > 0 && (
              <G>
                <AnimatedCircle
                  cx={processedData[processedData.length - 1].x}
                  cy={processedData[processedData.length - 1].y}
                  r={9}
                  fill={lineColor}
                  opacity={0.15}
                  animatedProps={animatedEndDotStyle as any}
                />
                <AnimatedCircle
                  cx={processedData[processedData.length - 1].x}
                  cy={processedData[processedData.length - 1].y}
                  r={5.5}
                  fill={endDotRingColor}
                  animatedProps={animatedEndDotStyle as any}
                />
                <AnimatedCircle
                  cx={processedData[processedData.length - 1].x}
                  cy={processedData[processedData.length - 1].y}
                  r={3.5}
                  fill={lineColor}
                  animatedProps={animatedEndDotStyle as any}
                />
              </G>
            )}

            {/* Y-axis labels at the £0 / mid / max levels, seated in the left
                gutter and lifted just above each gridline so the £0 label
                clears the X-axis row below. Mono font for tabular figures. */}
            {dataMax > 0 && (
              <G>
                {[0, dataMax / 2, dataMax].map((level, index) => (
                  <SvgText
                    key={`ylabel-${index}`}
                    x={dimensions.paddingLeft - 8}
                    y={valueToY(level) - 4}
                    fontSize={9}
                    fill={labelColor}
                    textAnchor="end"
                    fontFamily={fontFamily.mono}
                    opacity={0.75}
                  >
                    {formatAxisValue(level)}
                  </SvgText>
                ))}
              </G>
            )}

            {/* X-axis labels - only show non-empty labels */}
            <G>
              {processedData.map((point, index) => {
                if (data.labels[index] && data.labels[index].trim() !== "") {
                  return (
                    <SvgText
                      key={`xlabel-${index}`}
                      x={point.x}
                      y={dimensions.height - 6}
                      fontSize={9.5}
                      fill={labelColor}
                      textAnchor="middle"
                      fontFamily={fontFamily.medium}
                      opacity={0.75}
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
