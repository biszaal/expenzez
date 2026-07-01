/**
 * Headless task that renders each Android widget. Invoked by the OS on
 * add/update/resize; reads the persisted snapshot and renders the matching
 * widget. Clicks are handled by the built-in OPEN_URI action on each widget.
 */
import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { loadSnapshot } from "./snapshot";
import { BalanceWidget } from "./BalanceWidget";
import { BudgetWidget } from "./BudgetWidget";
import { StreakWidget } from "./StreakWidget";

const WIDGETS = {
  Balance: BalanceWidget,
  Budget: BudgetWidget,
  Streak: StreakWidget,
} as const;

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const name = props.widgetInfo.widgetName as keyof typeof WIDGETS;
  const Widget = WIDGETS[name];
  if (!Widget) return;

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const snapshot = await loadSnapshot();
      props.renderWidget(<Widget snapshot={snapshot} />);
      break;
    }
    default:
      break;
  }
}
