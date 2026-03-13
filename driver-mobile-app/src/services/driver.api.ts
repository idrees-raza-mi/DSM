import { withAuth } from './api';

export function getMeApi(token: string) {
  return withAuth(token).get('/drivers/me');
}

export function updateProfileApi(token: string, payload: any) {
  return withAuth(token).put('/drivers/me/profile', payload);
}

export function uploadDocumentApi(token: string, payload: any) {
  return withAuth(token).post('/drivers/me/documents', payload);
}

export function listDocumentsApi(token: string) {
  return withAuth(token).get('/drivers/me/documents');
}

export function submitApplicationApi(token: string) {
  return withAuth(token).post('/drivers/me/submit-application');
}

export function getApplicationStatusApi(token: string) {
  return withAuth(token).get('/drivers/me/application-status');
}

