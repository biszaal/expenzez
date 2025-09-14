import { Alert } from "react-native";
import { useCallback } from "react";

/**
 * Custom hook for consistent alert handling across the app
 * Provides standardized alert methods with proper typing and memoization
 */
export function useAlert() {
  /**
   * Show a simple alert with title and message
   */
  const showAlert = useCallback((title: string, message?: string) => {
    Alert.alert(title, message);
  }, []);

  /**
   * Show a confirmation dialog with custom actions
   */
  const showConfirmation = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText = "Confirm",
    cancelText = "Cancel"
  ) => {
    Alert.alert(title, message, [
      {
        text: cancelText,
        style: "cancel",
        onPress: onCancel,
      },
      {
        text: confirmText,
        style: "destructive",
        onPress: onConfirm,
      },
    ]);
  }, []);

  /**
   * Show a success alert
   */
  const showSuccess = useCallback((message: string) => {
    Alert.alert("Success", message);
  }, []);

  /**
   * Show an error alert
   */
  const showError = useCallback((message: string) => {
    Alert.alert("Error", message);
  }, []);

  /**
   * Show a warning alert
   */
  const showWarning = useCallback((message: string) => {
    Alert.alert("Warning", message);
  }, []);

  return {
    showAlert,
    showConfirmation,
    showSuccess,
    showError,
    showWarning,
  };
}
