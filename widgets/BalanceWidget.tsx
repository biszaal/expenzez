import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { WidgetSnapshot } from "../services/widget";
import { COLORS, cardRoot, paletteFor, formatAmount, trendLabel, timeAgo } from "./theme";
import { SignedOut } from "./SignedOut";

const DEEP_LINK = "expenzez://";

export function BalanceWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  if (!snapshot.loggedIn) return <SignedOut uri={DEEP_LINK} theme={snapshot.theme} />;

  const { balance, budget, currency, hideAmounts } = snapshot;
  const p = paletteFor(snapshot.theme);
  const trendColor =
    balance.trendDir === "up"
      ? COLORS.mint
      : balance.trendDir === "down"
      ? COLORS.coral
      : p.textMuted;
  const arrow =
    balance.trendDir === "up" ? "▲" : balance.trendDir === "down" ? "▼" : "–";

  const monthSpend = balance.monthSpend ?? 0;
  const topCategory = budget.topCategory;
  const spendLine = `Spent ${formatAmount(monthSpend, currency.symbol, hideAmounts)} this month${
    topCategory ? ` · Most: ${topCategory.name}` : ""
  }`;
  const updated = timeAgo(snapshot.updatedAt);

  return (
    <FlexWidget clickAction="OPEN_URI" clickActionData={{ uri: DEEP_LINK }} style={cardRoot(p)}>
      <FlexWidget
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "match_parent",
        }}
      >
        <TextWidget
          text="BALANCE"
          style={{ fontSize: 12, color: p.textMuted, fontWeight: "600", letterSpacing: 1 }}
        />
        <TextWidget
          text={`${arrow} ${trendLabel(balance.trendPct)}`}
          style={{ fontSize: 12, color: trendColor, fontWeight: "700" }}
        />
      </FlexWidget>
      <TextWidget
        text={formatAmount(balance.amount, currency.symbol, hideAmounts)}
        maxLines={1}
        style={{ fontSize: 32, color: p.text, fontWeight: "700", marginTop: 6 }}
      />
      <TextWidget
        text={spendLine}
        maxLines={1}
        style={{ fontSize: 12, color: p.textMuted, fontWeight: "500", marginTop: 6 }}
      />
      {updated ? (
        <TextWidget
          text={`Updated ${updated}`}
          style={{ fontSize: 10, color: p.textFaint, fontWeight: "400", marginTop: 4 }}
        />
      ) : null}
    </FlexWidget>
  );
}
