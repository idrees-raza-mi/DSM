import React, { useEffect, useState } from 'react';
import { useAuthorizedClient } from '../services/api';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

const AdminManagementPage = () => {
  const client = useAuthorizedClient();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  const fetchAdmins = async () => {
    try {
      const res = await client.get('/admin/admins');
      setAdmins(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name || !form.email || !form.phone || !form.password) {
      setError('All fields are required.');
      return;
    }
    try {
      setSubmitting(true);
      await client.post('/admin/admins', form);
      setSuccess(`Admin account created for ${form.email}`);
      setForm({ name: '', email: '', phone: '', password: '' });
      setShowForm(false);
      fetchAdmins();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove admin access for ${name}?`)) return;
    try {
      await client.delete(`/admin/admins/${id}`);
      setAdmins((prev) => prev.filter((a) => a._id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to remove admin.');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Admin Accounts</h1>
          <p style={{ color: '#6b7280', marginTop: 4 }}>Manage who has access to this dashboard.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }} style={styles.primaryBtn}>
          {showForm ? 'Cancel' : '+ Add Admin'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} style={styles.formCard}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#111827' }}>New Admin Account</h2>
          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input style={styles.input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@company.com" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Phone</label>
              <input style={styles.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+49 123 456 789" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input style={styles.input} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" />
            </div>
          </div>
          <button type="submit" disabled={submitting} style={styles.primaryBtn}>
            {submitting ? 'Creating...' : 'Create Admin Account'}
          </button>
        </form>
      )}

      {/* Admin List */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading...</p>
      ) : admins.length === 0 ? (
        <div style={styles.emptyState}>No admin accounts found.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin._id} style={styles.tr}>
                <td style={styles.td}>
                  <div style={styles.avatar}>{admin.name.charAt(0).toUpperCase()}</div>
                  {admin.name}
                </td>
                <td style={styles.td}>{admin.email}</td>
                <td style={styles.td}>{admin.phone}</td>
                <td style={styles.td}>{new Date(admin.createdAt).toLocaleDateString()}</td>
                <td style={styles.td}>
                  <button onClick={() => handleDelete(admin._id, admin.name)} style={styles.deleteBtn}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Info box */}
      <div style={styles.infoBox}>
        <strong>First-time setup?</strong> Run <code style={styles.code}>npm run seed</code> in the backend folder to create the default admin account:
        <br />Email: <code style={styles.code}>admin@fleetflow.com</code> &nbsp; Password: <code style={styles.code}>admin123</code>
        <br /><em style={{ color: '#92400e' }}>Change the default password immediately after first login.</em>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  primaryBtn: {
    backgroundColor: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
  },
  formCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 16,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 13, fontWeight: 500, color: '#374151' },
  input: {
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
    outline: 'none',
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 12,
    fontSize: 14,
  },
  successBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 12,
    fontSize: 14,
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f9fafb' },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e5e7eb',
  },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: {
    padding: '14px',
    fontSize: 14,
    color: '#111827',
    display: 'revert',
    alignItems: 'center',
    gap: 8,
    verticalAlign: 'middle',
  },
  avatar: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: '#111827',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    marginRight: 10,
  },
  deleteBtn: {
    background: 'transparent',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    borderRadius: 6,
    padding: '5px 12px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
  },
  emptyState: {
    textAlign: 'center',
    padding: 40,
    color: '#9ca3af',
    border: '1px dashed #e5e7eb',
    borderRadius: 12,
  },
  infoBox: {
    marginTop: 32,
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 10,
    padding: '14px 18px',
    fontSize: 13,
    color: '#78350f',
    lineHeight: 1.8,
  },
  code: {
    background: '#fef3c7',
    padding: '2px 6px',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 13,
  },
};

export default AdminManagementPage;
