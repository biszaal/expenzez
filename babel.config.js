module.exports = function (api) {
  api.cache(true);

  // Only strip console.* calls in production-release bundles. Dev and local
  // builds keep logs so crash reports and local debugging remain useful.
  // Keep console.error so Sentry / native logs still capture real failures.
  const isProduction = process.env.EAS_BUILD_PROFILE === "production" ||
    process.env.BABEL_ENV === "production" ||
    process.env.NODE_ENV === "production";

  const plugins = [];
  if (isProduction) {
    plugins.push([
      "transform-remove-console",
      { exclude: ["error", "warn"] },
    ]);
  }

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
