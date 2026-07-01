/**
 * Re-render all on-screen Android widgets from the latest snapshot. Registered
 * as the app's `androidReloader` (see index.js) so `updateWidgets()` refreshes
 * the home screen whenever the app's data changes.
 */
import React from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { loadSnapshot } from "./snapshot";
import { BalanceWidget } from "./BalanceWidget";
import { BudgetWidget } from "./BudgetWidget";
import { StreakWidget } from "./StreakWidget";

const WIDGETS = [
  { name: "Balance", Component: BalanceWidget },
  { name: "Budget", Component: BudgetWidget },
  { name: "Streak", Component: StreakWidget },
] as const;

export async function reloadAndroidWidgets(): Promise<void> {
  const snapshot = await loadSnapshot();
  await Promise.all(
    WIDGETS.map(({ name, Component }) =>
      requestWidgetUpdate({
        widgetName: name,
        renderWidget: () => <Component snapshot={snapshot} />,
        widgetNotFound: () => {},
      })
    )
  );
}
