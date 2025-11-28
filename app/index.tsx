import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "./auth/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SplashScreen from "./SplashScreen";

export default function Index() {
  const router = useRouter();
  const auth = useAuth();
  const isLoggedIn = auth?.isLoggedIn ?? false;
  const loading = auth?.loading ?? true;
  const [minSplashTime, setMinSplashTime] = useState(true);

  // Ensure splash screen shows for at least 2 seconds for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinSplashTime(false);
    }, 2000); // Show splash for minimum 2 seconds

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const determineInitialRoute = async () => {
      try {
        // Check onboarding completion
        const onboardingCompleted = await AsyncStorage.getItem(
          "onboarding_completed"
        );
        const hasCompletedOnboarding = onboardingCompleted === "true";

        console.log("🎯 [Index] Determining initial route:", {
          isLoggedIn,
          loading,
          hasCompletedOnboarding,
          minSplashTime,
        });

        // Wait for both auth to finish loading AND minimum splash time
        if (loading || minSplashTime) {
          console.log("⏳ [Index] Waiting for loading to complete...", {
            loading,
            minSplashTime,
          });
          return;
        }

        // Navigate based on auth state
        if (isLoggedIn) {
          console.log("✅ [Index] User logged in, navigating to main app");
          router.replace("/(tabs)");
        } else if (hasCompletedOnboarding) {
          console.log("🔑 [Index] Returning user, navigating to login");
          router.replace("/auth/login");
        } else {
          console.log("🆕 [Index] New user, navigating to onboarding");
          router.replace("/WelcomeOnboarding");
        }
      } catch (error) {
        console.error("❌ [Index] Error determining route:", error);
        // Default to onboarding on error
        router.replace("/WelcomeOnboarding");
      }
    };

    determineInitialRoute();
  }, [isLoggedIn, loading, router, minSplashTime]);

  // Show splash screen while app is loading
  return <SplashScreen />;
}
