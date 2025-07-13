import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, Text, View } from "react-native";
import { useAuth } from "./auth/AuthContext";

export default function Splash() {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
    const timeout = setTimeout(() => {
        if (isLoggedIn) {
          router.replace("/(tabs)");
        } else {
      router.replace("/auth/Login");
        }
    }, 1800);
    return () => clearTimeout(timeout);
    }
  }, [isLoggedIn, loading]);

  return (
    <View className="flex-1 items-center justify-center bg-purple-600">
      {/* Replace with your own SVG or logo image */}
      <View className="bg-white rounded-2xl p-5 mb-6 shadow-lg">
        <Image
          source={require("../assets/images/icon.png")}
          style={{ width: 70, height: 70 }}
          resizeMode="contain"
        />
      </View>
      <Text className="text-4xl font-extrabold text-white tracking-wide mb-2">
        expenzez
      </Text>
      <Text className="text-lg text-white/80 font-medium">
        Connect. Track. Prosper.
      </Text>
    </View>
  );
}
