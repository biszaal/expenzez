export interface ChartDataPoint {
  value: number;
  label: string;
  date: string;
  x: number;
  y: number;
}

export interface ChartData {
  labels: string[];
  values: number[];
  dataPoints: ChartDataPoint[];
}

export interface ChartDimensions {
  width: number;
  height: number;
  paddingHorizontal: number;
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
  curveType?: 'linear' | 'bezier';
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