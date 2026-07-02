import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { WidgetSnapshot } from "../services/widget";
import { COLORS, cardRoot, formatAmount, budgetPace } from "./theme";
import { SignedOut } from "./SignedOut";

const DEEP_LINK = "expenzez://spending";

export function BudgetWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  if (!snapshot.loggedIn) return <SignedOut uri={DEEP_LINK} />;

  const { budget, currency, hideAmounts, monthLabel } = snapshot;

  if (budget.limit <= 0) {
    return (
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: DEEP_LINK }}
        style={{ ...cardRoot, justifyContent: "center", alignItems: "center" }}
      >
        <TextWidget text="🎯" style={{ fontSize: 22, color: COLORS.white }} />
        <TextWidget
          text="Set a monthly budget"
          style={{ fontSize: 13, color: COLORS.white, fontWeight: "600", textAlign: "center", marginTop: 6 }}
        />
        <TextWidget
          text="Tap to get started"
          style={{ fontSize: 11, color: COLORS.muted, fontWeight: "500", textAlign: "center", marginTop: 2 }}
        />
      </FlexWidget>
    );
  }

  const pace = budgetPace(budget);
  const progress = Math.max(0, Math.min(1, budget.progressPct / 100));
  const pctUsed = Math.round(budget.progressPct);
  const header = (monthLabel || "This month").toUpperCase() + " BUDGET";

  const spentText = formatAmount(budget.spent, currency.symbol, hideAmounts);
  const limitText = formatAmount(budget.limit, currency.symbol, hideAmounts);

  const footer = hideAmounts
    ? `${pctUsed}% used · ${pace.daysLeft} days left`
    : budget.overBudget
    ? `${formatAmount(Math.abs(budget.remaining), currency.symbol, false)} over · ${pace.daysLeft} days left`
    : `${formatAmount(pace.safePerDay, currency.symbol, false)}/day safe · ${pace.daysLeft} days left`;

  return (
    <FlexWidget clickAction="OPEN_URI" clickActionData={{ uri: DEEP_LINK }} style={cardRoot}>
      <FlexWidget
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "match_parent",
        }}
      >
        <TextWidget
          text={header}
          style={{ fontSize: 12, color: COLORS.muted, fontWeight: "600", letterSpacing: 1 }}
        />
        <TextWidget
          text={pace.label}
          style={{ fontSize: 11, color: pace.color, fontWeight: "700" }}
        />
      </FlexWidget>
      <FlexWidget style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 4 }}>
        <TextWidget
          text={spentText}
          maxLines={1}
          style={{ fontSize: 26, color: COLORS.white, fontWeight: "700" }}
        />
        <TextWidget
          text={` of ${limitText}`}
          maxLines={1}
          style={{ fontSize: 13, color: COLORS.muted, fontWeight: "500", marginBottom: 3 }}
        />
      </FlexWidget>
      {/* Progress bar: two flex children split by the spend ratio. */}
      <FlexWidget
        style={{
          width: "match_parent",
          height: 8,
          borderRadius: 4,
          backgroundColor: COLORS.track,
          flexDirection: "row",
          marginTop: 10,
        }}
      >
        <FlexWidget
          style={{ height: 8, borderRadius: 4, backgroundColor: pace.color, flex: Math.max(0.001, progress) }}
        />
        <FlexWidget style={{ height: 8, flex: Math.max(0.001, 1 - progress) }} />
      </FlexWidget>
      <TextWidget
        text={footer}
        maxLines={1}
        style={{ fontSize: 11, color: COLORS.muted, fontWeight: "500", marginTop: 8 }}
      />
    </FlexWidget>
  );
}
