import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAlert } from "../../hooks/useAlert";
import { bankingAPI } from "../../services/api";
import { spacing, borderRadius, shadows } from "../../constants/theme";
import { 
  categorizeBank, 
  groupBanksByCategory, 
  getSortedCategories,
  BANK_CATEGORIES,
  type BankCategory 
} from "../../utils/bankCategories";

interface Bank {
  id: string;
  name: string;
  logo: string;
  bic?: string;
  countries?: string[];
  transaction_total_days?: string;
  category?: BankCategory;
}

export default function BankSelectScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showError, showSuccess } = useAlert();
  
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BankCategory | 'all'>('all');

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await bankingAPI.getInstitutions();
      const institutions = response.data?.institutions || [];
      
      // Add categories to each bank
      const categorizedBanks = institutions.map((bank: any) => ({
        ...bank,
        category: categorizeBank(bank.name, bank.id)
      }));
      
      setBanks(categorizedBanks);
    } catch (error: any) {
      console.error("Error fetching banks:", error);
      showError("Failed to load available banks");
      // Provide fallback banks with categories including Sandbox Finance
      const fallbackBanks = [
        { id: "SANDBOXFINANCE_SFIN0000", name: "Sandbox Finance", logo: "" },
        { id: "HSBC_HBUKGB4B", name: "HSBC Personal", logo: "" },
        { id: "BARCLAYS_BUKBGB22", name: "Barclays Personal", logo: "" },
        { id: "LLOYDS_LOYDGB2L", name: "Lloyds Bank Personal", logo: "" },
        { id: "NATWEST_NWBKGB2L", name: "NatWest", logo: "" },
        { id: "SANTANDER_ABBYGB2L", name: "Santander", logo: "" },
      ].map(bank => ({
        ...bank,
        category: categorizeBank(bank.name, bank.id)
      }));
      
      setBanks(fallbackBanks);
    } finally {
      setLoading(false);
    }
  };

  // Filter banks based on search query and category
  const filteredBanks = useMemo(() => {
    let filtered = banks;
    
    // Filter by category if not 'all'
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(bank => bank.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(bank => 
        bank.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [banks, searchQuery, selectedCategory]);
  
  // Group banks by category for display
  const groupedBanks = useMemo(() => {
    return groupBanksByCategory(filteredBanks);
  }, [filteredBanks]);
  
  // Get sorted categories that have banks
  const availableCategories = useMemo(() => {
    return getSortedCategories(groupedBanks);
  }, [groupedBanks]);

  const handleBankSelect = async (bank: Bank) => {
    try {
      setConnecting(bank.id);
      const response = await bankingAPI.connectBankDirect(bank.id);
      
      console.log("Bank connection response:", response);
      
      // Check the correct response structure from GoCardless/Nordigen
      const authUrl = response.data?.authorizationUrl || response.authorizationUrl || response.authUrl;
      const requisition = response.data?.requisition || response.requisition;
      
      if (authUrl && requisition) {
        // Store the requisition ID with the reference for callback lookup
        const reference = requisition.reference;
        const requisitionId = requisition.id;
        
        if (reference && requisitionId) {
          try {
            await AsyncStorage.setItem(`requisition_${reference}`, requisitionId);
            console.log(`✅ Stored requisition ID ${requisitionId} for reference ${reference}`);
          } catch (storageError) {
            console.error('❌ Failed to store requisition ID:', storageError);
          }
        }
        
        showSuccess(`Connecting to ${bank.name}...`);
        // Navigate to bank connection flow
        router.push({
          pathname: "/banks/connect",
          params: { bankId: bank.id, authUrl }
        });
      } else {
        console.error("No authorization URL or requisition found in response:", response);
        showError(`Failed to get authorization link for ${bank.name}`);
      }
    } catch (error: any) {
      console.error("Error connecting bank:", error);
      showError(error.response?.data?.message || `Failed to connect to ${bank.name}`);
    } finally {
      setConnecting(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading banks...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Select Your Bank
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInput, { backgroundColor: colors.background.primary, borderColor: colors.gray[200] }]}>
          <Ionicons name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchText, { color: colors.text.primary }]}
            placeholder="Search banks..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
              <Ionicons name="close" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilterContainer}
        contentContainerStyle={styles.categoryFilterContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && { 
              backgroundColor: colors.primary[500],
              borderColor: colors.primary[600] 
            }
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryChipText,
            { 
              color: selectedCategory === 'all' ? '#FFFFFF' : colors.text.secondary,
              marginLeft: 0 // No emoji for "All Banks"
            }
          ]}>
            All Banks
          </Text>
        </TouchableOpacity>
        
        {Object.values(BANK_CATEGORIES)
          .sort((a, b) => a.priority - b.priority)
          .map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && { 
                  backgroundColor: colors.primary[500],
                  borderColor: colors.primary[600]
                }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryEmojiSmall}>{category.icon}</Text>
              <Text style={[
                styles.categoryChipText,
                { color: selectedCategory === category.id ? '#FFFFFF' : colors.text.secondary }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))
        }
      </ScrollView>

      {/* Bank List */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
      >
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Choose your bank to connect your account securely
        </Text>

        {/* Category Sections */}
        <View style={styles.bankList}>
          {selectedCategory === 'all' ? (
            // Show banks grouped by categories
            availableCategories.map((categoryInfo) => (
              <View key={categoryInfo.id} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryEmoji}>{categoryInfo.icon}</Text>
                  <View style={styles.categoryTextContainer}>
                    <Text style={[styles.categoryTitle, { color: colors.text.primary }]}>
                      {categoryInfo.name}
                    </Text>
                    <Text style={[styles.categoryDescription, { color: colors.text.secondary }]}>
                      {categoryInfo.description}
                    </Text>
                  </View>
                  <Text style={[styles.categoryCount, { color: colors.text.tertiary }]}>
                    {groupedBanks[categoryInfo.id].length}
                  </Text>
                </View>
                
                {groupedBanks[categoryInfo.id]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((bank) => (
                  <TouchableOpacity
                    key={bank.id}
                    style={[
                      styles.bankItem,
                      { 
                        backgroundColor: colors.background.primary,
                        opacity: 1
                      }
                    ]}
                    onPress={() => handleBankSelect(bank)}
                    disabled={connecting === bank.id}
                  >
                    <View style={styles.bankInfo}>
                      <View
                        style={[
                          styles.bankIcon,
                          { backgroundColor: colors.background.secondary }
                        ]}
                      >
                        {bank.logo ? (
                          <Image 
                            source={{ uri: bank.logo }}
                            style={styles.bankLogo}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text style={[styles.bankInitial, { color: colors.primary[500] }]}>
                            {bank.name.charAt(0)}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.bankName, { color: colors.text.primary }]}>
                        {bank.name}
                      </Text>
                    </View>

                    {connecting === bank.id ? (
                      <ActivityIndicator size="small" color={colors.primary[500]} />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))
          ) : (
            // Show filtered banks in a simple list when a specific category is selected
            filteredBanks
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((bank) => (
              <TouchableOpacity
                key={bank.id}
                style={[
                  styles.bankItem,
                  { 
                    backgroundColor: colors.background.primary,
                    opacity: 1
                  }
                ]}
                onPress={() => handleBankSelect(bank)}
                disabled={connecting === bank.id}
              >
                <View style={styles.bankInfo}>
                  <View
                    style={[
                      styles.bankIcon,
                      { backgroundColor: colors.background.secondary }
                    ]}
                  >
                    {bank.logo ? (
                      <Image 
                        source={{ uri: bank.logo }}
                        style={styles.bankLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={[styles.bankInitial, { color: colors.primary[500] }]}>
                        {bank.name.charAt(0)}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.bankName, { color: colors.text.primary }]}>
                    {bank.name}
                  </Text>
                </View>

                {connecting === bank.id ? (
                  <ActivityIndicator size="small" color={colors.primary[500]} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Help Section */}
        <View style={[styles.helpSection, { backgroundColor: colors.background.primary }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
          <Text style={[styles.helpText, { color: colors.text.secondary }]}>
            Your banking credentials are never stored on our servers. We use secure banking APIs to connect your accounts.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  categoryFilterContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    height: 44,
    maxHeight: 44,
  },
  categoryFilterContent: {
    paddingRight: spacing.lg,
    alignItems: 'center',
    height: 44,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "transparent",
    height: 36,
    ...shadows.sm,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 3,
  },
  subtitle: {
    fontSize: 16,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  bankList: {
    marginTop: 0,
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  categoryEmojiSmall: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 12,
    opacity: 0.8,
  },
  categoryCount: {
    fontSize: 10,
    fontWeight: "600",
    backgroundColor: "#E5E7EB",
    color: "#6B7280",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 18,
    textAlign: "center",
    overflow: "hidden",
  },
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    ...shadows.md,
  },
  bankInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bankIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  bankLogo: {
    width: 40,
    height: 40,
  },
  bankInitial: {
    fontSize: 20,
    fontWeight: "700",
  },
  bankName: {
    fontSize: 18,
    fontWeight: "600",
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  helpSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: spacing.sm,
  },
});