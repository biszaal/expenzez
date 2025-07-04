import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Splash" />
      <Stack.Screen name="auth/Login" />
      <Stack.Screen name="auth/Register" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
