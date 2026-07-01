import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { WidgetSnapshot } from "../services/widget";
import { COLORS, cardRoot, formatAmount } from "./theme";
import { SignedOut } from "./SignedOut";

const DEEP_LINK = "expenzez://spending";

export function BudgetWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  if (!snapshot.loggedIn) return <SignedOut uri={DEEP_LINK} />;

  const { budget, currency, hideAmounts } = snapshot;

  if (budget.limit <= 0) {
    return (
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: DEEP_LINK }}
        style={{ ...cardRoot, justifyContent: "center", alignItems: "center" }}
      >
        <TextWidget
          text="Set a monthly budget"
          style={{ fontSize: 13, color: COLORS.white, fontWeight: "600", textAlign: "center" }}
        />
      </FlexWidget>
    );
  }

  const progress = Math.max(0, Math.min(1, budget.progressPct / 100));
  const barColor = budget.overBudget ? COLORS.coral : COLORS.cobalt;
  const limitText = formatAmount(budget.limit, currency.symbol, hideAmounts);
  const footer = hideAmounts
    ? `of ${limitText} budget`
    : budget.overBudget
    ? `${formatAmount(Math.abs(budget.remaining), currency.symbol, false)} over ${limitText}`
    : `${formatAmount(budget.remaining, currency.symbol, false)} left of ${limitText}`;

  return (
    <FlexWidget clickAction="OPEN_URI" clickActionData={{ uri: DEEP_LINK }} style={cardRoot}>
      <TextWidget
        text="THIS MONTH"
        style={{ fontSize: 12, color: COLORS.muted, fontWeight: "600", letterSpacing: 1 }}
      />
      <TextWidget
        text={formatAmount(budget.spent, currency.symbol, hideAmounts)}
        maxLines={1}
        style={{ fontSize: 26, color: COLORS.white, fontWeight: "700", marginTop: 4 }}
      />
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
          style={{ height: 8, borderRadius: 4, backgroundColor: barColor, flex: Math.max(0.001, progress) }}
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
