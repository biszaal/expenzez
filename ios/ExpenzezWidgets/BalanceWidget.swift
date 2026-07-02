//
//  BalanceWidget.swift
//  ExpenzezWidgets
//
//  Total balance with a trend chip, this month's spend and top category.
//  Tapping opens the app home.
//
import WidgetKit
import SwiftUI

struct BalanceWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: SnapshotEntry

  private var s: WidgetSnapshot { entry.snapshot }

  var body: some View {
    Group {
      if !s.loggedIn {
        SignedOutView()
      } else {
        content
      }
    }
    .exWidgetBackground(.exNavy)
    .widgetURL(URL(string: "expenzez://"))
  }

  private var trendColor: Color {
    switch s.balance.trendDir {
    case "up": return .exMint
    case "down": return .exCoral
    default: return .white.opacity(0.6)
    }
  }

  private var trendIcon: String {
    switch s.balance.trendDir {
    case "up": return "arrow.up.right"
    case "down": return "arrow.down.right"
    default: return "minus"
    }
  }

  private var spendLine: String {
    let spent = WidgetFormat.amount(
      s.balance.monthSpend ?? 0, symbol: s.currency.symbol, hidden: s.hideAmounts)
    var line = "Spent \(spent) this month"
    if family != .systemSmall, let top = s.budget.topCategory {
      line += " · Most: \(top.name)"
    }
    return line
  }

  private var content: some View {
    VStack(alignment: .leading, spacing: family == .systemSmall ? 5 : 8) {
      HStack(spacing: 6) {
        Image(systemName: "wallet.pass.fill")
          .font(.system(size: 12, weight: .semibold))
          .foregroundColor(.exCobalt)
        Text("Balance")
          .font(.system(size: 12, weight: .semibold))
          .foregroundColor(.white.opacity(0.7))
        Spacer()
        HStack(spacing: 3) {
          Image(systemName: trendIcon)
            .font(.system(size: 9, weight: .bold))
          Text(WidgetFormat.trend(s.balance.trendPct, hidden: false))
            .font(.system(size: 11, weight: .bold))
        }
        .foregroundColor(trendColor)
        .padding(.horizontal, 7)
        .padding(.vertical, 3)
        .background(Capsule().fill(trendColor.opacity(0.15)))
      }

      Text(WidgetFormat.amount(s.balance.amount, symbol: s.currency.symbol, hidden: s.hideAmounts))
        .font(.system(size: family == .systemSmall ? 26 : 34, weight: .bold, design: .rounded))
        .foregroundColor(.white)
        .minimumScaleFactor(0.6)
        .lineLimit(1)

      Text(spendLine)
        .font(.system(size: 11, weight: .medium))
        .foregroundColor(.white.opacity(0.65))
        .lineLimit(1)
        .minimumScaleFactor(0.8)

      if let updated = WidgetFormat.timeAgo(s.updatedAt) {
        Text("Updated \(updated)")
          .font(.system(size: 9, weight: .regular))
          .foregroundColor(.white.opacity(0.4))
      }

      Spacer(minLength: 0)
    }
    .padding(family == .systemSmall ? 14 : 18)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

struct BalanceWidget: Widget {
  let kind = "BalanceWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      BalanceWidgetView(entry: entry)
    }
    .configurationDisplayName("Balance")
    .description("Your balance, trend and this month's spend at a glance.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
