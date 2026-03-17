import { useAuthorizedClient } from './api';

export const useDriversApi = () => {
  const client = useAuthorizedClient();

  const listPendingDrivers = () => client.get('/admin/drivers/pending');
  const listAllDrivers = (params?: { status?: string; city?: string; search?: string }) =>
    client.get('/admin/drivers', { params });
  const getDriver = (id: string) => client.get(`/admin/drivers/${id}`);
  const approveDriver = (id: string) => client.post(`/admin/drivers/${id}/approve`);
  const rejectDriver = (id: string, reason?: string) =>
    client.post(`/admin/drivers/${id}/reject`, { reason });
  const requestMoreDocuments = (id: string, note: string) =>
    client.post(`/admin/drivers/${id}/request-more-documents`, { note });
  const updateDriverStatus = (id: string, status: string) =>
    client.put(`/admin/drivers/${id}/status`, { status });

  return {
    listPendingDrivers,
    listAllDrivers,
    getDriver,
    approveDriver,
    rejectDriver,
    requestMoreDocuments,
    updateDriverStatus,
  };
};

