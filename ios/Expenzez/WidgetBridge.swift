//
//  WidgetBridge.swift
//  Expenzez
//
//  Native module that lets the React Native app push the widget snapshot into
//  the shared App Group store and ask WidgetKit to re-render the home-screen
//  widgets. Paired with WidgetBridge.m (RCT_EXTERN_MODULE) and consumed from JS
//  via NativeModules.WidgetBridge (see services/widget/widgetBridge.ts).
//
import Foundation
import WidgetKit

@objc(WidgetBridge)
class WidgetBridge: NSObject {

  // Must match the App Group on both the app and the widget extension, and the
  // key the widget reads in ExpenzezWidgets/WidgetSnapshot.swift.
  private let appGroup = "group.com.biszaal.expenzez"
  private let snapshotKey = "widget_snapshot"

  /// Persist the snapshot JSON into the App Group's UserDefaults.
  @objc(setSnapshot:resolver:rejecter:)
  func setSnapshot(_ json: String,
                   resolver resolve: RCTPromiseResolveBlock,
                   rejecter reject: RCTPromiseRejectBlock) {
    guard let defaults = UserDefaults(suiteName: appGroup) else {
      reject("no_app_group", "App Group \(appGroup) is unavailable", nil)
      return
    }
    defaults.set(json, forKey: snapshotKey)
    resolve(nil)
  }

  /// Ask WidgetKit to reload every widget timeline (no-op before iOS 14).
  @objc(reloadAll:rejecter:)
  func reloadAll(_ resolve: RCTPromiseResolveBlock,
                 rejecter reject: RCTPromiseRejectBlock) {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
    resolve(nil)
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
