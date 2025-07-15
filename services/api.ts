import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Linking } from "react-native";

// API Configuration
const API_BASE_URL = "http://192.168.0.93:3001/api"; // Updated for mobile access on local network

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("isLoggedIn");
      // You might want to redirect to login here
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  register: async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },
};

// Banking API functions
export const bankingAPI = {
  // Connect a bank account using Nordigen
  connectBank: async (data: {
    institutionId: string;
    redirectUrl?: string;
  }) => {
    const response = await api.post("/banking/connect", data);
    return response.data;
  },

  // Test Nordigen connection
  testNordigen: async () => {
    const response = await api.get("/banking/test-nordigen");
    return response.data;
  },

  // Get available institutions
  getInstitutions: async (country?: string) => {
    const response = await api.get("/banking/institutions", {
      params: { country: country || "gb" },
    });
    return response.data;
  },

  // Get connected accounts
  getAccounts: async () => {
    const response = await api.get("/banking/accounts");
    return response.data;
  },

  // Get account transactions
  getTransactions: async (
    accountId: string,
    params?: { from?: string; to?: string }
  ) => {
    const response = await api.get(
      `/banking/accounts/${accountId}/transactions`,
      { params }
    );
    return response.data;
  },

  // Get account balance
  getBalance: async (accountId: string) => {
    const response = await api.get(`/banking/accounts/${accountId}/balance`);
    return response.data;
  },

  // Sync accounts (refresh data from bank)
  syncAccounts: async () => {
    const response = await api.post("/banking/sync");
    return response.data;
  },

  // Disconnect bank account
  disconnectAccount: async (accountId: string) => {
    const response = await api.delete(`/banking/accounts/${accountId}`);
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  const response = await api.get("/health");
  return response.data;
};

export default api;
