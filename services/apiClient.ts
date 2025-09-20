import axios, { AxiosInstance } from 'axios';
import { api } from './config/apiClient';

// Re-export the main api client as apiClient for compatibility
export const apiClient: AxiosInstance = api;

export default apiClient;