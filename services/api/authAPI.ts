import axios from "axios";
import { api } from "../config/apiClient";

export const authAPI = {
  // Check if username already exists using the existing checkUserStatus endpoint
  checkUsernameExists: async (username: string): Promise<{ exists: boolean; error?: string }> => {
    try {
      // First try the main API Gateway
      const response = await api.post("/auth/check-user-status", { username });
      // If we get status 200, the user exists and we have their details
      if (response.status === 200 && response.data.username) {
        return { exists: true };
      }
      return { exists: false };
    } catch (error: any) {
      // Handle network errors first (no response)
      if (!error.response) {
        console.error("Username check network error:", error.message);
        // For network errors, assume username is available but show warning
        return { exists: false, error: "Network error. Username availability unknown." };
      }

      // If main API returns 404, try the fallback auth API Gateway
      if (error.response?.status === 404) {
        try {
          const fallbackResponse = await axios.post(
            "https://a95uq2n8k7.execute-api.eu-west-2.amazonaws.com/auth/check-user-status",
            { username },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          // If we get a successful response, user exists
          if (fallbackResponse.status === 200 && fallbackResponse.data.username) {
            return { exists: true };
          }
          return { exists: false };
        } catch (fallbackError: any) {
          // Handle network errors in fallback
          if (!fallbackError.response) {
            console.error("Username check fallback network error:", fallbackError.message);
            return { exists: false, error: "Network error. Username availability unknown." };
          }

          // Handle specific error status codes from the checkUserStatus Lambda
          if (fallbackError.response?.data?.error === "UserNotFoundException") {
            // User not found - username is available
            return { exists: false };
          } else if (fallbackError.response?.status === 400 && fallbackError.response?.data?.message?.includes("username")) {
            // Missing or invalid username parameter
            return { exists: false, error: "Invalid username format" };
          } else if (fallbackError.response?.status >= 500) {
            // Server error
            return { exists: false, error: "Server error. Please try again." };
          }
          
          console.error("Username check fallback error:", fallbackError);
          return { exists: false, error: "Unable to verify username availability" };
        }
      } else if (error.response?.data?.error === "UserNotFoundException") {
        // User not found - username is available
        return { exists: false };
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes("username")) {
        // Missing or invalid username parameter
        return { exists: false, error: "Invalid username format" };
      } else if (error.response?.status >= 500) {
        // Server error
        return { exists: false, error: "Server error. Please try again." };
      }
      
      console.error("Username check error:", error);
      return { exists: false, error: "Unable to verify username availability" };
    }
  },

  // Check if email already exists - disabled due to AWS Cognito security measures
  checkEmailExists: async (email: string): Promise<{ exists: boolean; error?: string }> => {
    // AWS Cognito is configured to prevent email enumeration attacks by returning
    // the same error message for both existing and non-existing emails.
    // This is good security practice but prevents reliable client-side validation.
    
    // The proper approach is to:
    // 1. Allow users to proceed through registration
    // 2. Handle email existence errors on the server side during registration
    // 3. Show appropriate error messages if registration fails due to existing email
    
    // For now, we'll just validate email format and let server-side handle existence
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { exists: false, error: "Invalid email format" };
    }
    
    // Return as available - server will validate during registration
    return { exists: false };
  },

  // Check if phone number already exists - temporarily disabled
  checkPhoneExists: async (phoneNumber: string): Promise<{ exists: boolean; error?: string }> => {
    // For now, return unavailable until we implement proper phone validation  
    return { exists: false, error: "Phone validation temporarily unavailable" };
  },

  register: async (userData: {
    username: string;
    name: string;
    given_name: string;
    family_name: string;
    email: string;
    password: string;
    phone_number: string;
    birthdate: string;
    address: string;
    gender: string;
  }) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  login: async (credentials: {
    email?: string;
    username?: string;
    password: string;
  }) => {
    try {
      const response = await api.post("/auth/login", credentials);
      console.log('🔍 [authAPI] Raw login response:', JSON.stringify(response.data, null, 2));
      console.log('🔍 [authAPI] Response.data.user:', response.data.user);
      console.log('🔍 [authAPI] Response.data.user?.username:', response.data.user?.username);
      return response.data;
    } catch (error: any) {
      console.error("❌ Login request failed:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      throw error;
    }
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post("/auth/refresh", { refreshToken });
    return response.data;
  },

  confirmSignUp: async (data: { username: string; code: string }) => {
    const response = await api.post("/auth/confirm-signup", data);
    return response.data;
  },

  resendVerification: async (data: { email?: string; username?: string }) => {
    const response = await api.post("/auth/resend-verification", data);
    return response.data;
  },

  forgotPassword: async (data: { username: string }) => {
    try {
      // Use the working Cognito endpoint first
      const authResponse = await axios.post(
        "https://u5f7pmlt88.execute-api.eu-west-2.amazonaws.com/auth/forgot-password",
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return authResponse.data;
    } catch (error: any) {
      // Fallback to main API if needed
      const response = await api.post("/auth/forgot-password", data);
      return response.data;
    }
  },

  forgotUsername: async (data: { email: string }) => {
    try {
      const response = await api.post("/auth/forgot-username", data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        try {
          // Use dedicated auth API Gateway for forgot username functionality
          const authResponse = await axios.post(
            "https://u5f7pmlt88.execute-api.eu-west-2.amazonaws.com/auth/forgot-username",
            data,
            {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 10000, // 10 second timeout
            }
          );
          return authResponse.data;
        } catch (fallbackError: any) {
          // Re-throw the original 404 error so the UI can handle it appropriately
          throw error;
        }
      }
      throw error;
    }
  },

  confirmForgotPassword: async (data: { 
    username: string; 
    confirmationCode: string; 
    newPassword: string; 
  }) => {
    try {
      const response = await api.post("/auth/confirm-forgot-password", data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Use dedicated auth API Gateway for forgot password functionality
        const authResponse = await axios.post(
          "https://u5f7pmlt88.execute-api.eu-west-2.amazonaws.com/auth/confirm-forgot-password",
          data,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        return authResponse.data;
      }
      throw error;
    }
  },

  loginWithApple: async (credentials: {
    identityToken: string;
    authorizationCode: string;
    user?: string;
    email?: string | null;
    fullName?: { givenName?: string | null; familyName?: string | null } | null;
  }) => {
    const response = await api.post("/auth/apple-login", credentials);
    return response.data;
  },
};