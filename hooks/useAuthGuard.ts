import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../app/auth/AuthContext";

/**
 * Custom hook to guard routes that require authentication
 * Redirects to login if user is not authenticated
 *
 * @param redirectTo - Optional custom redirect path (defaults to /auth/Login)
 * @returns Object with authentication state
 */
export function useAuthGuard(redirectTo?: string) {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();

  useEffect(() => {
    // Only redirect if auth state is loaded and user is not logged in
    if (!loading && !isLoggedIn) {
      router.replace(redirectTo || "/auth/Login");
    }
  }, [isLoggedIn, loading, router, redirectTo]);

  return {
    isLoggedIn,
    loading,
  };
}
