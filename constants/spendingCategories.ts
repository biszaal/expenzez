export const SPENDING_CATEGORIES = [
  { name: "Food & Dining", icon: "restaurant", color: "#FF6B6B" },
  { name: "Shopping", icon: "bag", color: "#4ECDC4" },
  { name: "Transport", icon: "car", color: "#45B7D1" },
  { name: "Entertainment", icon: "gift-outline", color: "#96CEB4" },
  { name: "Bills & Utilities", icon: "flash", color: "#FFEAA7" },
  { name: "Health & Fitness", icon: "fitness", color: "#DDA0DD" },
  { name: "Other", icon: "ellipsis-horizontal", color: "#95A5A6" },
];

export const getCategoryConfig = (categoryName: string) => {
  const normalizedName = categoryName.toLowerCase();
  const config = SPENDING_CATEGORIES.find(
    (c) => c.name.toLowerCase() === normalizedName
  );
  
  if (config) return config;

  // Fallback for unknown categories
  return {
    name: categoryName,
    icon: "pricetag-outline",
    color: "#95A5A6",
  };
};
