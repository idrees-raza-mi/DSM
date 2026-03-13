import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const API_BASE_URL = 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

export const useAuthorizedClient = () => {
  const { token } = useAuth();
  const client = apiClient.create();
  client.interceptors.request.use((config) => {
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return client;
};

