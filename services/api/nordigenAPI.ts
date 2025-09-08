import { api } from '../config/apiClient';
import axios from 'axios';
import { CURRENT_API_CONFIG } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a separate API instance without auth interceptors for callback
const noAuthAPI = axios.create({
  baseURL: CURRENT_API_CONFIG.baseURL,
  timeout: CURRENT_API_CONFIG.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Nordigen Institution Response
export interface NordigenInstitution {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  countries: string[];
  logo: string;
}

// Nordigen Requisition Response
export interface NordigenRequisition {
  id: string;
  created: string;
  redirect: string;
  status: string;
  institution_id: string;
  agreement: string;
  reference: string;
  accounts: string[];
  user_language: string;
  link: string;
  ssn?: string;
  account_selection: boolean;
  redirect_immediate: boolean;
}

// Nordigen Account Response
export interface NordigenAccount {
  account_id: string;
  name: string;
  official_name: string;
  type: string;
  subtype: string;
  balances: {
    available: number;
    current: number;
    iso_currency_code: string;
  };
  mask: string;
  provider: string;
  connectedAt: number;
  lastSyncAt: number;
  status: string;
}

// Nordigen Transaction Response
export interface NordigenTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  iso_currency_code: string;
  name: string;
  date: string;
  category: string[];
  merchant_name?: string;
  provider: string;
}

export interface NordigenAPIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  // Legacy compatibility properties
  banks?: any[];
  connections?: any[];
  stats?: any;
  expiredConnections?: any[];
  link?: string;
  authUrl?: string;
  authorizationUrl?: string;
  requisition?: any;
}

export const nordigenAPI = {
  // Get available institutions (banks) by country
  getInstitutions: async (country: string = 'GB'): Promise<NordigenAPIResponse<{ institutions: NordigenInstitution[]; country: string }>> => {
    console.log(`🏦 [NordigenAPI] Fetching institutions for country: ${country}`);
    const response = await api.get(`/nordigen/institutions?country=${country}`);
    return response.data;
  },

  // Create requisition (authorization link)
  createRequisition: async (institutionId: string, reference?: string): Promise<NordigenAPIResponse<{ requisition: NordigenRequisition; authorizationUrl: string }>> => {
    console.log(`🏦 [NordigenAPI] Creating requisition for institution: ${institutionId}`);
    const response = await api.post('/nordigen/create-requisition', {
      institutionId,
      reference
    });
    return response.data;
  },

  // Handle callback after user consent (uses authenticated API to ensure correct user ID)
  handleCallback: async (requisitionId: string): Promise<NordigenAPIResponse<{ requisition: NordigenRequisition; connectedAccounts: number; banks: any[] }>> => {
    console.log(`🏦 [NordigenAPI] Processing callback for requisition: ${requisitionId}`);
    
    // Get current user ID to include in request
    let userId;
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        userId = userData.id;
      }
    } catch (error) {
      console.warn('Could not get user ID from storage:', error);
    }
    
    const response = await api.post('/nordigen/callback', {
      requisitionId,
      userId // Include user ID to ensure data is saved under correct user
    });
    return response.data;
  },

  // Get connected accounts
  getAccounts: async (): Promise<NordigenAPIResponse<{ accounts: NordigenAccount[] }>> => {
    console.log('🏦 [NordigenAPI] Fetching accounts');
    const response = await api.get('/nordigen/accounts');
    return response.data;
  },

  // Get transactions
  getTransactions: async (params?: {
    account_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<NordigenAPIResponse<{ transactions: NordigenTransaction[] }>> => {
    console.log('🏦 [NordigenAPI] Fetching transactions', params);
    
    const queryParams = new URLSearchParams();
    if (params?.account_id) queryParams.append('account_id', params.account_id);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `/nordigen/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  // Sync transactions (refresh data)
  syncTransactions: async (): Promise<NordigenAPIResponse<{ message: string; success: boolean }>> => {
    console.log('🏦 [NordigenAPI] Syncing transactions');
    // For now, just return success - in future this could trigger a background sync
    return {
      success: true,
      data: {
        message: 'Transaction sync initiated',
        success: true
      }
    };
  }
};