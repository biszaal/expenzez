/**
 * Performance Optimization Utilities
 * Centralized performance optimizations for the Expenzez app
 */

import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";

/**
 * Debounced hook for search and input handling
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled callback hook for scroll and resize events
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const throttledCallback = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;

    return ((...args: any[]) => {
      const now = Date.now();

      if (now - lastExecTime >= delay) {
        lastExecTime = now;
        return callback(...args);
      } else {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(
          () => {
            lastExecTime = Date.now();
            callback(...args);
          },
          delay - (now - lastExecTime)
        );
      }
    }) as T;
  }, [callback, delay, ...deps]);

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [throttledCallback]);

  return throttledCallback;
}

/**
 * Memoized expensive calculations
 */
export function useExpensiveCalculation<T>(
  calculation: () => T,
  deps: React.DependencyList
): T {
  return useMemo(calculation, deps);
}

/**
 * Virtual scrolling hook for large lists
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

/**
 * Image lazy loading hook
 */
export function useLazyImage(src: string) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            setIsLoaded(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return { imageSrc, isLoaded, imgRef };
}

/**
 * API call batching utility
 */
export class ApiBatcher {
  private static batchQueue: Array<{
    key: string;
    promise: Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  private static batchTimeout: NodeJS.Timeout | null = null;

  /**
   * Batch multiple API calls with the same key
   */
  static async batch<T>(
    key: string,
    apiCall: () => Promise<T>,
    delay: number = 100
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Check if there's already a pending request for this key
      const existingRequest = this.batchQueue.find((item) => item.key === key);

      if (existingRequest) {
        // Return the existing promise
        existingRequest.promise.then(resolve).catch(reject);
        return;
      }

      // Create new batch entry
      const batchEntry = {
        key,
        promise: apiCall(),
        resolve,
        reject,
      };

      this.batchQueue.push(batchEntry);

      // Clear existing timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      // Set new timeout
      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, delay);
    });
  }

  private static async processBatch() {
    const queue = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    for (const item of queue) {
      try {
        const result = await item.promise;
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }
  }
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(operationName: string) {
  const startTime = useRef<number>(0);
  const [metrics, setMetrics] = useState<{
    duration: number;
    memoryUsage?: number;
  } | null>(null);

  const startTiming = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const endTiming = useCallback(() => {
    const duration = performance.now() - startTime.current;
    const memoryUsage = (performance as any).memory?.usedJSHeapSize;

    setMetrics({ duration, memoryUsage });

    if (duration > 100) {
      console.warn(
        `🐌 Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`
      );
    }
  }, [operationName]);

  return { startTiming, endTiming, metrics };
}

/**
 * Memory optimization hook
 */
export function useMemoryOptimization() {
  const cleanupFunctions = useRef<Array<() => void>>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  const cleanup = useCallback(() => {
    cleanupFunctions.current.forEach((fn) => fn());
    cleanupFunctions.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { addCleanup, cleanup };
}

/**
 * Component performance monitoring
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  static startTiming(operation: string): () => void {
    const startTime = Date.now();

    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, []);
      }

      this.metrics.get(operation)!.push(duration);

      // Log slow operations
      if (duration > 2000) {
        console.warn(
          `🐌 Slow operation detected: ${operation} took ${duration}ms`
        );
      }
    };
  }

  static getMetrics(): Record<
    string,
    { avg: number; max: number; count: number }
  > {
    const result: Record<string, { avg: number; max: number; count: number }> =
      {};

    for (const [key, values] of this.metrics.entries()) {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const max = Math.max(...values);

      result[key] = { avg, max, count: values.length };
    }

    return result;
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}

export default {
  useDebounce,
  useThrottledCallback,
  useExpensiveCalculation,
  useVirtualScroll,
  useLazyImage,
  usePerformanceMonitor,
  useMemoryOptimization,
  ApiBatcher,
  PerformanceMonitor,
};
