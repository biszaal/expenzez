//
//  StreakWidget.swift
//  ExpenzezWidgets
//
//  Gamification: streak flame that grows with the streak, best-ever streak,
//  and XP progress toward the next level. Tapping opens Progress.
//  No financial amounts, so it ignores the hide-amounts setting.
//
import WidgetKit
import SwiftUI

struct StreakWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: SnapshotEntry

  private var s: WidgetSnapshot { entry.snapshot }

  private var xpInto: Double { s.streak.xpIntoLevel ?? 0 }
  private var xpPer: Double { s.streak.xpPerLevel ?? 100 }
  private var xpProgress: Double {
    xpPer > 0 ? min(1.0, max(0.0, xpInto / xpPer)) : 0
  }

  var body: some View {
    Group {
      if !s.loggedIn {
        SignedOutView()
      } else {
        content
      }
    }
    .exWidgetBackground(.exNavy)
    .widgetURL(URL(string: "expenzez://progress"))
  }

  private var content: some View {
    VStack(alignment: .leading, spacing: family == .systemSmall ? 5 : 8) {
      HStack(spacing: 6) {
        Image(systemName: "flame.fill")
          .font(.system(size: 13, weight: .semibold))
          .foregroundColor(FlameTier.color(s.streak.current))
        Text("Streak")
          .font(.system(size: 12, weight: .semibold))
          .foregroundColor(.white.opacity(0.7))
        Spacer()
        if let best = s.streak.best, best > 0 {
          HStack(spacing: 3) {
            Image(systemName: "trophy.fill")
              .font(.system(size: 9, weight: .semibold))
            Text("Best \(best)")
              .font(.system(size: 11, weight: .semibold))
          }
          .foregroundColor(.white.opacity(0.5))
        }
      }

      HStack(alignment: .firstTextBaseline, spacing: 5) {
        Image(systemName: "flame.fill")
          .font(.system(size: FlameTier.size(s.streak.current), weight: .bold))
          .foregroundColor(FlameTier.color(s.streak.current))
        Text("\(s.streak.current)")
          .font(.system(size: family == .systemSmall ? 32 : 42, weight: .bold, design: .rounded))
          .foregroundColor(.white)
        Text(s.streak.current == 1 ? "day" : "days")
          .font(.system(size: 13, weight: .medium))
          .foregroundColor(.white.opacity(0.7))
      }

      if s.streak.current == 0 {
        Text("Log a spend today to start one!")
          .font(.system(size: 10, weight: .semibold))
          .foregroundColor(.exAmber)
          .lineLimit(1)
          .minimumScaleFactor(0.8)
      }

      Spacer(minLength: 0)

      HStack(spacing: 5) {
        Image(systemName: "star.fill")
          .font(.system(size: 10, weight: .semibold))
          .foregroundColor(.exMint)
        Text("Level \(s.streak.level)")
          .font(.system(size: 11, weight: .semibold))
          .foregroundColor(.exMint)
        Spacer()
        Text("\(Int(xpInto.rounded()))/\(Int(xpPer.rounded())) XP")
          .font(.system(size: 10, weight: .medium))
          .foregroundColor(.white.opacity(0.5))
      }

      GeometryReader { geo in
        ZStack(alignment: .leading) {
          Capsule().fill(Color.white.opacity(0.12))
          Capsule().fill(Color.exMint)
            .frame(width: max(3, geo.size.width * xpProgress))
        }
      }
      .frame(height: 5)
    }
    .padding(family == .systemSmall ? 14 : 18)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

struct StreakWidget: Widget {
  let kind = "StreakWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      StreakWidgetView(entry: entry)
    }
    .configurationDisplayName("Streak")
    .description("Your streak, best run and progress to the next level.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
