import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "./auth/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SplashScreen from "./SplashScreen";

export default function Index() {
  const router = useRouter();
  const auth = useAuth();
  const isLoggedIn = auth?.isLoggedIn ?? false;
  const loading = auth?.loading ?? true;

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
        });

        // Wait for auth to finish loading
        if (loading) {
          console.log("⏳ [Index] Waiting for auth to load...");
          return;
        }

        // Navigate based on auth state
        if (isLoggedIn) {
          console.log("✅ [Index] User logged in, navigating to main app");
          router.replace("/(tabs)");
        } else if (hasCompletedOnboarding) {
          console.log("🔑 [Index] Returning user, navigating to login");
          router.replace("/auth/Login");
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

    // Add a slight delay to ensure all providers are ready
    const timeout = setTimeout(() => {
      determineInitialRoute();
    }, 100);

    return () => clearTimeout(timeout);
  }, [isLoggedIn, loading, router]);

  // Show splash screen while determining route
  return <SplashScreen />;
}
