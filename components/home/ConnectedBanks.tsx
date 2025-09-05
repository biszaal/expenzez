import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/ui';
import BankLogo from '../../components/ui/BankLogo';
import { bankingAPI } from '../../services/api';
import { APP_STRINGS } from '../../constants/strings';
import { DEEP_LINK_URLS } from '../../constants/config';
import { SPACING } from '../../constants/Colors';
import { styles } from './ConnectedBanks.styles';

interface Account {
  id: string;
  name: string;
  institution: string | { name: string; logo?: string };
  balance: number;
  currency: string;
  type: string;
}

interface BankAccount {
  accountId: string;
  bankName: string;
  bankLogo?: string;
  accountType: string;
  accountNumber: string;
  sortCode?: string;
  balance: number;
  currency: string;
  connectedAt: number;
  lastSyncAt: number;
  isActive: boolean;
  status: 'connected' | 'expired' | 'disconnected';
  isExpired: boolean;
  errorMessage?: string;
  lastErrorAt?: number;
}

interface ConnectedBanksProps {
  connectedBanks: BankAccount[];
  accounts: Account[];
  totalBalance: number;
  error: string | null;
  warning: string | null;
  hasExpiredBanks: boolean;
  setError: (error: string | null) => void;
  getDisplayAccountType: (accountType: string | undefined) => string;
}

export const ConnectedBanks: React.FC<ConnectedBanksProps> = ({
  connectedBanks,
  accounts,
  totalBalance,
  error,
  warning,
  hasExpiredBanks,
  setError,
  getDisplayAccountType,
}) => {
  const { colors } = useTheme();
  const router = useRouter();

  const getBankName = (institution: any) =>
    typeof institution === "object" && institution !== null
      ? institution.name
      : institution;

  const getBankLogo = (institution: any) =>
    typeof institution === "object" && institution !== null
      ? institution.logo
      : undefined;

  const handleConnectBank = async () => {
    // Navigate to bank selection screen instead of direct connection
    router.push('/banks/select');
  };

  return (
    <Card style={[styles.monthlyCard, { backgroundColor: colors.background.primary }] as any}>
      <View style={styles.monthlyHeader}>
        <View>
          <Text style={[styles.monthlyTitle, { color: colors.text.primary }]}>
            {APP_STRINGS.BANKS.CONNECTED_BANKS}
          </Text>
          <Text style={[styles.bankCount, { color: colors.text.secondary }]}>
            {connectedBanks.length} {connectedBanks.length === 1 ? "bank" : "banks"} connected
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/banks")}>
          <Text style={[styles.viewAllLink, { color: colors.primary[500] }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Error banner for bank refresh failures */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: '#FFF0F0', borderLeftColor: '#FF6B6B' }]}>
          <Ionicons name="close-circle" size={20} color="#FF6B6B" />
          <Text style={styles.errorText}>
            {error}
          </Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Warning banner for expired banks */}
      {hasExpiredBanks && !error && (
        <View style={[styles.warningBanner, { backgroundColor: '#FFF4E6', borderLeftColor: '#FF8C00' }]}>
          <Ionicons name="warning" size={20} color="#FF8C00" />
          <Text style={styles.warningText}>
            {warning || "Some banks need reconnection to sync fresh data"}
          </Text>
          <TouchableOpacity onPress={() => router.push("/banks")}>
            <Text style={styles.fixText}>Fix</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Horizontal ScrollView for Bank Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.sm }}
        style={{ marginHorizontal: -SPACING.lg }}
      >
        {connectedBanks.length === 0 && accounts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="link-outline" size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>
              {APP_STRINGS.BANKS.NO_BANKS_CONNECTED}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
              {APP_STRINGS.BANKS.CONNECT_TO_GET_STARTED}
            </Text>
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: colors.primary[500] }]}
              onPress={handleConnectBank}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.text.inverse} />
              <Text style={[styles.connectButtonText, { color: colors.text.inverse }]}>
                {APP_STRINGS.QUICK_ACTIONS.CONNECT_BANK}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Connected Banks */}
        {connectedBanks.map((bank) => (
          <TouchableOpacity
            key={bank.accountId}
            style={styles.bankCard}
            onPress={() => router.push("/banks")}
          >
            <View style={[
              styles.bankLogoContainer,
              { backgroundColor: colors.background.primary },
              bank.isExpired && { borderColor: '#FF6B6B', borderWidth: 3 }
            ]}>
              <BankLogo
                bankName={bank.bankName}
                logoUrl={bank.bankLogo}
                size="large"
              />
              <View style={[
                styles.statusIndicator,
                { 
                  backgroundColor: bank.isExpired ? '#FF6B6B' : '#4CAF50',
                  borderColor: colors.background.secondary
                }
              ]} />
            </View>
            
            <Text style={[
              styles.balanceAmount,
              { color: bank.isExpired ? '#FF6B6B' : colors.text.primary }
            ]}>
              £{bank.balance.toFixed(2)}
            </Text>
            
            <Text style={[styles.accountType, { color: colors.text.secondary }]}>
              {getDisplayAccountType(bank.accountType)}
            </Text>
            
            {bank.isExpired && (
              <Text style={styles.expiredText}>
                Connection Expired
              </Text>
            )}
          </TouchableOpacity>
        ))}
        
        {/* Fallback to legacy accounts */}
        {connectedBanks.length === 0 && accounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            style={styles.bankCard}
            onPress={() => router.push("/banks")}
          >
            <View style={[styles.bankLogoContainer, { backgroundColor: colors.background.primary }]}>
              <BankLogo
                bankName={getBankName(account.institution)}
                logoUrl={getBankLogo(account.institution)}
                size="large"
              />
            </View>
            
            <Text style={[styles.balanceAmount, { color: colors.text.primary }]}>
              £{account.balance.toFixed(2)}
            </Text>
            
            <Text style={[styles.accountType, { color: colors.text.secondary }]}>
              {getDisplayAccountType(account.type)}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Total Net Worth Card */}
        {(connectedBanks.length > 0 || accounts.length > 0) && (
          <TouchableOpacity
            style={styles.bankCard}
            onPress={() => router.push("/account")}
          >
            <View style={[styles.bankLogoContainer, { backgroundColor: colors.background.primary }]}>
              <Ionicons 
                name="trending-up" 
                size={36} 
                color={colors.primary[500]} 
              />
            </View>
            
            <Text style={[styles.balanceAmount, { color: colors.text.primary }]}>
              £{totalBalance.toFixed(2)}
            </Text>
            
            <Text style={[styles.accountType, { color: colors.text.secondary }]}>
              Total Net Worth
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Add Account Button */}
        {(connectedBanks.length > 0 || accounts.length > 0) && (
          <TouchableOpacity
            style={styles.bankCard}
            onPress={handleConnectBank}
          >
            <View style={[
              styles.bankLogoContainer,
              { 
                backgroundColor: colors.background.primary,
                borderColor: colors.primary[500],
                borderWidth: 2,
                borderStyle: 'dashed'
              }
            ]}>
              <Ionicons 
                name="add" 
                size={36} 
                color={colors.primary[500]} 
              />
            </View>
            
            <Text style={[styles.addAccountText, { color: colors.primary[500] }]}>
              Add an account
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </Card>
  );
};