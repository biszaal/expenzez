// Global TypeScript type fixes for Expenzez app

declare module 'react-native-chart-kit' {
  export interface Dataset {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
    withShadow?: boolean; // Added custom property
    withDots?: boolean; // Added for chart compatibility
  }

  export interface AbstractChartConfig {
    backgroundColor?: string;
    backgroundGradientFrom?: string;
    backgroundGradientTo?: string;
    backgroundGradientFromOpacity?: number;
    backgroundGradientToOpacity?: number;
    fillShadowGradient?: string;
    fillShadowGradientOpacity?: number;
    fillShadowGradientTo?: string; // Added for chart compatibility
    fillShadowGradientFromOpacity?: number; // Added for chart compatibility
    fillShadowGradientToOpacity?: number; // Added for chart compatibility
    color?: (opacity: number) => string;
    labelColor?: (opacity: number) => string; // Added for chart compatibility
    strokeWidth?: number;
    barPercentage?: number;
    useShadowColorFromDataset?: boolean;
    decimalPlaces?: number;
    style?: any;
    propsForLabels?: any;
    propsForVerticalLabels?: any;
    propsForHorizontalLabels?: any;
    propsForDots?: any; // Added for chart compatibility
    propsForBackgroundLines?: any; // Added for chart compatibility
    formatYLabel?: (value: string) => string; // Added for chart compatibility
    yAxisMin?: number; // Added custom property
    yAxisMax?: number; // Added custom property
  }

  export interface LineChartProps {
    data: {
      labels: string[];
      datasets: Dataset[];
    };
    width: number;
    height: number;
    chartConfig: AbstractChartConfig;
    bezier?: boolean;
    style?: any;
    withShadow?: boolean;
    withDots?: boolean;
    withInnerLines?: boolean;
    withOuterLines?: boolean;
    withVerticalLines?: boolean;
    withHorizontalLines?: boolean;
    transparent?: boolean;
    segments?: number;
    formatYLabel?: (value: string) => string;
    formatXLabel?: (value: string) => string;
    yAxisLabel?: string;
    yAxisSuffix?: string;
    yAxisInterval?: number; // Added for chart compatibility
    fromZero?: boolean; // Added for chart compatibility
    showGrid?: boolean; // Added for chart compatibility
    showHorizontalLines?: boolean; // Added for chart compatibility
    showVerticalLines?: boolean; // Added for chart compatibility
    hidePointsAtIndex?: number[];
    getDotColor?: (dataPoint: any, dataPointIndex: number) => string;
    renderDotContent?: (params: {
      x: number;
      y: number;
      index: number;
      indexData: number;
    }) => React.ReactNode;
    onDataPointClick?: (data: {
      index: number;
      value: number;
      dataset: Dataset;
      x: number;
      y: number;
      getColor: (opacity: number) => string;
    }) => void;
  }

  export interface AbstractChartProps {
    fromZero?: boolean;
    chartConfig?: AbstractChartConfig;
    yAxisLabel?: string;
    yAxisSuffix?: string;
    yLabelsOffset?: number;
    yAxisInterval?: number;
    hidePointsAtIndex?: number[];
    formatYLabel?: (value: string) => string;
    formatXLabel?: (value: string) => string;
    segments?: number;
    transparent?: boolean;
    style?: any;
  }

  export class LineChart extends React.Component<AbstractChartProps & LineChartProps> {
    render(): React.ReactElement;
  }
}

// Allow any type for complex props that are difficult to type
declare global {
  interface Window {
    // Add any global properties if needed
    [key: string]: any;
  }
  
  // Extended style interfaces to allow more flexible style arrays
  namespace JSX {
    interface IntrinsicElements {
      // Allow any style arrays for common React Native components
      [elemName: string]: any;
    }
  }
}

// Extend React Native types for custom properties
declare module 'react-native' {
  interface TextStyle {
    fontWeight?: 
      | 'normal'
      | 'bold'
      | 'light'
      | 'medium'
      | '100'
      | '200'
      | '300'
      | '400'
      | '500'
      | '600'
      | '700'
      | '800'
      | '900'
      | 100
      | 200
      | 300
      | 400
      | 500
      | 600
      | 700
      | 800
      | 900
      | 'ultralight'
      | 'thin'
      | 'semibold'
      | 'extrabold'
      | 'black'
      | string; // Allow string fallback
  }
  
  // Allow flexible style props for Text components
  interface TextProps {
    style?: any; // Allow any style type to fix array issues
  }
  
  // Allow flexible style props for View components
  interface ViewProps {
    style?: any; // Allow any style type to fix array issues
  }
  
  // Allow flexible style props for TouchableOpacity components
  interface TouchableOpacityProps {
    style?: any; // Allow any style type to fix array issues
  }
  
  // Allow flexible style props for ScrollView components
  interface ScrollViewProps {
    style?: any; // Allow any style type to fix array issues
  }
}

export {};