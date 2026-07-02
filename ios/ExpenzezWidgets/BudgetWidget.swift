//
//  BudgetWidget.swift
//  ExpenzezWidgets
//
//  This month's spend vs budget with a pace state ("On track" / "Watch it" /
//  "Over budget"), a progress ring (small) or bar (medium), and a safe-to-spend
//  per-day figure. Tapping opens Spending.
//
import WidgetKit
import SwiftUI

struct BudgetWidgetView: View {
  @Environment(\.widgetFamily) var family
  @Environment(\.colorScheme) var systemScheme
  let entry: SnapshotEntry

  private var s: WidgetSnapshot { entry.snapshot }
  private var p: WidgetPalette { .resolve(s.theme, system: systemScheme) }
  private var pace: BudgetPace { BudgetPace(budget: s.budget) }

  var body: some View {
    Group {
      if !s.loggedIn {
        SignedOutView(palette: p)
      } else if s.budget.limit <= 0 {
        noBudget
      } else if family == .systemSmall {
        smallContent
      } else {
        mediumContent
      }
    }
    .exWidgetBackground(p.bg)
    .widgetURL(URL(string: "expenzez://spending"))
  }

  private var progress: Double {
    min(1.0, max(0.0, s.budget.progressPct / 100.0))
  }

  private var noBudget: some View {
    VStack(spacing: 6) {
      Image(systemName: "target")
        .font(.system(size: 20, weight: .semibold))
        .foregroundColor(.exCobalt)
      Text("Set a monthly budget")
        .font(.system(size: 12, weight: .semibold))
        .foregroundColor(p.text.opacity(0.9))
      Text("Tap to get started")
        .font(.system(size: 10, weight: .medium))
        .foregroundColor(p.textFaint)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }

  private var headerLabel: String {
    (s.monthLabel ?? "This month") + " budget"
  }

  private var footerText: String {
    let daysLeft = "\(pace.daysLeft) day\(pace.daysLeft == 1 ? "" : "s") left"
    if s.hideAmounts {
      return "\(Int(s.budget.progressPct.rounded()))% used · \(daysLeft)"
    }
    if s.budget.overBudget {
      let over = WidgetFormat.amount(abs(s.budget.remaining), symbol: s.currency.symbol, hidden: false)
      return "\(over) over · \(daysLeft)"
    }
    let safe = WidgetFormat.amount(pace.safePerDay, symbol: s.currency.symbol, hidden: false)
    return "\(safe)/day safe · \(daysLeft)"
  }

  // MARK: Small — progress ring

  private var smallContent: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack(spacing: 5) {
        Image(systemName: "chart.pie.fill")
          .font(.system(size: 11, weight: .semibold))
          .foregroundColor(.exCobalt)
        Text(headerLabel)
          .font(.system(size: 11, weight: .semibold))
          .foregroundColor(p.textMuted)
          .lineLimit(1)
          .minimumScaleFactor(0.8)
        Spacer()
      }

      HStack {
        Spacer()
        ZStack {
          Circle()
            .stroke(p.track, lineWidth: 7)
          Circle()
            .trim(from: 0, to: CGFloat(progress))
            .stroke(pace.color, style: StrokeStyle(lineWidth: 7, lineCap: .round))
            .rotationEffect(.degrees(-90))
          VStack(spacing: 0) {
            Text("\(Int(s.budget.progressPct.rounded()))%")
              .font(.system(size: 17, weight: .bold, design: .rounded))
              .foregroundColor(p.text)
              .minimumScaleFactor(0.7)
            Text(pace.label)
              .font(.system(size: 8, weight: .semibold))
              .foregroundColor(pace.color)
              .lineLimit(1)
              .minimumScaleFactor(0.7)
          }
          .padding(.horizontal, 6)
        }
        .frame(width: 74, height: 74)
        Spacer()
      }

      Spacer(minLength: 0)

      Text(footerText)
        .font(.system(size: 10, weight: .medium))
        .foregroundColor(p.textMuted)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
        .frame(maxWidth: .infinity, alignment: .center)
    }
    .padding(12)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  // MARK: Medium — bar + pace chip

  private var mediumContent: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack(spacing: 6) {
        Image(systemName: "chart.pie.fill")
          .font(.system(size: 12, weight: .semibold))
          .foregroundColor(.exCobalt)
        Text(headerLabel)
          .font(.system(size: 12, weight: .semibold))
          .foregroundColor(p.textMuted)
        Spacer()
        Text(pace.label)
          .font(.system(size: 10, weight: .bold))
          .foregroundColor(pace.color)
          .padding(.horizontal, 8)
          .padding(.vertical, 3)
          .background(Capsule().fill(pace.color.opacity(0.15)))
      }

      HStack(alignment: .firstTextBaseline, spacing: 5) {
        Text(WidgetFormat.amount(s.budget.spent, symbol: s.currency.symbol, hidden: s.hideAmounts))
          .font(.system(size: 28, weight: .bold, design: .rounded))
          .foregroundColor(p.text)
          .minimumScaleFactor(0.6)
          .lineLimit(1)
        Text("of \(WidgetFormat.amount(s.budget.limit, symbol: s.currency.symbol, hidden: s.hideAmounts))")
          .font(.system(size: 13, weight: .medium))
          .foregroundColor(p.textMuted)
      }

      GeometryReader { geo in
        ZStack(alignment: .leading) {
          Capsule().fill(p.track)
          Capsule().fill(pace.color)
            .frame(width: max(6, geo.size.width * progress))
        }
      }
      .frame(height: 8)

      Text(footerText)
        .font(.system(size: 11, weight: .medium))
        .foregroundColor(p.textMuted)
        .lineLimit(1)
        .minimumScaleFactor(0.7)

      Spacer(minLength: 0)
    }
    .padding(18)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

struct BudgetWidget: Widget {
  let kind = "BudgetWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      BudgetWidgetView(entry: entry)
    }
    .configurationDisplayName("Budget")
    .description("Spend pace, safe-to-spend per day, and days left this month.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
