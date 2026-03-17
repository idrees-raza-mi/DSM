import { useAuthorizedClient } from './api';

export const useBillingApi = () => {
  const client = useAuthorizedClient();

  const listInvoices = (status?: string) =>
    client.get('/admin/invoices', { params: status ? { status } : {} });

  const approveInvoice = (id: string) =>
    client.post(`/admin/invoices/${id}/approve`);

  const rejectInvoice = (id: string, reason: string) =>
    client.post(`/admin/invoices/${id}/reject`, { reason });

  return {
    listInvoices,
    approveInvoice,
    rejectInvoice,
  };
};
