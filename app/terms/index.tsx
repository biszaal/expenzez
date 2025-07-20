import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";
import { getLegalSections } from "../../services/dataSource";

interface LegalSection {
  id: string;
  title: string;
  content: string;
  type: "terms" | "privacy";
}

export default function TermsPrivacyScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [selectedSection, setSelectedSection] = useState<string>("1");
  const [legalSections, setLegalSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLegal = async () => {
      setLoading(true);
      const data = await getLegalSections();
      setLegalSections(data);
      setLoading(false);
    };
    fetchLegal();
  }, []);

  const openWebsite = () => {
    Linking.openURL("https://expenzez.com/legal");
  };

  const contactLegal = () => {
    Linking.openURL("mailto:legal@expenzez.com");
  };

  if (!isLoggedIn) {
    return null;
  }

  const currentSection = legalSections.find(
    (section) => section.id === selectedSection
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Terms & Privacy</Text>
            <TouchableOpacity style={styles.legalButton} onPress={contactLegal}>
              <Ionicons name="mail" size={20} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal Documents</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.navigationScroll}
          >
            {legalSections.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={[
                  styles.navButton,
                  selectedSection === section.id && styles.navButtonActive,
                ]}
                onPress={() => setSelectedSection(section.id)}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    selectedSection === section.id &&
                      styles.navButtonTextActive,
                  ]}
                >
                  {section.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <View style={styles.section}>
          <View style={styles.contentCard}>
            <Text style={styles.contentTitle}>{currentSection?.title}</Text>
            <Text style={styles.contentText}>{currentSection?.content}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Download PDF</Text>
                <Text style={styles.actionSubtitle}>
                  Save a copy of our terms
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary[500]}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>View Online</Text>
                <Text style={styles.actionSubtitle}>Read on our website</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary[500]}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Contact Legal</Text>
                <Text style={styles.actionSubtitle}>
                  Questions about our terms
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Last Updated */}
        <View style={styles.section}>
          <View style={styles.updateCard}>
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.primary[500]}
            />
            <Text style={styles.updateText}>
              Last updated: January 15, 2024
            </Text>
          </View>
        </View>

        {/* Acceptance */}
        <View style={styles.section}>
          <View style={styles.acceptanceCard}>
            <Text style={styles.acceptanceTitle}>
              By using expenzez, you agree to:
            </Text>
            <View style={styles.acceptanceList}>
              <View style={styles.acceptanceItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.primary[500]}
                />
                <Text style={styles.acceptanceText}>Our Terms of Service</Text>
              </View>
              <View style={styles.acceptanceItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.primary[500]}
                />
                <Text style={styles.acceptanceText}>Our Privacy Policy</Text>
              </View>
              <View style={styles.acceptanceItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.primary[500]}
                />
                <Text style={styles.acceptanceText}>
                  Our Data Protection practices
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.primary,
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
    backgroundColor: colors.background.primary,
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
    color: colors.text.primary,
  },
  legalButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[100],
    ...shadows.sm,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  navigationScroll: {
    marginBottom: spacing.md,
  },
  navButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.primary,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  navButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  navButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
    color: colors.text.secondary,
  },
  navButtonTextActive: {
    color: "white",
  },
  contentCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["3xl"],
    padding: spacing.lg,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  contentTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  contentText: {
    fontSize: typography.fontSizes.base,
    color: colors.text.secondary,
    lineHeight: typography.fontSizes.base * 1.6,
  },
  actionsCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["3xl"],
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    color: colors.text.primary,
  },
  actionSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  updateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["3xl"],
    padding: spacing.lg,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  updateText: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  acceptanceCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius["3xl"],
    padding: spacing.lg,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  acceptanceTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  acceptanceList: {
    gap: spacing.sm,
  },
  acceptanceItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  acceptanceText: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
});
