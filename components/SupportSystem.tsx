import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius, typography } from '../constants/theme';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'banking' | 'transactions' | 'budgets' | 'technical';
}

interface SupportOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  action: () => void;
  color: string;
}

interface SupportSystemProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SupportSystem: React.FC<SupportSystemProps> = ({ isVisible, onClose }) => {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    subject: '',
    message: '',
    urgency: 'normal',
  });
  const [submitting, setSubmitting] = useState(false);

  const faqData: FAQ[] = [
    {
      id: '1',
      question: 'How do I connect my bank account?',
      answer: 'To connect your bank account, go to the Banking tab and tap "Connect Account". Select your bank from the list and follow the secure authentication process through TrueLayer.',
      category: 'banking',
    },
    {
      id: '2',
      question: 'Why are my transactions not updating?',
      answer: 'Transactions typically update every few hours. If you need immediate updates, pull down on the transactions screen to refresh. Some banks may have longer sync delays.',
      category: 'transactions',
    },
    {
      id: '3',
      question: 'How do budget alerts work?',
      answer: 'Budget alerts notify you when you reach 80% of your budget limit by default. You can customize alert thresholds in your budget settings.',
      category: 'budgets',
    },
    {
      id: '4',
      question: 'Is my financial data secure?',
      answer: 'Yes, we use bank-level security including 256-bit encryption, secure API connections, and never store your banking credentials. All data is encrypted at rest.',
      category: 'general',
    },
    {
      id: '5',
      question: 'Can I categorize transactions manually?',
      answer: 'Yes, tap any transaction to edit its category. You can also set up automatic categorization rules in the transaction settings.',
      category: 'transactions',
    },
    {
      id: '6',
      question: 'How do I export my data?',
      answer: 'Go to the Account tab and tap "Export". You can export your transactions, budgets, and reports in CSV or PDF format.',
      category: 'general',
    },
    {
      id: '7',
      question: 'The app is crashing or running slowly',
      answer: 'Try restarting the app first. If issues persist, check for app updates in your app store. Clear app cache if the problem continues.',
      category: 'technical',
    },
    {
      id: '8',
      question: 'How do I delete my account?',
      answer: 'To delete your account and all data, go to Settings > Account > Delete Account. This action cannot be undone.',
      category: 'general',
    },
  ];

  const categories = [
    { id: 'all', name: 'All Questions', icon: 'help-circle' },
    { id: 'general', name: 'General', icon: 'information-circle' },
    { id: 'banking', name: 'Banking', icon: 'card' },
    { id: 'transactions', name: 'Transactions', icon: 'receipt' },
    { id: 'budgets', name: 'Budgets', icon: 'pie-chart' },
    { id: 'technical', name: 'Technical', icon: 'construct' },
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

  const handleEmailSupport = async () => {
    const subject = 'Expenzez Support Request';
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
          'Email Support',
          'Please contact us at support@expenzez.com',
          [
            { text: 'Copy Email', onPress: () => {
              // In a real app, you'd copy to clipboard here
              Alert.alert('Email Copied', 'support@expenzez.com');
            }},
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open email app. Please contact support@expenzez.com directly.');
    }
  };

  const handlePhoneSupport = () => {
    Alert.alert(
      'Phone Support',
      'Our support team is available Monday-Friday, 9 AM - 5 PM GMT',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => Linking.openURL('tel:+441234567890'),
        },
      ]
    );
  };

  const handleLiveChat = () => {
    Alert.alert(
      'Live Chat',
      'Live chat is available Monday-Friday, 9 AM - 5 PM GMT. Would you like to start a chat session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Chat',
          onPress: () => {
            // In a real app, this would open a chat widget
            Alert.alert('Live Chat', 'Live chat feature coming soon! Please use email support for now.');
          },
        },
      ]
    );
  };

  const handleSubmitContactForm = async () => {
    if (!contactFormData.subject.trim() || !contactFormData.message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSubmitting(true);

    try {
      // In a real app, this would submit to your support API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      Alert.alert(
        'Success',
        'Your support request has been submitted. We\'ll get back to you within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowContactForm(false);
              setContactFormData({ subject: '', message: '', urgency: 'normal' });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit support request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const supportOptions: SupportOption[] = [
    {
      id: 'email',
      title: 'Email Support',
      subtitle: 'Get help via email',
      icon: 'mail',
      action: handleEmailSupport,
      color: colors.primary[500],
    },
    {
      id: 'phone',
      title: 'Phone Support',
      subtitle: 'Call our support team',
      icon: 'call',
      action: handlePhoneSupport,
      color: colors.success[500],
    },
    {
      id: 'chat',
      title: 'Live Chat',
      subtitle: 'Chat with our team',
      icon: 'chatbubbles',
      action: handleLiveChat,
      color: colors.accent[500],
    },
    {
      id: 'contact',
      title: 'Contact Form',
      subtitle: 'Send us a message',
      icon: 'document-text',
      action: () => setShowContactForm(true),
      color: colors.warning[500],
    },
  ];

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Support Center
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
              How can we help you today?
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Support Options */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Get Support
            </Text>
            <View style={styles.supportOptionsGrid}>
              {supportOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.supportOptionCard, { backgroundColor: colors.background.primary }]}
                  onPress={option.action}
                >
                  <View style={[styles.supportOptionIcon, { backgroundColor: `${option.color}20` }]}>
                    <Ionicons name={option.icon as any} size={24} color={option.color} />
                  </View>
                  <Text style={[styles.supportOptionTitle, { color: colors.text.primary }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.supportOptionSubtitle, { color: colors.text.secondary }]}>
                    {option.subtitle}
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

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: selectedCategory === category.id 
                        ? colors.primary[500] 
                        : colors.background.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={16}
                    color={selectedCategory === category.id ? '#fff' : colors.text.secondary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={{
                    color: selectedCategory === category.id ? '#fff' : colors.text.primary,
                    fontSize: 14,
                    fontWeight: '500',
                  }}>
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
                style={[styles.quickLinkItem, { backgroundColor: colors.background.primary }]}
                onPress={() => Linking.openURL('https://expenzez.com/privacy')}
              >
                <Ionicons name="shield-checkmark" size={20} color={colors.primary[500]} />
                <Text style={[styles.quickLinkText, { color: colors.text.primary }]}>
                  Privacy Policy
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickLinkItem, { backgroundColor: colors.background.primary }]}
                onPress={() => Linking.openURL('https://expenzez.com/terms')}
              >
                <Ionicons name="document-text" size={20} color={colors.primary[500]} />
                <Text style={[styles.quickLinkText, { color: colors.text.primary }]}>
                  Terms of Service
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickLinkItem, { backgroundColor: colors.background.primary }]}
                onPress={() => Linking.openURL('https://expenzez.com/status')}
              >
                <Ionicons name="pulse" size={20} color={colors.success[500]} />
                <Text style={[styles.quickLinkText, { color: colors.text.primary }]}>
                  Service Status
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Contact Form Modal */}
        <Modal visible={showContactForm} animationType="slide" presentationStyle="pageSheet">
          <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                Contact Support
              </Text>
              <TouchableOpacity onPress={() => setShowContactForm(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.text.primary }]}>
                  Subject *
                </Text>
                <TextInput
                  style={[styles.formInput, {
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  }]}
                  value={contactFormData.subject}
                  onChangeText={(text) => setContactFormData(prev => ({ ...prev, subject: text }))}
                  placeholder="Brief description of your issue"
                  placeholderTextColor={colors.text.tertiary}
                />

                <Text style={[styles.formLabel, { color: colors.text.primary }]}>
                  Priority
                </Text>
                <View style={styles.priorityButtons}>
                  {['low', 'normal', 'high'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      onPress={() => setContactFormData(prev => ({ ...prev, urgency: priority }))}
                      style={[
                        styles.priorityButton,
                        {
                          backgroundColor: contactFormData.urgency === priority 
                            ? colors.primary[500] 
                            : colors.background.primary,
                          borderColor: colors.border.light,
                        },
                      ]}
                    >
                      <Text style={{
                        color: contactFormData.urgency === priority ? '#fff' : colors.text.primary,
                        fontWeight: '500',
                      }}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.formLabel, { color: colors.text.primary }]}>
                  Message *
                </Text>
                <TextInput
                  style={[styles.formTextArea, {
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  }]}
                  value={contactFormData.message}
                  onChangeText={(text) => setContactFormData(prev => ({ ...prev, message: text }))}
                  placeholder="Please provide details about your issue..."
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.submitButton, {
                    backgroundColor: submitting ? colors.gray[400] : colors.primary[500],
                    opacity: submitting ? 0.7 : 1,
                  }]}
                  onPress={handleSubmitContactForm}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const FAQItem: React.FC<{ faq: FAQ; colors: any }> = ({ faq, colors }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={[styles.faqItem, { backgroundColor: colors.background.primary }]}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={[styles.faqQuestion, { color: colors.text.primary }]}>
          {faq.question}
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
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
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  supportOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  supportOptionCard: {
    width: '47%',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  supportOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  supportOptionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  categoryFilter: {
    marginBottom: spacing.lg,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  formSection: {
    padding: spacing.lg,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
  },
  formTextArea: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 120,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  submitButton: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SupportSystem;