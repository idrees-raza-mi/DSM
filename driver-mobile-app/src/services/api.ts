import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// On physical devices, localhost points to the phone itself.
// Use your computer's local network IP instead.
// You can override this via Expo extra config in app.json.
const getBaseUrl = (): string => {
  const extra = Constants.expoConfig?.extra;
  if (extra?.apiUrl) return extra.apiUrl;

  // Android emulator uses 10.0.2.2 to reach host machine
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  // iOS simulator can use localhost
  if (Platform.OS === 'ios') return 'http://localhost:4000';
  // Web or fallback
  return 'http://localhost:4000';
};

const API_BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

export function withAuth(token: string) {
  const client = apiClient.create();
  client.interceptors.request.use((config) => {
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return client;
}

