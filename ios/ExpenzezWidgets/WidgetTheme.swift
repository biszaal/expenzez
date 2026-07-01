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

  /// Signed percentage label for the balance trend (hidden -> empty).
  static func trend(_ pct: Double, hidden: Bool) -> String {
    if hidden { return "" }
    let sign = pct > 0 ? "+" : ""
    return "\(sign)\(String(format: "%.1f", pct))%"
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
