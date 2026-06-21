import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * AdErrorBoundary — wraps the native AdMob views (BannerAd / NativeAdView) so a
 * render/commit error from the ad SDK can NEVER take down the whole screen. If
 * an ad view throws, this catches it and renders nothing (no ad) instead of
 * bubbling up to the app-wide "Something went wrong" boundary.
 *
 * Ad views are third-party native components that can throw for reasons outside
 * our control (SDK quirks, malformed creatives, version mismatches). For a
 * monetisation feature, the correct failure mode is "show no ad", never "crash
 * the app", so we swallow the error and move on.
 */
export default class AdErrorBoundary extends React.Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown) {
    console.log(
      "[Ads] ad view render error (contained, no ad shown):",
      (error as any)?.message || error
    );
  }

  override render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
