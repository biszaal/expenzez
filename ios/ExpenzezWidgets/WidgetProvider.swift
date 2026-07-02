//
//  WidgetProvider.swift
//  ExpenzezWidgets
//
//  Shared timeline provider. "Snapshot only" design: each entry simply mirrors
//  the latest snapshot the app wrote; the app calls reloadAllTimelines() after
//  every refresh. A ~2h refresh hint acts as a safety net if the app never runs.
//
import WidgetKit
import SwiftUI

struct SnapshotEntry: TimelineEntry {
  let date: Date
  let snapshot: WidgetSnapshot
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> SnapshotEntry {
    SnapshotEntry(date: Date(), snapshot: .placeholder)
  }

  func getSnapshot(in context: Context, completion: @escaping (SnapshotEntry) -> Void) {
    let snapshot = context.isPreview ? .placeholder : (WidgetSnapshot.load() ?? .placeholder)
    completion(SnapshotEntry(date: Date(), snapshot: snapshot))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SnapshotEntry>) -> Void) {
    let entry = SnapshotEntry(date: Date(), snapshot: WidgetSnapshot.load() ?? .placeholder)
    let next = Calendar.current.date(byAdding: .hour, value: 2, to: Date()) ?? Date().addingTimeInterval(7200)
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

/// Shown on every widget when the user is signed out.
struct SignedOutView: View {
  let palette: WidgetPalette

  var body: some View {
    VStack(spacing: 6) {
      Image(systemName: "lock.fill")
        .font(.system(size: 18, weight: .semibold))
        .foregroundColor(.exCobalt)
      Text("Sign in to Expenzez")
        .font(.system(size: 12, weight: .medium))
        .foregroundColor(palette.text.opacity(0.85))
        .multilineTextAlignment(.center)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}
