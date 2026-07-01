import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { WidgetSnapshot } from "../services/widget";
import { COLORS, cardRoot, formatAmount, trendLabel } from "./theme";
import { SignedOut } from "./SignedOut";

const DEEP_LINK = "expenzez://";

export function BalanceWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  if (!snapshot.loggedIn) return <SignedOut uri={DEEP_LINK} />;

  const { balance, currency, hideAmounts } = snapshot;
  const trendColor =
    balance.trendDir === "up"
      ? COLORS.mint
      : balance.trendDir === "down"
      ? COLORS.coral
      : COLORS.muted;
  const arrow =
    balance.trendDir === "up" ? "▲" : balance.trendDir === "down" ? "▼" : "–";

  return (
    <FlexWidget clickAction="OPEN_URI" clickActionData={{ uri: DEEP_LINK }} style={cardRoot}>
      <TextWidget
        text="BALANCE"
        style={{ fontSize: 12, color: COLORS.muted, fontWeight: "600", letterSpacing: 1 }}
      />
      <TextWidget
        text={formatAmount(balance.amount, currency.symbol, hideAmounts)}
        maxLines={1}
        style={{ fontSize: 30, color: COLORS.white, fontWeight: "700", marginTop: 6 }}
      />
      {!hideAmounts ? (
        <TextWidget
          text={`${arrow} ${trendLabel(balance.trendPct)}`}
          style={{ fontSize: 13, color: trendColor, fontWeight: "600", marginTop: 6 }}
        />
      ) : null}
    </FlexWidget>
  );
}
