import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { BankFormat } from '@/services/ukBankFormats';

interface BankLogoProps {
  bank: BankFormat;
  size?: number;
}

const BankLogo: React.FC<BankLogoProps> = ({ bank, size = 64 }) => {
  const [hasError, setHasError] = useState(false);

  if (!bank.logoUrl || hasError) {
    return <Text style={{ fontSize: size * 0.75 }}>{bank.logo}</Text>;
  }

  return (
    <Image
      source={{ uri: bank.logoUrl }}
      style={{ width: size, height: size, borderRadius: size / 4 }}
      onError={() => setHasError(true)}
      resizeMode="contain"
    />
  );
};

interface ExportGuideProps {
  visible: boolean;
  bank: BankFormat;
  onClose: () => void;
  onContinue: () => void;
}

export const ExportGuide: React.FC<ExportGuideProps> = ({
  visible,
  bank,
  onClose,
  onContinue,
}) => {
  const { colors } = useTheme();

  const hasAppSteps = bank.exportGuide.appSteps && bank.exportGuide.appSteps.length > 0;
  const hasWebSteps = bank.exportGuide.webSteps && bank.exportGuide.webSteps.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border.light }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Export from {bank.name}
          </Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Bank Logo */}
          <View style={styles.bankHeader}>
            <View style={styles.logoContainer}>
              <BankLogo bank={bank} size={64} />
            </View>
            <Text style={[styles.bankName, { color: colors.text.primary }]}>
              {bank.name}
            </Text>
          </View>

          {/* App Steps */}
          {hasAppSteps && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="phone-portrait-outline" size={20} color={colors.primary.main} />
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Mobile App
                </Text>
              </View>
              {bank.exportGuide.appSteps.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary.main }]}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.text.primary }]}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Web Steps */}
          {hasWebSteps && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="laptop-outline" size={20} color={colors.primary.main} />
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  {hasAppSteps ? 'Or via Website' : 'Website'}
                </Text>
              </View>
              {bank.exportGuide.webSteps!.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary.main }]}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.text.primary }]}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Notes */}
          {bank.exportGuide.notes && bank.exportGuide.notes.length > 0 && (
            <View style={[styles.notesCard, { backgroundColor: colors.background.secondary }]}>
              <View style={styles.notesHeader}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary.main} />
                <Text style={[styles.notesTitle, { color: colors.text.primary }]}>
                  Notes
                </Text>
              </View>
              {bank.exportGuide.notes.map((note, index) => (
                <Text
                  key={index}
                  style={[styles.noteText, { color: colors.text.secondary }]}
                >
                  • {note}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Continue Button */}
        <View style={[styles.footer, { borderTopColor: colors.border.light }]}>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary.main }]}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Ionicons name="document-outline" size={20} color="#fff" />
            <Text style={styles.continueButtonText}>
              I have my CSV file ready
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  bankHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bankName: {
    fontSize: 22,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  notesCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ExportGuide;
