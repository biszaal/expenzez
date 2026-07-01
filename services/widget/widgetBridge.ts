/**
 * Native bridge for writing the widget snapshot and asking the OS to re-render.
 *
 * This file is intentionally defensive: it must be safe to call before any
 * native widget code exists. Every platform-specific path is guarded and
 * degrades to "just persist to AsyncStorage", which is always available and is
 * what Phase 1 (the data layer) is verified against.
 *
 *  - iOS: a small native module `WidgetBridge` (Swift) writes the JSON into the
 *    App Group `UserDefaults` and calls `WidgetCenter.reloadAllTimelines()`.
 *    `NativeModules.WidgetBridge` is `undefined` until that module is built.
 *  - Android: `react-native-android-widget` renders widgets from a headless JS
 *    task that reads the AsyncStorage snapshot. The actual `requestWidgetUpdate`
 *    wiring lives in the Android widget module (see `widgets/`) and is invoked
 *    via the optional `androidReloader` registered below — keeping this bridge
 *    free of a hard dependency on the (optional) library.
 */
import { Platform, NativeModules } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WIDGET_SNAPSHOT_KEY } from "./types";

interface IOSWidgetBridgeModule {
  setSnapshot: (json: string) => Promise<void>;
  reloadAll: () => Promise<void>;
}

const iosBridge: IOSWidgetBridgeModule | undefined = (NativeModules as any)
  ?.WidgetBridge;

/**
 * Android re-render hook. The Android widget module registers a function here
 * (via `setAndroidReloader`) that calls `requestWidgetUpdate` for each widget.
 * Kept as an injection point so this bridge never imports the optional library.
 */
type AndroidReloader = () => Promise<void> | void;
let androidReloader: AndroidReloader | null = null;

export function setAndroidReloader(reloader: AndroidReloader | null): void {
  androidReloader = reloader;
}

/**
 * Persist the snapshot to the shared store(s) and trigger a widget refresh.
 * Always resolves — failures are logged, never thrown, so callers (data loads,
 * settings toggles, auth) never break because of widgets.
 */
export async function writeSnapshotAndReload(json: string): Promise<void> {
  // Always keep a copy in AsyncStorage:
  //  - Android widgets render from it directly.
  //  - It is the "previous snapshot" source used to compute the balance trend.
  try {
    await AsyncStorage.setItem(WIDGET_SNAPSHOT_KEY, json);
  } catch (e) {
    console.warn("[widget] failed to persist snapshot to AsyncStorage", e);
  }

  if (Platform.OS === "ios") {
    try {
      if (iosBridge?.setSnapshot) {
        await iosBridge.setSnapshot(json);
        await iosBridge.reloadAll?.();
      }
    } catch (e) {
      console.warn("[widget] iOS bridge write failed", e);
    }
    return;
  }

  if (Platform.OS === "android") {
    try {
      await androidReloader?.();
    } catch (e) {
      console.warn("[widget] Android reload failed", e);
    }
  }
}
