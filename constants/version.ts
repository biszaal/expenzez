import Constants from "expo-constants";

// Single source of truth for the app version.
// Reads `expo.version` from app.json at runtime — bump it there only and
// every screen that imports APP_VERSION updates automatically.
export const APP_VERSION = Constants.expoConfig?.version ?? "1.7.5";
