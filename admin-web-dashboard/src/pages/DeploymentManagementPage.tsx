import React, { useEffect, useRef, useState } from 'react';
import { useAssignmentsApi } from '../services/assignments.api';
import './DeploymentManagementPage.css';

const slotLabel: Record<string, string> = { morning: 'Morning', midday: 'Midday', evening: 'Evening' };

// ── In-page modal ────────────────────────────────────────────────
type ModalState = {
  title: string;
  message: string;
  variant: 'danger' | 'warning' | 'info';
  confirmLabel: string;
  onConfirm: () => void;
} | null;

const Modal = ({ modal, onClose }: { modal: NonNullable<ModalState>; onClose: () => void }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <h3 className={`modal-title modal-title-${modal.variant}`}>{modal.title}</h3>
      <p className="modal-message">{modal.message}</p>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className={`btn-primary modal-confirm-${modal.variant}`}
          onClick={() => { modal.onConfirm(); onClose(); }}
        >
          {modal.confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ── Page ─────────────────────────────────────────────────────────
const DeploymentManagementPage = () => {
  const {
    listAssignments, createAssignment, updateAssignment, deleteAssignment, setAssignmentActive,
    listLocations, createLocation,
  } = useAssignmentsApi();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [locations, setLocations]     = useState<any[]>([]);
  const [dateFilter, setDateFilter]   = useState('');
  const [cityFilter, setCityFilter]   = useState('');
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [showLocForm, setShowLocForm] = useState(false);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editForm, setEditForm]       = useState<any>({});
  const [modal, setModal]             = useState<ModalState>(null);
  const [toast, setToast]             = useState<string | null>(null);

  const [form, setForm] = useState({
    locationId: '', date: '', timeSlot: 'morning', requiredDrivers: 10, compensation: 50,
  });
  const [locForm, setLocForm] = useState({
    name: '', city: '', address: '', lat: '', lng: '', overbookingPercent: 5,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openModal = (m: NonNullable<ModalState>) => setModal(m);

  // ── Data loading ─────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFilter) params.date = dateFilter;
      if (cityFilter) params.city = cityFilter;
      const [aRes, lRes] = await Promise.all([listAssignments(params), listLocations()]);
      setAssignments(aRes.data.data || []);
      setLocations(lRes.data.data || []);
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDataRef = useRef(loadData);
  useEffect(() => { loadDataRef.current = loadData; });
  useEffect(() => { loadData(); }, [dateFilter, cityFilter]);
  useEffect(() => {
    const interval = setInterval(() => loadDataRef.current(), 30_000);
    return () => clearInterval(interval);
  }, []);

  // ── Create deployment ────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAssignment(form);
      setShowForm(false);
      setForm({ locationId: '', date: '', timeSlot: 'morning', requiredDrivers: 10, compensation: 50 });
      loadData();
      showToast('Deployment created successfully.');
    } catch (err: any) {
      openModal({ title: 'Error', message: err.response?.data?.message || 'Failed to create deployment.', variant: 'danger', confirmLabel: 'OK', onConfirm: () => {} });
    }
  };

  // ── Create location ──────────────────────────────────────────
  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLocation({ ...locForm, lat: parseFloat(locForm.lat), lng: parseFloat(locForm.lng) });
      setShowLocForm(false);
      setLocForm({ name: '', city: '', address: '', lat: '', lng: '', overbookingPercent: 5 });
      loadData();
      showToast('Location created.');
    } catch (err: any) {
      openModal({ title: 'Error', message: err.response?.data?.message || 'Failed to create location.', variant: 'danger', confirmLabel: 'OK', onConfirm: () => {} });
    }
  };

  // ── Edit ─────────────────────────────────────────────────────
  const startEdit = (a: any) => {
    setEditingId(a._id);
    setExpandedId(null);
    setEditForm({ requiredDrivers: a.requiredDrivers, compensation: a.compensation, timeSlot: a.timeSlot, checkinCode: a.checkinCode });
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateAssignment(id, editForm);
      setEditingId(null);
      loadData();
      showToast('Deployment updated.');
    } catch (err: any) {
      openModal({ title: 'Update failed', message: err.response?.data?.message || 'Failed to update.', variant: 'danger', confirmLabel: 'OK', onConfirm: () => {} });
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = (a: any) => {
    const activeCount = (a.stats?.reserved || 0) + (a.stats?.confirmed || 0) + (a.stats?.checkedIn || 0);
    if (activeCount > 0) {
      openModal({
        title: 'Cannot Delete',
        message: `This deployment has ${activeCount} active booking(s). Deactivate it instead to hide it from drivers without losing booking data.`,
        variant: 'warning',
        confirmLabel: 'OK',
        onConfirm: () => {},
      });
      return;
    }
    openModal({
      title: 'Delete Deployment',
      message: `Permanently delete the deployment at ${a.location?.name} on ${new Date(a.date).toLocaleDateString()}? This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteAssignment(a._id);
          loadData();
          showToast('Deployment deleted.');
        } catch (err: any) {
          openModal({ title: 'Error', message: err.response?.data?.message || 'Failed to delete.', variant: 'danger', confirmLabel: 'OK', onConfirm: () => {} });
        }
      },
    });
  };

  // ── Toggle active ────────────────────────────────────────────
  const handleToggleActive = (a: any) => {
    const action = a.isActive ? 'Deactivate' : 'Activate';
    openModal({
      title: `${action} Deployment`,
      message: a.isActive
        ? 'Deactivating will hide this deployment from drivers. Existing bookings are kept.'
        : 'Activating will make this deployment visible to drivers again.',
      variant: a.isActive ? 'warning' : 'info',
      confirmLabel: action,
      onConfirm: async () => {
        try {
          await setAssignmentActive(a._id, !a.isActive);
          loadData();
          showToast(`Deployment ${a.isActive ? 'deactivated' : 'activated'}.`);
        } catch (err: any) {
          openModal({ title: 'Error', message: err.response?.data?.message || 'Failed.', variant: 'danger', confirmLabel: 'OK', onConfirm: () => {} });
        }
      },
    });
  };

  const getRiskBadge = (a: any) => {
    const total = (a.stats?.reserved || 0) + (a.stats?.confirmed || 0) + (a.stats?.checkedIn || 0);
    const fillRate = a.requiredDrivers > 0 ? total / a.requiredDrivers : 0;
    if (fillRate >= 1) return <span className="badge badge-green">Filled</span>;
    if (fillRate >= 0.7) return <span className="badge badge-yellow">Moderate</span>;
    return <span className="badge badge-red">At Risk</span>;
  };

  return (
    <div className="page-root">
      {/* ── In-page modal ── */}
      {modal && <Modal modal={modal} onClose={() => setModal(null)} />}

      {/* ── Toast ── */}
      {toast && <div className="toast">{toast}</div>}

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Deployments</h1>
          <p className="page-subtitle">Create, edit, deactivate and delete deployment slots</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={() => setShowLocForm(!showLocForm)}>
            {showLocForm ? 'Cancel' : 'New Location'}
          </button>
          <button type="button" className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Deployment'}
          </button>
        </div>
      </div>

      {/* ── New Location form ── */}
      {showLocForm && (
        <form onSubmit={handleCreateLocation} className="create-form">
          <h3>Create Location</h3>
          <div className="form-grid">
            <input placeholder="Location name" required value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} />
            <input placeholder="City" required value={locForm.city} onChange={(e) => setLocForm({ ...locForm, city: e.target.value })} />
            <input placeholder="Address" required value={locForm.address} onChange={(e) => setLocForm({ ...locForm, address: e.target.value })} />
            <input placeholder="Latitude" required type="number" step="any" value={locForm.lat} onChange={(e) => setLocForm({ ...locForm, lat: e.target.value })} />
            <input placeholder="Longitude" required type="number" step="any" value={locForm.lng} onChange={(e) => setLocForm({ ...locForm, lng: e.target.value })} />
            <input placeholder="Overbooking %" type="number" value={locForm.overbookingPercent} onChange={(e) => setLocForm({ ...locForm, overbookingPercent: parseInt(e.target.value) })} />
          </div>
          <button type="submit" className="btn-primary">Create Location</button>
        </form>
      )}

      {/* ── New Deployment form ── */}
      {showForm && (
        <form onSubmit={handleCreate} className="create-form">
          <h3>Create Deployment</h3>
          <div className="form-grid">
            <select required value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
              <option value="">Select location</option>
              {locations.map((l: any) => <option key={l._id} value={l._id}>{l.name} ({l.city})</option>)}
            </select>
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <select value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}>
              <option value="morning">Morning</option>
              <option value="midday">Midday</option>
              <option value="evening">Evening</option>
            </select>
            <input type="number" placeholder="Required drivers" min="1" required value={form.requiredDrivers}
              onChange={(e) => setForm({ ...form, requiredDrivers: parseInt(e.target.value) })} />
            <input type="number" placeholder="Compensation (EUR)" min="0" step="0.01" required value={form.compensation}
              onChange={(e) => setForm({ ...form, compensation: parseFloat(e.target.value) })} />
          </div>
          <button type="submit" className="btn-primary">Create Deployment</button>
        </form>
      )}

      {/* ── Filters ── */}
      <div className="filters-bar">
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="filter-input" />
        <input type="text" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="filter-input" placeholder="Filter by city" />
        <button type="button" className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={loadData}>↻ Refresh</button>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="placeholder-card"><p>Loading deployments...</p></div>
      ) : assignments.length === 0 ? (
        <div className="placeholder-card"><p>No deployments found. Create one above.</p></div>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>City</th>
                <th>Date</th>
                <th>Slot</th>
                <th>Cap.</th>
                <th>Booked</th>
                <th>Conf.</th>
                <th>Risk</th>
                <th>Pay</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a: any) => (
                <React.Fragment key={a._id}>
                  {/* ── Main row ── */}
                  <tr style={{ opacity: a.isActive ? 1 : 0.45 }}>
                    <td className="td-bold">{a.location?.name || '-'}</td>
                    <td>{a.location?.city || '-'}</td>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td>{slotLabel[a.timeSlot] || a.timeSlot}</td>
                    <td>{a.requiredDrivers}<span className="td-muted"> +{a.maxDrivers - a.requiredDrivers}</span></td>
                    <td>{a.stats?.reserved || 0}</td>
                    <td>{a.stats?.confirmed || 0}</td>
                    <td>{getRiskBadge(a)}</td>
                    <td className="td-bold">{a.compensation} EUR</td>
                    <td>
                      <div className="action-grid">
                        <button className="btn-action btn-edit"
                          onClick={() => editingId === a._id ? setEditingId(null) : startEdit(a)}>
                          {editingId === a._id ? '✕ Cancel' : '✎ Edit'}
                        </button>
                        <button className="btn-action btn-detail"
                          onClick={() => setExpandedId(expandedId === a._id ? null : a._id)}>
                          {expandedId === a._id ? '▲ Close' : '▼ Details'}
                        </button>
                        <button className="btn-action btn-toggle" onClick={() => handleToggleActive(a)}>
                          {a.isActive ? '⏸ Deactivate' : '▶ Activate'}
                        </button>
                        <button className="btn-action btn-delete" onClick={() => handleDelete(a)}>
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ── Inline edit row ── */}
                  {editingId === a._id && (
                    <tr className="subrow-edit">
                      <td colSpan={10}>
                        <div className="inline-edit-form">
                          <span className="subrow-label">Editing: {a.location?.name} — {new Date(a.date).toLocaleDateString()}</span>
                          <div className="edit-grid">
                            <div>
                              <label className="field-label">Time Slot</label>
                              <select value={editForm.timeSlot} onChange={(e) => setEditForm({ ...editForm, timeSlot: e.target.value })}>
                                <option value="morning">Morning</option>
                                <option value="midday">Midday</option>
                                <option value="evening">Evening</option>
                              </select>
                            </div>
                            <div>
                              <label className="field-label">Required Drivers</label>
                              <input type="number" min="1" value={editForm.requiredDrivers}
                                onChange={(e) => setEditForm({ ...editForm, requiredDrivers: parseInt(e.target.value) })} />
                            </div>
                            <div>
                              <label className="field-label">Compensation (EUR)</label>
                              <input type="number" min="0" step="0.01" value={editForm.compensation}
                                onChange={(e) => setEditForm({ ...editForm, compensation: parseFloat(e.target.value) })} />
                            </div>
                            <div>
                              <label className="field-label">Check-in Code</label>
                              <input type="text" maxLength={6} value={editForm.checkinCode}
                                onChange={(e) => setEditForm({ ...editForm, checkinCode: e.target.value })} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="btn-primary" onClick={() => handleUpdate(a._id)}>Save Changes</button>
                            <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* ── Details row ── */}
                  {expandedId === a._id && (
                    <tr className="subrow-detail">
                      <td colSpan={10}>
                        <div className="detail-panel">
                          <div className="detail-stats">
                            <StatBox label="Required"   value={a.requiredDrivers} />
                            <StatBox label="Max (OB)"   value={a.maxDrivers} />
                            <StatBox label="Reserved"   value={a.stats?.reserved  || 0} />
                            <StatBox label="Confirmed"  value={a.stats?.confirmed || 0} />
                            <StatBox label="Checked In" value={a.stats?.checkedIn || 0} />
                            <StatBox label="Cancelled"  value={a.stats?.cancelled || 0} />
                            <StatBox label="No-Shows"   value={a.stats?.noShows   || 0} />
                            <StatBox label="Total"      value={a.stats?.total     || 0} />
                          </div>
                          <div className="detail-meta">
                            <span><strong>Status:</strong>{' '}
                              <span className={`badge ${a.isActive ? 'badge-green' : 'badge-gray'}`}>
                                {a.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </span>
                            <span><strong>Check-in Code:</strong>{' '}
                              <code className="code-tag">{a.checkinCode}</code>
                            </span>
                            <span><strong>Start Time:</strong>{' '}
                              {a.startTime ? new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, value }: { label: string; value: number }) => (
  <div className="stat-box">
    <div className="stat-box-label">{label}</div>
    <div className="stat-box-value">{value}</div>
  </div>
);

export default DeploymentManagementPage;
