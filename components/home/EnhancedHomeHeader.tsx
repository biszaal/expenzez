import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../app/auth/AuthContext';
import { APP_STRINGS } from '../../constants/strings';

export const EnhancedHomeHeader: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();

  return (
    <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
      <View style={styles.headerLeft}>
        <View style={styles.greetingContainer}>
          <Text style={[styles.greeting, { color: colors.text.primary }]}>
            {user?.name ? `Hi, ${user.name.split(" ")[0]}` : 'Welcome back'}
          </Text>
          <Text style={[styles.subGreeting, { color: colors.text.secondary }]}>
            Let&apos;s manage your finances
          </Text>
        </View>
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={[styles.notificationButton, { backgroundColor: colors.background.secondary }]}
          onPress={() => router.push("/notifications")}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.primary.main} />
          {unreadCount > 0 && (
            <View style={[styles.notificationBadge, { backgroundColor: colors.error.main }]}>
              <Text style={[styles.badgeText, { color: colors.background.primary }]}>
                {unreadCount > 99 ? '99+' : unreadCount.toString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.profileButton, { backgroundColor: colors.background.secondary }]}
          onPress={() => router.push("/profile")}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={22} color={colors.primary.main} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = {
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greetingContainer: {
    flexDirection: 'column' as const,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  subGreeting: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    position: 'relative' as const,
  },
  notificationBadge: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
};
