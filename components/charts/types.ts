export interface ChartDataPoint {
  value: number;
  label: string;
  date: string;
  x: number;
  y: number;
}

export interface ChartDataset {
  values: number[];
  dataPoints: ChartDataPoint[];
  color?: string;
  lineColor?: string;
  pointColor?: string;
  gradientColors?: string[];
  strokeWidth?: number;
  opacity?: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  values: number[];
  dataPoints: ChartDataPoint[];
  // New: Support for multiple datasets
  datasets?: ChartDataset[];
  // Backward compatibility
  comparisonData?: ChartDataset;
}

export interface ChartDimensions {
  width: number;
  height: number;
  // Asymmetric horizontal padding: left gutter holds the Y-axis labels, the
  // right inset gives the animated end-dot room so it never clips the edge.
  paddingLeft: number;
  paddingRight: number;
  paddingVertical: number;
  chartWidth: number;
  chartHeight: number;
}

export interface LineChartProps {
  data: ChartData;
  width: number;
  height: number;
  animated?: boolean;
  interactive?: boolean;
  gradientColors?: string[];
  lineColor?: string;
  pointColor?: string;
  backgroundColor?: string;
  onPointSelect?: (point: ChartDataPoint) => void;
  showGrid?: boolean;
  showPoints?: boolean;
  curveType?: 'linear' | 'bezier' | 'monotone';
  // Theme-aware colors
  gridColor?: string;
  labelColor?: string;
  // Colour the ring punched around the animated end-dot (usually the card
  // background) so the dot reads as a clean target against the line + fill.
  endDotRingColor?: string;
}

export interface AnimationConfig {
  duration: number;
  dampingRatio: number;
  stiffness: number;
}

export interface GestureState {
  isActive: boolean;
  selectedIndex: number;
  x: number;
  y: number;
}