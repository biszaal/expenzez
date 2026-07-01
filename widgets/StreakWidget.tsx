import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { WidgetSnapshot } from "../services/widget";
import { COLORS, cardRoot } from "./theme";
import { SignedOut } from "./SignedOut";

const DEEP_LINK = "expenzez://progress";

export function StreakWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  if (!snapshot.loggedIn) return <SignedOut uri={DEEP_LINK} />;

  const { streak } = snapshot;

  return (
    <FlexWidget clickAction="OPEN_URI" clickActionData={{ uri: DEEP_LINK }} style={cardRoot}>
      <TextWidget
        text="🔥 STREAK"
        style={{ fontSize: 12, color: COLORS.muted, fontWeight: "600", letterSpacing: 1 }}
      />
      <FlexWidget style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 4 }}>
        <TextWidget
          text={`${streak.current}`}
          style={{ fontSize: 38, color: COLORS.white, fontWeight: "700" }}
        />
        <TextWidget
          text={streak.current === 1 ? " day" : " days"}
          style={{ fontSize: 13, color: COLORS.muted, fontWeight: "500", marginBottom: 8 }}
        />
      </FlexWidget>
      <TextWidget
        text={`★ Level ${streak.level}`}
        style={{ fontSize: 13, color: COLORS.mint, fontWeight: "600", marginTop: 6 }}
      />
    </FlexWidget>
  );
}
