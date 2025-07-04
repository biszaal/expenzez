import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../../components/TopBar";
import banksData from "../data/banks.json";

export default function BanksScreen() {
  const [banks] = useState(banksData);

  return (
    <SafeAreaView className="flex-1 bg-[#f6f8fa] px-4">
      <TopBar title="Banks" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Bank Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          className="flex-row items-center justify-center mb-6 py-3 rounded-xl bg-blue-600"
          onPress={() => {
            // Future: open add-bank modal or navigation
          }}
        >
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text className="ml-2 text-white font-bold text-base">
            Add Bank Account
          </Text>
        </TouchableOpacity>

        {/* Connected Banks */}
        <Text className="text-lg font-bold text-gray-900 mb-4">
          Connected Banks
        </Text>
        <View className="space-y-4">
          {banks.length === 0 && (
            <Text className="text-gray-500 text-center">
              No banks connected yet.
            </Text>
          )}
          {banks.map((bank) => (
            <View
              key={bank.id}
              className="flex-row items-center bg-white rounded-xl shadow px-4 py-3"
            >
              <Image
                source={{ uri: bank.logo }}
                className="w-12 h-12 rounded-full mr-4 bg-gray-100"
                resizeMode="contain"
              />
              <View className="flex-1 min-w-0">
                <Text className="font-semibold text-gray-900" numberOfLines={1}>
                  {bank.name}
                </Text>
                <Text className="text-gray-500 text-xs" numberOfLines={1}>
                  {bank.account}
                </Text>
              </View>
              <Text className="text-xs font-semibold text-gray-700 ml-2">
                $
                {bank.balance?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
