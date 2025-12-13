import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { getSupportedBanks, BankFormat } from '@/services/ukBankFormats';

interface BankLogoProps {
  bank: BankFormat;
  size?: number;
}

const BankLogo: React.FC<BankLogoProps> = ({ bank, size = 40 }) => {
  const [hasError, setHasError] = useState(false);

  if (!bank.logoUrl || hasError) {
    return <Text style={[styles.bankEmoji, { fontSize: size * 0.7 }]}>{bank.logo}</Text>;
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

interface BankSelectorProps {
  onSelectBank: (bank: BankFormat | null) => void;
  selectedBankId?: string | null;
}

export const BankSelector: React.FC<BankSelectorProps> = ({
  onSelectBank,
  selectedBankId,
}) => {
  const { colors } = useTheme();
  const banks = getSupportedBanks();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Select Your Bank
      </Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        We&apos;ll show you how to export your transactions
      </Text>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {banks.map((bank) => (
          <TouchableOpacity
            key={bank.id}
            style={[
              styles.bankCard,
              {
                backgroundColor: colors.background.secondary,
                borderColor:
                  selectedBankId === bank.id ? colors.primary.main : colors.border.light,
                borderWidth: selectedBankId === bank.id ? 2 : 1,
              },
            ]}
            onPress={() => bank.id === 'generic' ? onSelectBank(null) : onSelectBank(bank)}
            activeOpacity={0.7}
          >
            <View style={styles.logoContainer}>
              {bank.id === 'generic' ? (
                <Ionicons name="document-text-outline" size={32} color={colors.text.secondary} />
              ) : (
                <BankLogo bank={bank} size={40} />
              )}
            </View>
            <Text
              style={[styles.bankName, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {bank.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  bankCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  bankEmoji: {
    textAlign: 'center',
  },
  bankName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});

export default BankSelector;
