import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface TopBarProps {
  title?: string;
  onAvatarPress?: () => void;
  onBellPress?: () => void;
}

export default function TopBar({
  title = "",
  onAvatarPress,
  onBellPress,
}: TopBarProps) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-7 pb-3 bg-[#EAF5F7]">
      {/* Left: Avatar or Icon */}
      <TouchableOpacity
        className="bg-white rounded-full p-2 shadow-sm"
        onPress={onAvatarPress}
        activeOpacity={0.8}
      >
        <Ionicons name="planet" size={28} color="#7C4DFF" />
      </TouchableOpacity>

      {/* Center: Title */}
      <Text className="flex-1 text-center text-2xl font-bold text-[#2E2353] ml-4 mr-4">
        {title}
      </Text>

      {/* Right: Notification Bell */}
      <TouchableOpacity
        className="bg-white rounded-full p-2 shadow-sm"
        onPress={onBellPress}
        activeOpacity={0.8}
      >
        <Feather name="bell" size={22} color="#5C3D9F" />
      </TouchableOpacity>
    </View>
  );
}
