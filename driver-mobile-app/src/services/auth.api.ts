import { apiClient } from './api';

export function registerApi(name: string, phone: string, email: string, password: string) {
  return apiClient.post('/auth/register', { name, phone, email, password });
}

export function loginApi(emailOrPhone: string, password: string) {
  return apiClient.post('/auth/login', { emailOrPhone, password });
}

