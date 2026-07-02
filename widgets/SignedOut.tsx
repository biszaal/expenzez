import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { WidgetSnapshot } from "../services/widget";
import { cardRoot, paletteFor } from "./theme";

/** Shared signed-out state — tapping opens the app to sign in. */
export function SignedOut({
  uri,
  theme,
}: {
  uri: string;
  theme?: WidgetSnapshot["theme"];
}) {
  const p = paletteFor(theme);
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
      style={{ ...cardRoot(p), justifyContent: "center", alignItems: "center" }}
    >
      <TextWidget
        text="Sign in to Expenzez"
        style={{ fontSize: 13, color: p.text, fontWeight: "600", textAlign: "center" }}
      />
    </FlexWidget>
  );
}
