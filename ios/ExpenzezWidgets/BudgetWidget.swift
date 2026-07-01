//
//  BudgetWidget.swift
//  ExpenzezWidgets
//
//  This month's spend vs budget with a progress bar. Tapping opens Spending.
//
import WidgetKit
import SwiftUI

struct BudgetWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: SnapshotEntry

  private var s: WidgetSnapshot { entry.snapshot }

  var body: some View {
    Group {
      if !s.loggedIn {
        SignedOutView()
      } else if s.budget.limit <= 0 {
        noBudget
      } else {
        content
      }
    }
    .exWidgetBackground(.exNavy)
    .widgetURL(URL(string: "expenzez://spending"))
  }

  private var progress: Double {
    min(1.0, max(0.0, s.budget.progressPct / 100.0))
  }

  private var barColor: Color {
    s.budget.overBudget ? .exCoral : .exCobalt
  }

  private var noBudget: some View {
    VStack(spacing: 6) {
      Image(systemName: "target")
        .font(.system(size: 18, weight: .semibold))
        .foregroundColor(.exCobalt)
      Text("Set a monthly budget")
        .font(.system(size: 12, weight: .medium))
        .foregroundColor(.white.opacity(0.85))
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }

  private var content: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack(spacing: 6) {
        Image(systemName: "chart.pie.fill")
          .font(.system(size: 12, weight: .semibold))
          .foregroundColor(.exCobalt)
        Text("This month")
          .font(.system(size: 12, weight: .semibold))
          .foregroundColor(.white.opacity(0.7))
        Spacer()
        if s.budget.overBudget {
          Text("Over")
            .font(.system(size: 10, weight: .bold))
            .foregroundColor(.exCoral)
        }
      }

      Text(WidgetFormat.amount(s.budget.spent, symbol: s.currency.symbol, hidden: s.hideAmounts))
        .font(.system(size: family == .systemSmall ? 22 : 28, weight: .bold, design: .rounded))
        .foregroundColor(.white)
        .minimumScaleFactor(0.6)
        .lineLimit(1)

      GeometryReader { geo in
        ZStack(alignment: .leading) {
          Capsule().fill(Color.white.opacity(0.15))
          Capsule().fill(barColor)
            .frame(width: max(6, geo.size.width * progress))
        }
      }
      .frame(height: 8)

      Text(footerText)
        .font(.system(size: 11, weight: .medium))
        .foregroundColor(.white.opacity(0.7))
        .lineLimit(1)
        .minimumScaleFactor(0.7)

      Spacer(minLength: 0)
    }
    .padding(family == .systemSmall ? 14 : 18)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  private var footerText: String {
    let limit = WidgetFormat.amount(s.budget.limit, symbol: s.currency.symbol, hidden: s.hideAmounts)
    if s.hideAmounts {
      return "of \(limit) budget"
    }
    if s.budget.overBudget {
      let over = WidgetFormat.amount(abs(s.budget.remaining), symbol: s.currency.symbol, hidden: false)
      return "\(over) over \(limit)"
    }
    let left = WidgetFormat.amount(s.budget.remaining, symbol: s.currency.symbol, hidden: false)
    return "\(left) left of \(limit)"
  }
}

struct BudgetWidget: Widget {
  let kind = "BudgetWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      BudgetWidgetView(entry: entry)
    }
    .configurationDisplayName("Budget")
    .description("Track this month's spend against your budget.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
