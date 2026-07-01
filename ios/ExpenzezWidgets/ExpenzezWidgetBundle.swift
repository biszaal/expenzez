//
//  ExpenzezWidgetBundle.swift
//  ExpenzezWidgets
//
//  Entry point for the widget extension — registers all Expenzez widgets.
//
import WidgetKit
import SwiftUI

@main
struct ExpenzezWidgetBundle: WidgetBundle {
  var body: some Widget {
    BalanceWidget()
    BudgetWidget()
    StreakWidget()
  }
}
