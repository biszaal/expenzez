import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';

interface FinancialAdvisorDisclaimerProps {
  showInline?: boolean;
  style?: any;
}

export default function FinancialAdvisorDisclaimer({ showInline = false, style }: FinancialAdvisorDisclaimerProps) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const disclaimerText = `This AI financial advisor feature provides general guidance based on your spending patterns and widely accepted financial principles. It is NOT a substitute for professional financial advice.

Key Limitations:
• Not personalized to your complete financial situation
• Cannot account for your specific goals, risk tolerance, or circumstances
• Does not consider tax implications or legal matters
• Should not be used for investment or major financial decisions

Always consult with a certified financial advisor, accountant, or other qualified professional for:
• Investment planning and portfolio management
• Tax optimization strategies
• Major financial decisions (home buying, business investments)
• Debt management and restructuring
• Estate planning and insurance needs

This tool is designed to help you understand your spending patterns and develop better financial habits. Use it as a starting point for your financial journey, not as professional advice.`;

  if (showInline) {
    return (
      <View style={[styles.inlineDisclaimer, { backgroundColor: colors.warning[50], borderColor: colors.warning[200] }, style]}>
        <View style={styles.disclaimerHeader}>
          <Ionicons name="information-circle" size={16} color={colors.warning[600]} />
          <Text style={[styles.disclaimerTitle, { color: colors.warning[700] }]}>
            Not Certified Financial Advice
          </Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={[styles.readMoreText, { color: colors.primary[600] }]}>
              Read More
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.inlineText, { color: colors.warning[700] }]}>
          This AI provides general guidance based on spending patterns. Always consult a certified financial advisor for personalized advice.
        </Text>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                  Financial Advisor Disclaimer
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalText, { color: colors.text.secondary }]}>
                {disclaimerText}
              </Text>

              <TouchableOpacity
                style={[styles.understoodButton, { backgroundColor: colors.primary[500] }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.understoodButtonText}>I Understand</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.compactDisclaimer, { backgroundColor: colors.warning[100] }, style]}
      onPress={() => setModalVisible(true)}
    >
      <Ionicons name="shield-checkmark" size={14} color={colors.warning[600]} />
      <Text style={[styles.compactText, { color: colors.warning[700] }]}>
        AI Financial Guidance • Not Certified Advice
      </Text>
      <Ionicons name="chevron-forward" size={12} color={colors.warning[600]} />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Financial Advisor Disclaimer
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalText, { color: colors.text.secondary }]}>
              {disclaimerText}
            </Text>

            <TouchableOpacity
              style={[styles.understoodButton, { backgroundColor: colors.primary[500] }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.understoodButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  inlineDisclaimer: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  disclaimerTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  inlineText: {
    fontSize: 12,
    lineHeight: 16,
  },
  compactDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  compactText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
    width: '100%',
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
  },
  understoodButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  understoodButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

});