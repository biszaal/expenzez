import { useEffect } from "react";
import { usePathname } from "expo-router";
import { analyticsService } from "../services/analytics";

/**
 * Hook to automatically track screen views
 * Add to root layout for automatic tracking
 */
export function useScreenTracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      // Convert pathname to readable screen name
      const screenName = pathname === "/" ? "Home" : formatScreenName(pathname);
      analyticsService.logScreenView(screenName);
    }
  }, [pathname]);
}

/**
 * Format pathname to readable screen name
 * /transactions -> Transactions
 * /(tabs)/spending -> Spending
 */
function formatScreenName(pathname: string): string {
  return pathname
    .replace(/^\/(tabs\/)?/, "") // Remove leading slash and (tabs)
    .replace(/\(.*?\)\//g, "") // Remove route groups like (tabs)/
    .split("/")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" - ") || "Unknown";
}

/**
 * Hook to get analytics service instance
 */
export function useAnalytics() {
  return analyticsService;
}
