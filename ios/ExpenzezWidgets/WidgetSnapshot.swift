//
//  WidgetSnapshot.swift
//  ExpenzezWidgets
//
//  Decodes the snapshot the app writes into the shared App Group store. Keep in
//  sync with services/widget/types.ts (WidgetSnapshot).
//
import Foundation

struct WidgetCurrency: Codable {
  let code: String
  let symbol: String
}

struct WidgetBalanceData: Codable {
  let amount: Double
  let prevAmount: Double
  let trendPct: Double
  let trendDir: String // "up" | "down" | "flat"
  // v2 — optional so a v1 snapshot still decodes after an app update.
  let monthSpend: Double?
}

struct WidgetTopCategory: Codable {
  let name: String
  let spent: Double
}

struct WidgetBudgetData: Codable {
  let spent: Double
  let limit: Double
  let remaining: Double
  let progressPct: Double
  let overBudget: Bool
  // v2
  let topCategory: WidgetTopCategory?
}

struct WidgetStreakData: Codable {
  let current: Int
  let level: Int
  // v2
  let best: Int?
  let xpIntoLevel: Double?
  let xpPerLevel: Double?
}

struct WidgetSnapshot: Codable {
  let v: Int
  let updatedAt: String
  let loggedIn: Bool
  let currency: WidgetCurrency
  let hideAmounts: Bool
  // v2
  let monthLabel: String?
  let balance: WidgetBalanceData
  let budget: WidgetBudgetData
  let streak: WidgetStreakData

  // Must match WidgetBridge.swift on the app side.
  static let appGroup = "group.com.biszaal.expenzez"
  static let key = "widget_snapshot"

  /// Read the latest snapshot from the App Group, or nil if none/invalid.
  static func load() -> WidgetSnapshot? {
    guard
      let defaults = UserDefaults(suiteName: appGroup),
      let json = defaults.string(forKey: key),
      let data = json.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
  }

  /// Sample data for the widget gallery / placeholder state.
  static var placeholder: WidgetSnapshot {
    WidgetSnapshot(
      v: 2,
      updatedAt: "",
      loggedIn: true,
      currency: WidgetCurrency(code: "GBP", symbol: "£"),
      hideAmounts: false,
      monthLabel: nil,
      balance: WidgetBalanceData(
        amount: 1234.56, prevAmount: 1180, trendPct: 4.6, trendDir: "up", monthSpend: 412),
      budget: WidgetBudgetData(
        spent: 820, limit: 2000, remaining: 1180, progressPct: 41, overBudget: false,
        topCategory: WidgetTopCategory(name: "Groceries", spent: 160)),
      streak: WidgetStreakData(current: 5, level: 3, best: 12, xpIntoLevel: 40, xpPerLevel: 100)
    )
  }
}
