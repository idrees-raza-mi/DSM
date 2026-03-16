import React, { useEffect, useState } from 'react';
import { useAssignmentsApi } from '../services/assignments.api';
import './DeploymentManagementPage.css';

const DeploymentManagementPage = () => {
  const { listAssignments, createAssignment, listLocations, createLocation } = useAssignmentsApi();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLocForm, setShowLocForm] = useState(false);

  const [form, setForm] = useState({
    locationId: '',
    date: '',
    timeSlot: 'morning',
    requiredDrivers: 10,
    compensation: 50,
  });

  const [locForm, setLocForm] = useState({
    name: '',
    city: '',
    address: '',
    lat: '',
    lng: '',
    overbookingPercent: 5,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFilter) params.date = dateFilter;
      if (cityFilter) params.city = cityFilter;
      const [aRes, lRes] = await Promise.all([
        listAssignments(params),
        listLocations(),
      ]);
      setAssignments(aRes.data.data || []);
      setLocations(lRes.data.data || []);
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [dateFilter, cityFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAssignment(form);
      setShowForm(false);
      setForm({ locationId: '', date: '', timeSlot: 'morning', requiredDrivers: 10, compensation: 50 });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLocation({
        ...locForm,
        lat: parseFloat(locForm.lat),
        lng: parseFloat(locForm.lng),
      });
      setShowLocForm(false);
      setLocForm({ name: '', city: '', address: '', lat: '', lng: '', overbookingPercent: 5 });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create location');
    }
  };

  const slotLabel: Record<string, string> = { morning: 'Morning', midday: 'Midday', evening: 'Evening' };

  const getRiskLevel = (a: any) => {
    const fillRate = a.stats.total / a.requiredDrivers;
    if (fillRate >= 1) return <span className="badge badge-green">Filled</span>;
    if (fillRate >= 0.7) return <span className="badge badge-yellow">Moderate</span>;
    return <span className="badge badge-red">At Risk</span>;
  };

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Deployments</h1>
          <p className="page-subtitle">Manage assignments, capacity, and overbooking per slot</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={() => setShowLocForm(!showLocForm)}>
            {showLocForm ? 'Cancel' : 'New Location'}
          </button>
          <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'New Deployment'}
          </button>
        </div>
      </div>

      {showLocForm && (
        <form onSubmit={handleCreateLocation} className="create-form">
          <h3>Create Location</h3>
          <div className="form-grid">
            <input placeholder="Location name" required value={locForm.name}
              onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} />
            <input placeholder="City" required value={locForm.city}
              onChange={(e) => setLocForm({ ...locForm, city: e.target.value })} />
            <input placeholder="Address" required value={locForm.address}
              onChange={(e) => setLocForm({ ...locForm, address: e.target.value })} />
            <input placeholder="Latitude" required type="number" step="any" value={locForm.lat}
              onChange={(e) => setLocForm({ ...locForm, lat: e.target.value })} />
            <input placeholder="Longitude" required type="number" step="any" value={locForm.lng}
              onChange={(e) => setLocForm({ ...locForm, lng: e.target.value })} />
            <input placeholder="Overbooking %" type="number" value={locForm.overbookingPercent}
              onChange={(e) => setLocForm({ ...locForm, overbookingPercent: parseInt(e.target.value) })} />
          </div>
          <button type="submit" className="btn-primary">Create Location</button>
        </form>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="create-form">
          <h3>Create Deployment</h3>
          <div className="form-grid">
            <select required value={form.locationId}
              onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
              <option value="">Select location</option>
              {locations.map((l: any) => (
                <option key={l._id} value={l._id}>{l.name} ({l.city})</option>
              ))}
            </select>
            <input type="date" required value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <select value={form.timeSlot}
              onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}>
              <option value="morning">Morning</option>
              <option value="midday">Midday</option>
              <option value="evening">Evening</option>
            </select>
            <input type="number" placeholder="Required drivers" min="1" required
              value={form.requiredDrivers}
              onChange={(e) => setForm({ ...form, requiredDrivers: parseInt(e.target.value) })} />
            <input type="number" placeholder="Compensation (EUR)" min="0" step="0.01" required
              value={form.compensation}
              onChange={(e) => setForm({ ...form, compensation: parseFloat(e.target.value) })} />
          </div>
          <button type="submit" className="btn-primary">Create Deployment</button>
        </form>
      )}

      <div className="filters-bar">
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
          className="filter-input" placeholder="Filter by date" />
        <input type="text" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
          className="filter-input" placeholder="Filter by city" />
      </div>

      {loading ? (
        <div className="placeholder-card"><p>Loading deployments...</p></div>
      ) : assignments.length === 0 ? (
        <div className="placeholder-card"><p>No deployments found. Create one above.</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>City</th>
              <th>Date</th>
              <th>Slot</th>
              <th>Capacity</th>
              <th>Booked</th>
              <th>Confirmed</th>
              <th>Checked In</th>
              <th>No-Shows</th>
              <th>Risk</th>
              <th>Pay</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a: any) => (
              <tr key={a._id}>
                <td>{a.location?.name || '-'}</td>
                <td>{a.location?.city || '-'}</td>
                <td>{new Date(a.date).toLocaleDateString()}</td>
                <td>{slotLabel[a.timeSlot] || a.timeSlot}</td>
                <td>{a.requiredDrivers} (+{a.maxDrivers - a.requiredDrivers})</td>
                <td>{a.stats?.reserved || 0}</td>
                <td>{a.stats?.confirmed || 0}</td>
                <td>{a.stats?.checkedIn || 0}</td>
                <td>{a.stats?.noShows || 0}</td>
                <td>{getRiskLevel(a)}</td>
                <td>{a.compensation} EUR</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DeploymentManagementPage;
