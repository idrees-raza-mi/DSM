import { useAuthorizedClient } from './api';

export const useDriversApi = () => {
  const client = useAuthorizedClient();

  const listPendingDrivers = () => client.get('/admin/drivers/pending');
  const getDriver = (id: string) => client.get(`/admin/drivers/${id}`);
  const approveDriver = (id: string) => client.post(`/admin/drivers/${id}/approve`);
  const rejectDriver = (id: string) => client.post(`/admin/drivers/${id}/reject`);

  return {
    listPendingDrivers,
    getDriver,
    approveDriver,
    rejectDriver,
  };
};

