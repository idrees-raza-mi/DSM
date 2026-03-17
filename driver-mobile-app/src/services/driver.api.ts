import { withAuth } from './api';

// Profile
export function getMeApi(token: string) {
  return withAuth(token).get('/drivers/me');
}

export function updateProfileApi(token: string, payload: any) {
  return withAuth(token).put('/drivers/me/profile', payload);
}

// Documents
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

// Score
export function getScoreApi(token: string) {
  return withAuth(token).get('/drivers/me/score');
}

// Assignments
export function getAvailableAssignmentsApi(token: string) {
  return withAuth(token).get('/assignments/available');
}

export function reserveAssignmentApi(token: string, assignmentId: string) {
  return withAuth(token).post(`/assignments/${assignmentId}/reserve`);
}

export function getMyAssignmentsApi(token: string) {
  return withAuth(token).get('/assignments/my');
}

export function confirmAssignmentApi(token: string, bookingId: string) {
  return withAuth(token).post(`/assignments/${bookingId}/confirm`);
}

export function checkInApi(token: string, bookingId: string, code: string, lat: number, lng: number) {
  return withAuth(token).post(`/assignments/${bookingId}/check-in`, { code, lat, lng });
}

export function cancelAssignmentApi(token: string, bookingId: string) {
  return withAuth(token).post(`/assignments/${bookingId}/cancel`);
}

// Billing
export function getBillingPeriodsApi(token: string) {
  return withAuth(token).get('/billing/periods');
}

export function getBillingPeriodApi(token: string, periodId: string) {
  return withAuth(token).get(`/billing/periods/${periodId}`);
}

export function submitInvoiceApi(token: string, periodId: string, fileUrl: string, amount: number) {
  return withAuth(token).post(`/billing/periods/${periodId}/invoice`, { fileUrl, amount });
}

export function generateBillingPeriodApi(token: string, month: number, year: number) {
  return withAuth(token).post('/billing/periods/generate', { month, year });
}

