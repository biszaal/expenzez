import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Achievement } from '../services/api/achievementAPI';

interface CelebrationData {
  achievement: Achievement;
  celebrationMessage?: {
    title: string;
    message: string;
    pointsEarned: number;
    motivationalTip: string;
  };
}

interface AchievementContextType {
  // Achievement celebrations
  showCelebration: (data: CelebrationData) => void;
  celebrationQueue: CelebrationData[];
  currentCelebration: CelebrationData | null;
  dismissCelebration: () => void;

  // Toast notifications
  showAchievementToast: (achievement: Achievement) => void;
  toastQueue: Achievement[];
  currentToast: Achievement | null;
  dismissToast: () => void;

  // Level up celebrations
  showLevelUpCelebration: (level: number, pointsEarned: number) => void;
  levelUpData: { level: number; pointsEarned: number } | null;
  dismissLevelUp: () => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

interface AchievementProviderProps {
  children: ReactNode;
}

export const AchievementProvider: React.FC<AchievementProviderProps> = ({ children }) => {
  // Celebration state
  const [celebrationQueue, setCelebrationQueue] = useState<CelebrationData[]>([]);
  const [currentCelebration, setCurrentCelebration] = useState<CelebrationData | null>(null);

  // Toast state
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);
  const [currentToast, setCurrentToast] = useState<Achievement | null>(null);

  // Level up state
  const [levelUpData, setLevelUpData] = useState<{ level: number; pointsEarned: number } | null>(null);

  // Process celebration queue
  useEffect(() => {
    if (!currentCelebration && celebrationQueue.length > 0) {
      const [nextCelebration, ...remaining] = celebrationQueue;
      setCurrentCelebration(nextCelebration);
      setCelebrationQueue(remaining);
    }
  }, [currentCelebration, celebrationQueue]);

  // Process toast queue
  useEffect(() => {
    if (!currentToast && toastQueue.length > 0) {
      const [nextToast, ...remaining] = toastQueue;
      setCurrentToast(nextToast);
      setToastQueue(remaining);

      // Auto-dismiss toast after 3 seconds
      const timer = setTimeout(() => {
        setCurrentToast(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentToast, toastQueue]);

  const showCelebration = useCallback((data: CelebrationData) => {
    setCelebrationQueue(prev => [...prev, data]);
  }, []);

  const dismissCelebration = useCallback(() => {
    setCurrentCelebration(null);
  }, []);

  const showAchievementToast = useCallback((achievement: Achievement) => {
    setToastQueue(prev => [...prev, achievement]);
  }, []);

  const dismissToast = useCallback(() => {
    setCurrentToast(null);
  }, []);

  const showLevelUpCelebration = useCallback((level: number, pointsEarned: number) => {
    setLevelUpData({ level, pointsEarned });
  }, []);

  const dismissLevelUp = useCallback(() => {
    setLevelUpData(null);
  }, []);

  const value: AchievementContextType = {
    showCelebration,
    celebrationQueue,
    currentCelebration,
    dismissCelebration,
    showAchievementToast,
    toastQueue,
    currentToast,
    dismissToast,
    showLevelUpCelebration,
    levelUpData,
    dismissLevelUp,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievement = (): AchievementContextType => {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievement must be used within an AchievementProvider');
  }
  return context;
};