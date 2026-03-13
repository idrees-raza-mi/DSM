import { apiClient } from './api';

export function loginAdminApi(email: string, password: string) {
  // For now this reuses the same auth endpoint; in a fuller implementation,
  // admins would be created with the ADMIN role and authenticated here.
  return apiClient.post('/auth/login', { emailOrPhone: email, password });
}

