import React, { useEffect, useState } from 'react';
import { useDriversApi } from '../services/drivers.api';
import './DriverListPage.css';

const DriverListPage = () => {
  const { listAllDrivers, updateDriverStatus } = useDriversApi();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await listAllDrivers(params);
      setDrivers(res.data.data || []);
    } catch {
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDrivers();
  };

  const handleStatusChange = async (driverId: string, newStatus: string) => {
    try {
      await updateDriverStatus(driverId, newStatus);
      loadDrivers();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <span className="badge badge-green">Priority ({score})</span>;
    if (score >= 70) return <span className="badge badge-blue">Normal ({score})</span>;
    if (score >= 60) return <span className="badge badge-yellow">Limited ({score})</span>;
    return <span className="badge badge-red">Restricted ({score})</span>;
  };

  const getStatusBadge = (status: string) => {
    const cls: Record<string, string> = {
      active: 'badge-green',
      under_review: 'badge-yellow',
      restricted: 'badge-orange',
      blocked: 'badge-red',
    };
    return <span className={`badge ${cls[status] || 'badge-gray'}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Drivers</h1>
          <p className="page-subtitle">{drivers.length} driver(s) found</p>
        </div>
      </div>

      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="under_review">Under Review</option>
          <option value="restricted">Restricted</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {loading ? (
        <div className="placeholder-card"><p>Loading drivers...</p></div>
      ) : drivers.length === 0 ? (
        <div className="placeholder-card"><p>No drivers found.</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>City</th>
              <th>Status</th>
              <th>Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d: any) => (
              <tr key={d._id}>
                <td>{d.name}</td>
                <td>{d.email}</td>
                <td>{d.phone}</td>
                <td>{d.city || '-'}</td>
                <td>{getStatusBadge(d.status)}</td>
                <td>{getScoreBadge(d.currentScore ?? 100)}</td>
                <td className="action-cell">
                  {d.status === 'active' && (
                    <button className="btn-sm btn-orange" onClick={() => handleStatusChange(d._id, 'restricted')}>
                      Restrict
                    </button>
                  )}
                  {d.status === 'restricted' && (
                    <button className="btn-sm btn-green" onClick={() => handleStatusChange(d._id, 'active')}>
                      Activate
                    </button>
                  )}
                  {d.status !== 'blocked' && (
                    <button className="btn-sm btn-red" onClick={() => handleStatusChange(d._id, 'blocked')}>
                      Block
                    </button>
                  )}
                  {d.status === 'blocked' && (
                    <button className="btn-sm btn-green" onClick={() => handleStatusChange(d._id, 'active')}>
                      Unblock
                    </button>
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

export default DriverListPage;
