import React, { useEffect, useState } from 'react';
import { useAnalyticsApi } from '../services/analytics.api';
import './AnalyticsPage.css';

const AnalyticsPage = () => {
  const { getOverview, getLocations, getBilling } = useAnalyticsApi();
  const [overview, setOverview] = useState<any>(null);
  const [locationStats, setLocationStats] = useState<any[]>([]);
  const [billingStats, setBillingStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [oRes, lRes, bRes] = await Promise.all([
          getOverview(),
          getLocations(),
          getBilling(),
        ]);
        setOverview(oRes.data.data);
        setLocationStats(lRes.data.data || []);
        setBillingStats(bRes.data.data);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(() => load(true), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="page-root"><div className="placeholder-card"><p>Loading analytics...</p></div></div>;
  }

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Live overview of all operations</p>
        </div>
      </div>

      {/* KPI Cards */}
      {overview && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Total Drivers</div>
            <div className="kpi-value">{overview.drivers.total}</div>
            <div className="kpi-detail">
              {overview.drivers.active} active, {overview.drivers.pending} pending
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total Bookings</div>
            <div className="kpi-value">{overview.bookings.total}</div>
            <div className="kpi-detail">{overview.bookings.completed} completed</div>
          </div>
          <div className="kpi-card kpi-warn">
            <div className="kpi-label">No-Show Rate</div>
            <div className="kpi-value">{overview.rates.noShowRate}%</div>
            <div className="kpi-detail">{overview.bookings.noShows} total no-shows</div>
          </div>
          <div className="kpi-card kpi-warn">
            <div className="kpi-label">Cancellation Rate</div>
            <div className="kpi-value">{overview.rates.cancellationRate}%</div>
            <div className="kpi-detail">{overview.bookings.cancellations} cancellations</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Completion Rate</div>
            <div className="kpi-value">{overview.rates.completionRate}%</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Active Assignments</div>
            <div className="kpi-value">{overview.assignments.total}</div>
          </div>
        </div>
      )}

      {/* Driver Rankings */}
      {overview && (
        <div className="section-grid">
          <div className="section-card">
            <h3>Top Drivers</h3>
            {overview.topDrivers.length === 0 ? (
              <p className="text-muted">No active drivers yet</p>
            ) : (
              <table className="mini-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Score</th></tr>
                </thead>
                <tbody>
                  {overview.topDrivers.map((d: any) => (
                    <tr key={d._id}>
                      <td>{d.name}</td>
                      <td>{d.email}</td>
                      <td><span className="badge badge-green">{d.currentScore}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="section-card">
            <h3>Problem Drivers</h3>
            {overview.problemDrivers.length === 0 ? (
              <p className="text-muted">No problem drivers</p>
            ) : (
              <table className="mini-table">
                <thead>
                  <tr><th>Name</th><th>Score</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {overview.problemDrivers.map((d: any) => (
                    <tr key={d._id}>
                      <td>{d.name}</td>
                      <td><span className="badge badge-red">{d.currentScore}</span></td>
                      <td>{d.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Location Occupancy */}
      {locationStats.length > 0 && (
        <div className="section-card">
          <h3>Occupancy per Location</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>City</th>
                <th>Assignments</th>
                <th>Capacity</th>
                <th>Bookings</th>
                <th>Fill Rate</th>
                <th>No-Shows</th>
              </tr>
            </thead>
            <tbody>
              {locationStats.map((l: any) => (
                <tr key={l.location.id}>
                  <td>{l.location.name}</td>
                  <td>{l.location.city}</td>
                  <td>{l.totalAssignments}</td>
                  <td>{l.totalCapacity}</td>
                  <td>{l.totalBookings}</td>
                  <td>
                    <span className={`badge ${l.fillRate >= 80 ? 'badge-green' : l.fillRate >= 50 ? 'badge-yellow' : 'badge-red'}`}>
                      {l.fillRate}%
                    </span>
                  </td>
                  <td>{l.noShows}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Billing Overview */}
      {billingStats && (
        <div className="section-card">
          <h3>Billing Overview</h3>
          <div className="kpi-grid kpi-grid-small">
            <div className="kpi-card">
              <div className="kpi-label">Pending Invoices</div>
              <div className="kpi-value">{billingStats.pending}</div>
              <div className="kpi-detail">{billingStats.totalPendingAmount.toFixed(2)} EUR</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Approved</div>
              <div className="kpi-value">{billingStats.approved}</div>
              <div className="kpi-detail">{billingStats.totalApprovedAmount.toFixed(2)} EUR</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Rejected</div>
              <div className="kpi-value">{billingStats.rejected}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Paid</div>
              <div className="kpi-value">{billingStats.paid}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
