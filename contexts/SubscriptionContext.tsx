import React, { createContext, useContext, useState, useEffect } from 'react';

interface Subscription {
  tier: 'free' | 'premium';
  trialEndDate?: string;
}

interface SubscriptionContextType {
  subscription: Subscription;
  isTrialActive: boolean;
  daysUntilTrialExpires: number | null;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: { tier: 'free' },
  isTrialActive: false,
  daysUntilTrialExpires: null,
  isLoading: false,
});

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription>({ tier: 'free' });
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [daysUntilTrialExpires, setDaysUntilTrialExpires] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // All users have free access
  useEffect(() => {
    setSubscription({ tier: 'free' });
    setIsTrialActive(false);
    setDaysUntilTrialExpires(null);
    setIsLoading(false);
  }, []);

  return (
    <SubscriptionContext.Provider value={{ 
      subscription, 
      isTrialActive, 
      daysUntilTrialExpires, 
      isLoading 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
