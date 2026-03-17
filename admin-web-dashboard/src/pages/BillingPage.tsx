import React, { useEffect, useState } from 'react';
import { useBillingApi } from '../services/billing.api';
import './BillingPage.css';

const BillingPage = () => {
  const { listInvoices, approveInvoice, rejectInvoice } = useBillingApi();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await listInvoices(statusFilter || undefined);
      setInvoices(res.data.data || []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvoices(); }, [statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      await approveInvoice(id);
      loadInvoices();
    } catch {
      alert('Failed to approve invoice');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await rejectInvoice(id, reason);
      loadInvoices();
    } catch {
      alert('Failed to reject invoice');
    }
  };

  const getStatusBadge = (status: string) => {
    const cls: Record<string, string> = {
      submitted: 'badge-yellow',
      approved: 'badge-green',
      rejected: 'badge-red',
      paid: 'badge-blue',
      pending: 'badge-gray',
    };
    return <span className={`badge ${cls[status] || 'badge-gray'}`}>{status}</span>;
  };

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & Invoices</h1>
          <p className="page-subtitle">Review and approve driver invoices</p>
        </div>
      </div>

      <div className="filters-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {loading ? (
        <div className="placeholder-card"><p>Loading invoices...</p></div>
      ) : invoices.length === 0 ? (
        <div className="placeholder-card"><p>No invoices found.</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Period</th>
              <th>Missions</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv: any) => (
              <tr key={inv._id}>
                <td>
                  <div>{inv.driver?.name || '-'}</div>
                  <div className="text-muted">{inv.driver?.email}</div>
                </td>
                <td>
                  {inv.billingPeriod
                    ? `${inv.billingPeriod.month}/${inv.billingPeriod.year}`
                    : '-'}
                </td>
                <td>{inv.billingPeriod?.totalMissions ?? '-'}</td>
                <td className="amount-cell">{inv.amount?.toFixed(2)} EUR</td>
                <td>{getStatusBadge(inv.status)}</td>
                <td>{inv.submittedAt ? new Date(inv.submittedAt).toLocaleDateString() : '-'}</td>
                <td className="action-cell">
                  {inv.status === 'submitted' && (
                    <>
                      <button className="btn-sm btn-green" onClick={() => handleApprove(inv._id)}>
                        Approve
                      </button>
                      <button className="btn-sm btn-red" onClick={() => handleReject(inv._id)}>
                        Reject
                      </button>
                    </>
                  )}
                  {inv.rejectionReason && (
                    <span className="text-muted" title={inv.rejectionReason}>Reason: {inv.rejectionReason}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BillingPage;
