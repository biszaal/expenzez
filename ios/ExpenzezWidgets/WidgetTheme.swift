//
//  WidgetTheme.swift
//  ExpenzezWidgets
//
//  Brand colors and shared formatting helpers for the widgets.
//
import SwiftUI

extension Color {
  static let exCobalt = Color(red: 0x25 / 255, green: 0x47 / 255, blue: 0xF0 / 255)
  static let exMint = Color(red: 0x13 / 255, green: 0xA0 / 255, blue: 0x6B / 255)
  static let exCoral = Color(red: 0xE0 / 255, green: 0x45 / 255, blue: 0x5A / 255)
  static let exAmber = Color(red: 0xF5 / 255, green: 0xA6 / 255, blue: 0x23 / 255)
  static let exNavy = Color(red: 0x0A / 255, green: 0x12 / 255, blue: 0x26 / 255)
  static let exCardDark = Color(red: 0x12 / 255, green: 0x1C / 255, blue: 0x38 / 255)
}

enum WidgetFormat {
  /// Mask token shown when amounts are hidden (privacy default).
  static let masked = "••••"

  /// Format a money value with the user's currency symbol, or mask it.
  static func amount(_ value: Double, symbol: String, hidden: Bool) -> String {
    if hidden { return masked }
    let formatter = NumberFormatter()
    formatter.numberStyle = .decimal
    formatter.groupingSeparator = ","
    formatter.maximumFractionDigits = value == value.rounded() ? 0 : 2
    formatter.minimumFractionDigits = 0
    let number = formatter.string(from: NSNumber(value: value)) ?? "\(value)"
    return symbol + number
  }

  /// Signed percentage label for the balance trend.
  static func trend(_ pct: Double, hidden: Bool) -> String {
    if hidden { return "" }
    let sign = pct > 0 ? "+" : ""
    return "\(sign)\(String(format: "%.1f", pct))%"
  }

  /// "just now" / "12m ago" / "3h ago" / "2d ago" from a JS ISO timestamp.
  static func timeAgo(_ iso: String) -> String? {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    guard let then = formatter.date(from: iso) else { return nil }
    let mins = max(0, Int((Date().timeIntervalSince(then) / 60).rounded()))
    if mins < 1 { return "just now" }
    if mins < 60 { return "\(mins)m ago" }
    let hrs = Int((Double(mins) / 60).rounded())
    if hrs < 24 { return "\(hrs)h ago" }
    return "\(Int((Double(hrs) / 24).rounded()))d ago"
  }
}

/// Spend pace vs how far through the month we are. Mirrors widgets/theme.ts.
struct BudgetPace {
  enum State { case onTrack, watch, over }
  let daysLeft: Int
  let safePerDay: Double
  let state: State

  var label: String {
    switch state {
    case .over: return "Over budget"
    case .watch: return "Watch it"
    case .onTrack: return "On track"
    }
  }

  var color: Color {
    switch state {
    case .over: return .exCoral
    case .watch: return .exAmber
    case .onTrack: return .exMint
    }
  }

  init(budget: WidgetBudgetData) {
    let cal = Calendar.current
    let now = Date()
    let day = cal.component(.day, from: now)
    let daysInMonth = cal.range(of: .day, in: .month, for: now)?.count ?? 30
    daysLeft = daysInMonth - day + 1
    safePerDay = max(0, budget.remaining) / Double(daysLeft)
    let elapsedPct = Double(day) / Double(daysInMonth) * 100
    if budget.overBudget {
      state = .over
    } else if budget.progressPct > elapsedPct + 10 {
      state = .watch
    } else {
      state = .onTrack
    }
  }
}

/// Flame sizing/colour tier — the streak "grows" as it gets longer.
enum FlameTier {
  static func size(_ streak: Int) -> CGFloat {
    if streak >= 30 { return 30 }
    if streak >= 7 { return 26 }
    if streak >= 1 { return 22 }
    return 18
  }

  static func color(_ streak: Int) -> Color {
    if streak >= 30 { return .exCoral }
    if streak >= 1 { return .exAmber }
    return Color.white.opacity(0.35)
  }
}

extension View {
  /// Fill the widget with a background. iOS 17 requires `containerBackground`;
  /// earlier versions get a ZStack fallback.
  @ViewBuilder
  func exWidgetBackground(_ color: Color) -> some View {
    if #available(iOS 17.0, *) {
      self.containerBackground(color, for: .widget)
    } else {
      ZStack {
        color
        self
      }
    }
  }
}
