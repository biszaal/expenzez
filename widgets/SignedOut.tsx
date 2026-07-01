import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { COLORS, cardRoot } from "./theme";

/** Shared signed-out state — tapping opens the app to sign in. */
export function SignedOut({ uri }: { uri: string }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
      style={{ ...cardRoot, justifyContent: "center", alignItems: "center" }}
    >
      <TextWidget
        text="Sign in to Expenzez"
        style={{ fontSize: 13, color: COLORS.white, fontWeight: "600", textAlign: "center" }}
      />
    </FlexWidget>
  );
}
