import React from 'react';
import { View } from 'react-native';
import { DashboardSkeleton, TransactionSkeleton, ProfileSkeleton } from './SkeletonLoader';
import { ConnectionStatus } from './OfflineIndicator';

interface LoadingWrapperProps {
  loading: boolean;
  children: React.ReactNode;
  skeletonType?: 'dashboard' | 'transactions' | 'profile' | 'list';
  showOfflineStatus?: boolean;
  count?: number; // For list-type skeletons
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  children,
  skeletonType = 'dashboard',
  showOfflineStatus = true,
  count = 3,
}) => {
  if (!loading) {
    return (
      <>
        {showOfflineStatus && <ConnectionStatus />}
        {children}
      </>
    );
  }

  const renderSkeleton = () => {
    switch (skeletonType) {
      case 'dashboard':
        return <DashboardSkeleton />;
      case 'transactions':
        return (
          <View>
            {Array.from({ length: count }, (_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </View>
        );
      case 'profile':
        return <ProfileSkeleton />;
      case 'list':
        return (
          <View>
            {Array.from({ length: count }, (_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </View>
        );
      default:
        return <DashboardSkeleton />;
    }
  };

  return (
    <>
      {showOfflineStatus && <ConnectionStatus />}
      {renderSkeleton()}
    </>
  );
};

export default LoadingWrapper;