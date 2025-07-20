import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../app/auth/AuthContext";
import { getAllAccountIds } from "../services/dataSource";

/**
 * Custom hook to guard routes that require authentication
 * Redirects to login if user is not authenticated
 * Optionally, require at least one connected bank (requireBank)
 *
 * @param redirectTo - Optional custom redirect path (defaults to /auth/Login)
 * @param requireBank - If true, also require at least one connected bank
 * @returns Object with authentication state and bank connection state
 */
export function useAuthGuard(redirectTo?: string, requireBank?: boolean) {
  const router = useRouter();
  const auth = useAuth();
  const { isLoggedIn, loading } = auth || {};
  const [hasBank, setHasBank] = useState<boolean | null>(
    !requireBank ? true : null
  );
  const [checkingBank, setCheckingBank] = useState(false);

  useEffect(() => {
    // Only redirect if auth state is loaded and user is not logged in
    if (!loading && !isLoggedIn) {
      router.replace(redirectTo || "/auth/Login");
    }
  }, [isLoggedIn, loading, router, redirectTo]);

  useEffect(() => {
    if (requireBank && isLoggedIn && !loading) {
      setCheckingBank(true);
      getAllAccountIds()
        .then((ids) => {
          setHasBank(Array.isArray(ids) && ids.length > 0);
          // Disabled: Do not redirect to /banks/connect when no bank is connected
          // if (!ids || ids.length === 0) {
          //   router.replace("/banks/connect");
          // }
        })
        .catch(() => {
          setHasBank(false);
          // Disabled: Do not redirect to /banks/connect on error
          // router.replace("/banks/connect");
        })
        .finally(() => setCheckingBank(false));
    }
  }, [requireBank, isLoggedIn, loading, router]);

  return {
    isLoggedIn: isLoggedIn || false,
    loading: loading || false,
    hasBank,
    checkingBank,
  };
}
