import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../../contexts/NetworkContext';
import { useTheme } from '../../contexts/ThemeContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isConnected } = useNetwork();
  const { colors } = useTheme();
  const slideAnim = React.useRef(new Animated.Value(-50)).current;

  React.useEffect(() => {
    if (!isOnline) {
      // Slide down
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide up and hide
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, slideAnim]);

  if (isOnline && isConnected) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.error.main || '#FF6B6B',
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Ionicons 
        name="cloud-offline-outline" 
        size={16} 
        color="white" 
        style={styles.icon} 
      />
      <Text style={styles.text}>
        {!isConnected ? 'No internet connection' : 'Connection unstable'}
      </Text>
    </Animated.View>
  );
};

const ConnectionStatus: React.FC = () => {
  const { isOnline, connectionType } = useNetwork();
  const { colors } = useTheme();

  if (isOnline) {
    return null;
  }

  return (
    <View style={[styles.statusContainer, { backgroundColor: colors.background.secondary }]}>
      <Ionicons 
        name="information-circle-outline" 
        size={20} 
        color={colors.text.secondary} 
        style={styles.statusIcon} 
      />
      <Text style={[styles.statusText, { color: colors.text.secondary }]}>
        You&apos;re offline. Showing cached data.
      </Text>
    </View>
  );
};

export { ConnectionStatus };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  statusIcon: {
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    flex: 1,
  },
});