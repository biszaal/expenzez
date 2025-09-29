import React from 'react';
import { PaywallScreen } from '../../components/PaywallScreen';
import { useRouter } from 'expo-router';

export default function PremiumScreen() {
  const router = useRouter();

  return (
    <PaywallScreen
      onClose={() => router.back()}
      feature="Premium Features"
    />
  );
}