import React from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

interface CategoryIconProps {
  iconName?: string;
  categoryName?: string;
  size?: number;
  color: string;
}

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (
    name.includes("food") ||
    name.includes("dining") ||
    name.includes("restaurant")
  )
    return "food-apple-outline";
  if (
    name.includes("transport") ||
    name.includes("travel") ||
    name.includes("uber") ||
    name.includes("taxi")
  )
    return "bus-clock";
  if (
    name.includes("shop") ||
    name.includes("retail") ||
    name.includes("amazon")
  )
    return "bag-outline";
  if (
    name.includes("entertainment") ||
    name.includes("game") ||
    name.includes("movie")
  )
    return "game-controller-outline";
  if (
    name.includes("bill") ||
    name.includes("utility") ||
    name.includes("electric") ||
    name.includes("gas")
  )
    return "flash-outline";
  if (
    name.includes("health") ||
    name.includes("fitness") ||
    name.includes("gym") ||
    name.includes("medical")
  )
    return "fitness-outline";
  return "pricetag-outline";
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName,
  categoryName,
  size = 24,
  color,
}) => {
  const finalIconName =
    iconName ||
    (categoryName ? getCategoryIcon(categoryName) : "pricetag-outline");

  switch (finalIconName) {
    // Original icons
    case "car-outline":
      return <Ionicons name="car-outline" size={size} color={color} />;
    case "home-outline":
      return <Ionicons name="home-outline" size={size} color={color} />;
    case "restaurant-outline":
      return <Ionicons name="restaurant-outline" size={size} color={color} />;
    case "medical-outline":
      return <Ionicons name="medical-outline" size={size} color={color} />;
    case "card-outline":
      return <Ionicons name="card-outline" size={size} color={color} />;
    case "school-outline":
      return <Ionicons name="school-outline" size={size} color={color} />;
    case "airplane-outline":
      return <Ionicons name="airplane-outline" size={size} color={color} />;
    case "bus-outline":
      return (
        <MaterialCommunityIcons name="bus-clock" size={size} color={color} />
      );
    case "food-apple-outline":
      return (
        <MaterialCommunityIcons
          name="food-apple-outline"
          size={size}
          color={color}
        />
      );
    case "game-controller-outline":
      return (
        <MaterialCommunityIcons
          name={"game-controller-outline" as any}
          size={size}
          color={color}
        />
      );
    case "flash-outline":
      return <Ionicons name="flash-outline" size={size} color={color} />;
    case "bag-outline":
      return <Ionicons name="bag-outline" size={size} color={color} />;
    case "fitness-outline":
      return <Ionicons name="fitness-outline" size={size} color={color} />;

    // TRANSACTION_CATEGORIES icons
    case "restaurant":
      return <Ionicons name="restaurant-outline" size={size} color={color} />;
    case "car":
      return <Ionicons name="car-outline" size={size} color={color} />;
    case "bag":
      return <Ionicons name="bag-outline" size={size} color={color} />;
    case "flash":
      return <Ionicons name="flash-outline" size={size} color={color} />;
    case "game-controller":
      return (
        <MaterialCommunityIcons
          name={"game-controller-outline" as any}
          size={size}
          color={color}
        />
      );
    case "fitness":
      return <Ionicons name="fitness-outline" size={size} color={color} />;
    case "school":
      return <Ionicons name="school-outline" size={size} color={color} />;
    case "airplane":
      return <Ionicons name="airplane-outline" size={size} color={color} />;
    case "card":
      return <Ionicons name="card-outline" size={size} color={color} />;
    case "briefcase":
      return <Ionicons name="briefcase-outline" size={size} color={color} />;
    case "laptop":
      return <Ionicons name="laptop-outline" size={size} color={color} />;
    case "trending-up":
      return <Ionicons name="trending-up-outline" size={size} color={color} />;
    case "home":
      return <Ionicons name="home-outline" size={size} color={color} />;
    case "storefront":
      return <Ionicons name="storefront-outline" size={size} color={color} />;
    case "gift":
      return <Ionicons name="gift-outline" size={size} color={color} />;
    case "refresh":
      return <Ionicons name="refresh-outline" size={size} color={color} />;
    case "cash":
      return <Ionicons name="cash-outline" size={size} color={color} />;

    default:
      return <Ionicons name="pricetag-outline" size={size} color={color} />;
  }
};
