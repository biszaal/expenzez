// Custom entry point.
//
// Loads the normal expo-router app, then (Android only) registers the
// home-screen widget task handler and wires the app's snapshot updates to
// re-render widgets. Guarded to Android so the Android-only native module is
// never loaded on iOS.
import "expo-router/entry";
import { Platform } from "react-native";

if (Platform.OS === "android") {
  const { registerWidgetTaskHandler } = require("react-native-android-widget");
  const { widgetTaskHandler } = require("./widgets/widget-task-handler");
  const { reloadAndroidWidgets } = require("./widgets/reload");
  const { setAndroidReloader } = require("./services/widget");

  registerWidgetTaskHandler(widgetTaskHandler);
  setAndroidReloader(reloadAndroidWidgets);
}
