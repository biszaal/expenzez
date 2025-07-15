import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

interface LegalSection {
  id: string;
  title: string;
  content: string;
  type: "terms" | "privacy";
}

const legalSections: LegalSection[] = [
  {
    id: "1",
    title: "Terms of Service",
    type: "terms",
    content: `Welcome to expenzez. By using our app, you agree to these terms of service.

1. Acceptance of Terms
By accessing and using expenzez, you accept and agree to be bound by the terms and provision of this agreement.

2. Use License
Permission is granted to temporarily download one copy of the app for personal, non-commercial transitory viewing only.

3. Disclaimer
The materials on expenzez are provided on an 'as is' basis. expenzez makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

4. Limitations
In no event shall expenzez or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on expenzez, even if expenzez or a expenzez authorized representative has been notified orally or in writing of the possibility of such damage.

5. Revisions and Errata
The materials appearing on expenzez could include technical, typographical, or photographic errors. expenzez does not warrant that any of the materials on its app are accurate, complete or current.`,
  },
  {
    id: "2",
    title: "Privacy Policy",
    type: "privacy",
    content: `Your privacy is important to us. This privacy policy explains how we collect, use, and protect your information.

1. Information We Collect
We collect information you provide directly to us, such as when you create an account, connect your bank accounts, or contact us for support.

2. How We Use Your Information
We use the information we collect to:
• Provide, maintain, and improve our services
• Process transactions and send related information
• Send you technical notices, updates, security alerts, and support messages
• Respond to your comments, questions, and customer service requests

3. Information Sharing
We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.

4. Data Security
We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

5. Your Rights
You have the right to:
• Access your personal information
• Correct inaccurate information
• Request deletion of your information
• Opt out of certain communications

6. Data Retention
We retain your information for as long as your account is active or as needed to provide you services.

7. Changes to This Policy
We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.`,
  },
  {
    id: "3",
    title: "Data Protection",
    type: "privacy",
    content: `We are committed to protecting your data and ensuring compliance with data protection regulations.

1. GDPR Compliance
If you are in the European Union, you have certain rights regarding your personal data under the General Data Protection Regulation (GDPR).

2. Data Processing
We process your data only for legitimate business purposes and with your consent where required.

3. International Transfers
Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place.

4. Third-Party Services
We may use third-party services that collect, monitor, and analyze data. These services have their own privacy policies.

5. Cookies and Tracking
We use cookies and similar technologies to improve your experience and analyze app usage.

6. Children's Privacy
Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13.

7. Data Breach Procedures
In the event of a data breach, we will notify affected users and relevant authorities as required by law.`,
  },
  {
    id: "4",
    title: "Acceptable Use",
    type: "terms",
    content: `You agree to use expenzez only for lawful purposes and in accordance with these terms.

1. Prohibited Uses
You may not use the app to:
• Violate any applicable laws or regulations
• Infringe on the rights of others
• Transmit harmful, offensive, or inappropriate content
• Attempt to gain unauthorized access to our systems

2. Account Security
You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

3. Content Guidelines
You agree not to upload, post, or transmit any content that is illegal, harmful, threatening, abusive, or otherwise objectionable.

4. Intellectual Property
The app and its original content, features, and functionality are owned by expenzez and are protected by international copyright, trademark, and other intellectual property laws.

5. Termination
We may terminate or suspend your account immediately, without prior notice, for any reason, including breach of these terms.

6. Governing Law
These terms shall be governed by and construed in accordance with the laws of the United Kingdom.`,
  },
];

export default function TermsPrivacyScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [selectedSection, setSelectedSection] = useState<string>("1");

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
