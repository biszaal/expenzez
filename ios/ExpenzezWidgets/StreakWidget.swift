//
//  StreakWidget.swift
//  ExpenzezWidgets
//
//  Gamification: current daily streak and level. Tapping opens Progress.
//  No financial amounts, so it ignores the hide-amounts setting.
//
import WidgetKit
import SwiftUI

struct StreakWidgetView: View {
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
    .widgetURL(URL(string: "expenzez://progress"))
  }

  private var content: some View {
    VStack(alignment: .leading, spacing: family == .systemSmall ? 6 : 10) {
      HStack(spacing: 6) {
        Image(systemName: "flame.fill")
          .font(.system(size: 13, weight: .semibold))
          .foregroundColor(.exCoral)
        Text("Streak")
          .font(.system(size: 12, weight: .semibold))
          .foregroundColor(.white.opacity(0.7))
        Spacer()
      }

      HStack(alignment: .firstTextBaseline, spacing: 4) {
        Text("\(s.streak.current)")
          .font(.system(size: family == .systemSmall ? 34 : 44, weight: .bold, design: .rounded))
          .foregroundColor(.white)
        Text(s.streak.current == 1 ? "day" : "days")
          .font(.system(size: 13, weight: .medium))
          .foregroundColor(.white.opacity(0.7))
      }

      HStack(spacing: 5) {
        Image(systemName: "star.fill")
          .font(.system(size: 11, weight: .semibold))
          .foregroundColor(.exMint)
        Text("Level \(s.streak.level)")
          .font(.system(size: 12, weight: .semibold))
          .foregroundColor(.exMint)
      }

      Spacer(minLength: 0)
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
    .description("Keep your daily tracking streak alive.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
