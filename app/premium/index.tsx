import React from "react";
import { useRouter } from "expo-router";

export default function PremiumScreen() {
  const router = useRouter();

  // Redirect to the subscription plans page
  React.useEffect(() => {
    router.replace("/subscription/plans");
  }, []);

  return null;
}
