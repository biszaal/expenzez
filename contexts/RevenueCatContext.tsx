import React, { createContext, useContext, useState, useEffect } from 'react';

interface RevenueCatContextType {
  isPro: boolean;
  isLoading: boolean;
}

const RevenueCatContext = createContext<RevenueCatContextType>({
  isPro: false,
  isLoading: false,
});

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // All users have free access to all features
  useEffect(() => {
    setIsPro(false);
    setIsLoading(false);
  }, []);

  return (
    <RevenueCatContext.Provider value={{ isPro, isLoading }}>
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};
