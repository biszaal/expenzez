import { Alert } from "react-native";

/**
 * Custom hook for consistent alert handling across the app
 * Provides standardized alert methods with proper typing
 */
export function useAlert() {
  /**
   * Show a simple alert with title and message
   */
  const showAlert = (title: string, message?: string) => {
    Alert.alert(title, message);
  };

  /**
   * Show a confirmation dialog with custom actions
   */
  const showConfirmation = (
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
  };

  /**
   * Show a success alert
   */
  const showSuccess = (message: string) => {
    Alert.alert("Success", message);
  };

  /**
   * Show an error alert
   */
  const showError = (message: string) => {
    Alert.alert("Error", message);
  };

  /**
   * Show a warning alert
   */
  const showWarning = (message: string) => {
    Alert.alert("Warning", message);
  };

  return {
    showAlert,
    showConfirmation,
    showSuccess,
    showError,
    showWarning,
  };
}
