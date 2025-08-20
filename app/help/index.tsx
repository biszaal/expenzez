import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";
import { getFAQ } from "../../services/dataSource";

// Help options data
const helpOptions = [
  {
    id: "faq",
    title: "FAQ",
    description: "Frequently asked questions",
    icon: "help-circle-outline",
    action: "faq"
  },
  {
    id: "contact",
    title: "Contact Support", 
    description: "Get in touch with our team",
    icon: "mail-outline",
    action: "contact"
  },
  {
    id: "guide",
    title: "User Guide",
    description: "Learn how to use the app",
    icon: "book-outline", 
    action: "guide"
  },
  {
    id: "feedback",
    title: "Send Feedback",
    description: "Help us improve the app",
    icon: "chatbubble-outline",
    action: "feedback"
  }
];

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface HelpOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  action: () => void;
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { colors, shadows } = useTheme();
  const [faqData, setFaqData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQ = async () => {
      setLoading(true);
      const data = await getFAQ();
      setFaqData(data);
      setLoading(false);
    };
    fetchFAQ();
  }, []);

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const contactSupport = () => {
    Linking.openURL("mailto:support@expenzez.com");
  };

  const openWebsite = () => {
    Linking.openURL("https://expenzez.com");
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={[
                styles.backButton,
                { backgroundColor: colors.background.secondary },
                shadows.sm,
              ]}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Help & Support
            </Text>
            <TouchableOpacity
              style={[
                styles.contactButton,
                { backgroundColor: colors.primary[100] },
                shadows.sm,
              ]}
              onPress={contactSupport}
            >
              <Ionicons name="mail" size={20} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Help Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            How can we help?
          </Text>
          <View style={styles.helpGrid}>
            {helpOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.helpCard,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  },
                  shadows.sm,
                ]}
                onPress={() => {
                  // Handle help action
                  Alert.alert(option.title, option.description);
                }}
              >
                <View
                  style={[
                    styles.helpIcon,
                    { backgroundColor: colors.primary[100] },
                  ]}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={colors.primary[500]}
                  />
                </View>
                <Text
                  style={[styles.helpTitle, { color: colors.text.primary }]}
                >
                  {option.title}
                </Text>
                <Text
                  style={[
                    styles.helpSubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Frequently Asked Questions
          </Text>
          <View
            style={[
              styles.faqCard,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              },
              shadows.sm,
            ]}
          >
            {faqData.map((faq, index) => (
              <View
                key={faq.id}
                style={[
                  styles.faqItem,
                  index !== faqData.length - 1 && {
                    borderBottomColor: colors.border.light,
                    borderBottomWidth: 1,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleFAQ(faq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqHeaderLeft}>
                    <View
                      style={[
                        styles.faqIcon,
                        { backgroundColor: colors.primary[100] },
                      ]}
                    >
                      <Ionicons
                        name="help-circle-outline"
                        size={20}
                        color={colors.primary[500]}
                      />
                    </View>
                    <View style={styles.faqText}>
                      <Text
                        style={[
                          styles.faqQuestion,
                          { color: colors.text.primary },
                        ]}
                      >
                        {faq.question}
                      </Text>
                      <Text
                        style={[
                          styles.faqCategory,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {faq.category}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={
                      expandedFAQ === faq.id ? "chevron-up" : "chevron-down"
                    }
                    size={20}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
                {expandedFAQ === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text
                      style={[
                        styles.faqAnswerText,
                        { color: colors.text.secondary },
                      ]}
                    >
                      {faq.answer}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Still need help?
          </Text>
          <View
            style={[
              styles.contactCard,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              },
              shadows.sm,
            ]}
          >
            <View style={styles.contactContent}>
              <View style={styles.contactLeft}>
                <Text
                  style={[styles.contactTitle, { color: colors.text.primary }]}
                >
                  Contact our support team
                </Text>
                <Text
                  style={[
                    styles.contactSubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  We're here to help you with any questions or issues
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.contactButton,
                  { backgroundColor: colors.primary[500] },
                  shadows.sm,
                ]}
                onPress={contactSupport}
              >
                <Text
                  style={[
                    styles.contactButtonText,
                    { color: colors.text.inverse },
                  ]}
                >
                  Contact Us
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={openWebsite}>
            <Text style={[styles.footerText, { color: colors.text.secondary }]}>
              Visit our website
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["2xl"],
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    marginBottom: spacing.md,
  },
  helpGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  helpCard: {
    width: "48%",
    borderRadius: borderRadius["2xl"],
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  helpIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  helpTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    textAlign: "center" as const,
    marginBottom: spacing.xs,
  },
  helpSubtitle: {
    fontSize: typography.fontSizes.sm,
    textAlign: "center" as const,
  },
  faqCard: {
    borderRadius: borderRadius["2xl"],
    borderWidth: 1,
    overflow: "hidden",
  },
  faqItem: {
    paddingHorizontal: spacing.lg,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  faqHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  faqIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  faqText: {
    flex: 1,
  },
  faqQuestion: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    marginBottom: spacing.xs,
  },
  faqCategory: {
    fontSize: typography.fontSizes.sm,
  },
  faqAnswer: {
    paddingBottom: spacing.lg,
    paddingLeft: spacing.xl + spacing.md,
  },
  faqAnswerText: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.fontSizes.sm * 1.5,
  },
  contactCard: {
    borderRadius: borderRadius["2xl"],
    borderWidth: 1,
    padding: spacing.lg,
  },
  contactContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contactLeft: {
    flex: 1,
    marginRight: spacing.lg,
  },
  contactTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600" as const,
    marginBottom: spacing.xs,
  },
  contactSubtitle: {
    fontSize: typography.fontSizes.sm,
  },
  contactButtonSecondary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  contactButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
  },
  footer: {
    alignItems: "center" as const,
    paddingVertical: spacing.lg,
  },
  footerText: {
    fontSize: typography.fontSizes.sm,
  },
});
