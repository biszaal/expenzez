import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/Colors';

interface Category {
  id: string;
  title: string;
  icon: string;
  count: number;
}

interface NotificationCategoriesProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export const NotificationCategories: React.FC<NotificationCategoriesProps> = ({
  categories,
  selectedCategory,
  onCategoryChange
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.selectedCategoryButton
            ]}
            onPress={() => onCategoryChange(category.id)}
            activeOpacity={0.7}
          >
            <View style={styles.categoryContent}>
              <Ionicons
                name={category.icon as any}
                size={18}
                color={selectedCategory === category.id ? colors.primary.main : colors.text.secondary}
              />
              <Text style={[
                styles.categoryTitle,
                selectedCategory === category.id && styles.selectedCategoryTitle
              ]}>
                {category.title}
              </Text>
              {category.count > 0 && (
                <View style={[
                  styles.countBadge,
                  selectedCategory === category.id && styles.selectedCountBadge
                ]}>
                  <Text style={[
                    styles.countText,
                    selectedCategory === category.id && styles.selectedCountText
                  ]}>
                    {category.count}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginVertical: SPACING.md
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm
  },
  categoryButton: {
    backgroundColor: colors.background.primary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border.light
  },
  selectedCategoryButton: {
    backgroundColor: colors.primary.main + '15',
    borderColor: colors.primary.main + '30'
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary
  },
  selectedCategoryTitle: {
    color: colors.primary.main
  },
  countBadge: {
    backgroundColor: colors.text.tertiary + '20',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6
  },
  selectedCountBadge: {
    backgroundColor: colors.primary.main + '30'
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary
  },
  selectedCountText: {
    color: colors.primary.main
  }
});