import React, { useEffect, useState } from 'react';
import { useDriversApi } from '../services/drivers.api';
import './DriverApprovalPage.css';

type Driver = {
  _id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status: string;
};

const DriverApprovalPage = () => {
  const { listPendingDrivers, approveDriver, rejectDriver } = useDriversApi();
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const load = async () => {
    const res = await listPendingDrivers();
    setDrivers(res.data.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: string) => {
    await approveDriver(id);
    await load();
  };

  const handleReject = async (id: string) => {
    await rejectDriver(id);
    await load();
  };

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver approvals</h1>
          <p className="page-subtitle">Review new driver applications and activate eligible drivers.</p>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((d) => (
            <tr key={d._id}>
              <td>{d.fullName ?? '—'}</td>
              <td>{d.email ?? '—'}</td>
              <td>{d.phone ?? '—'}</td>
              <td>{d.status}</td>
              <td>
                <button type="button" className="btn-approve" onClick={() => handleApprove(d._id)}>
                  Approve
                </button>
                <button type="button" className="btn-reject" onClick={() => handleReject(d._id)}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
          {drivers.length === 0 && (
            <tr>
              <td colSpan={5} className="table-empty">
                No pending applications.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DriverApprovalPage;

