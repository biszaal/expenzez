import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { WidgetSnapshot } from "../services/widget";
import { COLORS, cardRoot, flameTier } from "./theme";
import { SignedOut } from "./SignedOut";

const DEEP_LINK = "expenzez://progress";

export function StreakWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  if (!snapshot.loggedIn) return <SignedOut uri={DEEP_LINK} />;

  const { streak } = snapshot;
  const flame = flameTier(streak.current);
  const best = streak.best ?? 0;
  const xpInto = streak.xpIntoLevel ?? 0;
  const xpPer = streak.xpPerLevel ?? 100;
  const xpProgress = Math.max(0, Math.min(1, xpPer > 0 ? xpInto / xpPer : 0));

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
          text="STREAK"
          style={{ fontSize: 12, color: COLORS.muted, fontWeight: "600", letterSpacing: 1 }}
        />
        {best > 0 ? (
          <TextWidget
            text={`Best ${best}`}
            style={{ fontSize: 11, color: COLORS.muted, fontWeight: "600" }}
          />
        ) : null}
      </FlexWidget>
      <FlexWidget style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 4 }}>
        <TextWidget text="🔥" style={{ fontSize: flame.size, color: flame.color }} />
        <TextWidget
          text={` ${streak.current}`}
          style={{ fontSize: 36, color: COLORS.white, fontWeight: "700" }}
        />
        <TextWidget
          text={streak.current === 1 ? " day" : " days"}
          style={{ fontSize: 13, color: COLORS.muted, fontWeight: "500", marginBottom: 7 }}
        />
      </FlexWidget>
      {streak.current === 0 ? (
        <TextWidget
          text="Log a spend today to start one!"
          style={{ fontSize: 11, color: COLORS.amber, fontWeight: "600", marginTop: 4 }}
        />
      ) : null}
      <FlexWidget
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "match_parent",
          marginTop: 8,
        }}
      >
        <TextWidget
          text={`★ Level ${streak.level}`}
          style={{ fontSize: 13, color: COLORS.mint, fontWeight: "600" }}
        />
        <TextWidget
          text={`${Math.round(xpInto)}/${Math.round(xpPer)} XP`}
          style={{ fontSize: 11, color: COLORS.muted, fontWeight: "500" }}
        />
      </FlexWidget>
      {/* XP progress toward the next level. */}
      <FlexWidget
        style={{
          width: "match_parent",
          height: 5,
          borderRadius: 3,
          backgroundColor: COLORS.track,
          flexDirection: "row",
          marginTop: 6,
        }}
      >
        <FlexWidget
          style={{ height: 5, borderRadius: 3, backgroundColor: COLORS.mint, flex: Math.max(0.001, xpProgress) }}
        />
        <FlexWidget style={{ height: 5, flex: Math.max(0.001, 1 - xpProgress) }} />
      </FlexWidget>
    </FlexWidget>
  );
}
