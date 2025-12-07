import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { spacing, borderRadius } from "../constants/theme";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: "general" | "transactions" | "budgets" | "technical";
}

interface SupportSystemProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SupportSystem: React.FC<SupportSystemProps> = ({
  isVisible,
  onClose,
}) => {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const faqData: FAQ[] = [
    {
      id: "1",
      question: "How do I add transactions?",
      answer:
        'You can manually add transactions by tapping the "+" button on the main screen. Fill in the amount, category, and description to track your expenses and income.',
      category: "transactions",
    },
    {
      id: "2",
      question: "How do I categorize my transactions?",
      answer:
        "You can set categories when adding transactions manually. Tap any existing transaction to edit its category. This helps you better track your spending patterns.",
      category: "transactions",
    },
    {
      id: "3",
      question: "How do budget alerts work?",
      answer:
        "Budget alerts notify you when you reach 80% of your budget limit by default. You can customize alert thresholds in your budget settings.",
      category: "budgets",
    },
    {
      id: "4",
      question: "Is my financial data secure?",
      answer:
        "Yes, we use bank-level security including 256-bit encryption, secure API connections, and never store your banking credentials. All data is encrypted at rest.",
      category: "general",
    },
    {
      id: "5",
      question: "How do I set up budgets?",
      answer:
        "Go to the Budgets section and tap 'Create Budget'. Set your monthly limit and choose categories to track. You'll get notifications when approaching your limits.",
      category: "budgets",
    },
    {
      id: "6",
      question: "How do I export my data?",
      answer:
        'Go to the Account tab and tap "Export". You can export your transactions, budgets, and reports in CSV or PDF format.',
      category: "general",
    },
    {
      id: "7",
      question: "The app is crashing or running slowly",
      answer:
        "Try restarting the app first. If issues persist, check for app updates in your app store. Clear app cache if the problem continues.",
      category: "technical",
    },
    {
      id: "8",
      question: "How do I delete my account?",
      answer:
        "To delete your account and all data, go to Settings > Account > Delete Account. This action cannot be undone.",
      category: "general",
    },
  ];

  const categories = [
    { id: "all", name: "All Questions", icon: "help-circle" },
    { id: "general", name: "General", icon: "information-circle" },
    { id: "transactions", name: "Transactions", icon: "receipt" },
    { id: "budgets", name: "Budgets", icon: "pie-chart" },
    { id: "technical", name: "Technical", icon: "construct" },
  ];

  const filteredFAQs =
    selectedCategory === "all"
      ? faqData
      : faqData.filter((faq) => faq.category === selectedCategory);

  const handleEmailSupport = async () => {
    const subject = "Expenzez Support Request";
    const body = `Hi Expenzez Support Team,

I need help with:

[Please describe your issue here]

Device Information:
- App Version: 1.0.0
- Platform: Mobile

Thank you!`;

    try {
      const emailUrl = `mailto:support@expenzez.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert(
          "Email Support",
          "Please contact us at support@expenzez.com",
          [
            {
              text: "Copy Email",
              onPress: () => {
                // In a real app, you'd copy to clipboard here
                Alert.alert("Email Copied", "support@expenzez.com");
              },
            },
            { text: "OK" },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to open email app. Please contact support@expenzez.com directly."
      );
    }
  };



  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Support Center
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.text.secondary }]}
            >
              How can we help you today?
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Contact Support */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Contact Us
            </Text>
            <TouchableOpacity
              style={[
                styles.emailSupportCard,
                { backgroundColor: colors.background.primary },
              ]}
              onPress={handleEmailSupport}
            >
              <View
                style={[
                  styles.emailIconContainer,
                  { backgroundColor: `${colors.primary.main}15` },
                ]}
              >
                <Ionicons
                  name="mail"
                  size={28}
                  color={colors.primary.main}
                />
              </View>
              <View style={styles.emailTextContainer}>
                <Text
                  style={[
                    styles.emailTitle,
                    { color: colors.text.primary },
                  ]}
                >
                  Email Support
                </Text>
                <Text
                  style={[
                    styles.emailAddress,
                    { color: colors.primary.main },
                  ]}
                >
                  support@expenzez.com
                </Text>
                <Text
                  style={[
                    styles.emailDescription,
                    { color: colors.text.secondary },
                  ]}
                >
                  We typically respond within 24 hours
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          {/* FAQ Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Frequently Asked Questions
            </Text>

            {/* Category Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryFilter}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor:
                        selectedCategory === category.id
                          ? colors.primary.main
                          : colors.background.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={16}
                    color={
                      selectedCategory === category.id
                        ? "#fff"
                        : colors.text.secondary
                    }
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={{
                      color:
                        selectedCategory === category.id
                          ? "#fff"
                          : colors.text.primary,
                      fontSize: 14,
                      fontWeight: "500",
                    }}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* FAQ List */}
            <View style={styles.faqList}>
              {filteredFAQs.map((faq) => (
                <FAQItem key={faq.id} faq={faq} colors={colors} />
              ))}
            </View>
          </View>

          {/* Quick Links */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Quick Links
            </Text>
            <View style={styles.quickLinks}>
              <TouchableOpacity
                style={[
                  styles.quickLinkItem,
                  { backgroundColor: colors.background.primary },
                ]}
                onPress={() => Linking.openURL("https://expenzez.com/privacy")}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={colors.primary.main}
                />
                <Text
                  style={[styles.quickLinkText, { color: colors.text.primary }]}
                >
                  Privacy Policy
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickLinkItem,
                  { backgroundColor: colors.background.primary },
                ]}
                onPress={() => Linking.openURL("https://expenzez.com/terms")}
              >
                <Ionicons
                  name="document-text"
                  size={20}
                  color={colors.primary.main}
                />
                <Text
                  style={[styles.quickLinkText, { color: colors.text.primary }]}
                >
                  Terms of Service
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickLinkItem,
                  { backgroundColor: colors.background.primary },
                ]}
                onPress={() => Linking.openURL("https://expenzez.com/status")}
              >
                <Ionicons name="pulse" size={20} color={colors.success.main} />
                <Text
                  style={[styles.quickLinkText, { color: colors.text.primary }]}
                >
                  Service Status
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const FAQItem: React.FC<{ faq: FAQ; colors: any }> = ({ faq, colors }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View
      style={[styles.faqItem, { backgroundColor: colors.background.primary }]}
    >
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={[styles.faqQuestion, { color: colors.text.primary }]}>
          {faq.question}
        </Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.text.secondary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.faqAnswerContainer}>
          <Text style={[styles.faqAnswer, { color: colors.text.secondary }]}>
            {faq.answer}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  emailSupportCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emailIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  emailTextContainer: {
    flex: 1,
  },
  emailTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  emailAddress: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  emailDescription: {
    fontSize: 13,
  },
  categoryFilter: {
    marginBottom: spacing.lg,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  faqList: {
    gap: spacing.sm,
  },
  faqItem: {
    borderRadius: borderRadius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    paddingRight: spacing.sm,
  },
  faqAnswerContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
  quickLinks: {
    gap: spacing.sm,
  },
  quickLinkItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    marginLeft: spacing.sm,
  },
});

export default SupportSystem;
