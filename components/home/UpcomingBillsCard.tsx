import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { useTheme } from '../../contexts/ThemeContext';
import { autoBillDetection } from '../../services/automaticBillDetection';
import { SPACING } from '../../constants/Colors';

interface UpcomingBill {
  name: string;
  amount: number;
  daysUntilDue: number;
}

export const UpcomingBillsCard: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUpcomingBills = async () => {
      try {
        // getCurrentBills now uses smart caching automatically
        const detectedBills = await autoBillDetection.getCurrentBills();
        const now = dayjs();
        const next7Days = now.add(7, 'days');

        const upcoming = detectedBills
          .filter(bill => bill.status === 'active')
          .map(bill => {
            let lastDate = dayjs(bill.lastPaymentDate);
            let nextPaymentDate = dayjs(bill.nextDueDate || bill.lastPaymentDate);

            // If we don't have a future due date, calculate based on last payment + frequency
            if (nextPaymentDate.isBefore(now) || nextPaymentDate.isSame(lastDate)) {
              nextPaymentDate = lastDate;

              // Add intervals based on bill frequency until we get a future date
              while (nextPaymentDate.isBefore(now)) {
                switch (bill.frequency) {
                  case 'weekly':
                    nextPaymentDate = nextPaymentDate.add(1, 'week');
                    break;
                  case 'monthly':
                    nextPaymentDate = nextPaymentDate.add(1, 'month');
                    break;
                  case 'quarterly':
                    nextPaymentDate = nextPaymentDate.add(3, 'months');
                    break;
                  case 'yearly':
                    nextPaymentDate = nextPaymentDate.add(1, 'year');
                    break;
                  default:
                    nextPaymentDate = nextPaymentDate.add(1, 'month'); // Default to monthly
                }
              }
            }

            const daysUntilDue = nextPaymentDate.diff(now, 'days');

            return {
              name: bill.name || bill.merchant,
              amount: Math.abs(bill.amount),
              daysUntilDue
            };
          })
          .filter(bill => bill.daysUntilDue <= 7) // Next 7 days only for home widget
          .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
          .slice(0, 3); // Show max 3 bills

        console.log('[UpcomingBillsCard] Loaded upcoming bills:', {
          total: detectedBills.length,
          upcoming: upcoming.length,
          bills: upcoming.map(b => ({ name: b.name, days: b.daysUntilDue }))
        });

        setUpcomingBills(upcoming);
      } catch (error) {
        console.error('Error loading upcoming bills for home card:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUpcomingBills();
  }, []);

  const getDaysText = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days}d`;
  };

  const getDaysColor = (days: number) => {
    if (days <= 1) return '#EF4444'; // Red - urgent
    if (days <= 3) return '#F59E0B'; // Orange - soon
    return colors.text.secondary; // Normal
  };

  const formatAmount = (amount: number) => {
    return `£${amount.toFixed(0)}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary.main }]}>
              <Ionicons name="calendar" size={16} color="white" />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                Upcoming Bills
              </Text>
              <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                This week
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.background.secondary }]}
      onPress={() => router.push('/bills')}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary.main }]}>
            <Ionicons name="calendar" size={16} color="white" />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Upcoming Bills
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              This week
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      </View>

      {upcomingBills.length > 0 ? (
        <>
          <View style={styles.billsList}>
            {upcomingBills.map((bill, index) => (
              <View key={index} style={styles.billRow}>
                <Text style={[styles.billName, { color: colors.text.primary }]} numberOfLines={1}>
                  {bill.name}
                </Text>
                <View style={styles.billRight}>
                  <Text style={[styles.billAmount, { color: colors.text.primary }]}>
                    {formatAmount(bill.amount)}
                  </Text>
                  <Text style={[styles.billDays, { color: getDaysColor(bill.daysUntilDue) }]}>
                    {getDaysText(bill.daysUntilDue)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.primary.main }]}>
              View all upcoming bills →
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No bills this week
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
            Your next bills are coming up later
          </Text>
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.primary.main }]}>
              View all bills →
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  billsList: {
    gap: SPACING.sm,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  billName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: SPACING.sm,
  },
  billRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  billAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  billDays: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  footer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
});