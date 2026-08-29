import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getMasterColleges, addMasterCollege, deleteMasterCollege } from '../../api/colleges';
import { useToast } from '../../contexts/ToastContext';

export default function AdminColleges() {
  const toast = useToast();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', location: '', type: 'Engineering College', affiliation: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadColleges(); }, []);

  const loadColleges = async () => {
    setLoading(true);
    try { setColleges(await getMasterColleges() || []); }
    catch (err) { toast.error('Failed to load colleges'); }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await addMasterCollege(form);
      toast.success('College added successfully');
      setForm({ name: '', location: '', type: 'Engineering College', affiliation: '' });
      loadColleges();
    } catch (err) { toast.error('Failed to add college'); }
    setAdding(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this college from the master list?')) return;
    try {
      await deleteMasterCollege(id);
      toast.success('College deleted');
      loadColleges();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const filtered = colleges.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Master College List" subtitle="Manage all colleges available on the platform">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)', alignItems: 'flex-start' }}>
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Add College</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">College Name *</label>
              <input className="form-input" placeholder="e.g. IIT Bombay" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" placeholder="City, State" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {['IIT', 'NIT', 'Deemed University', 'State University', 'Autonomous College', 'Engineering College', 'Arts & Science College'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Affiliation</label>
              <input className="form-input" placeholder="e.g. Anna University" value={form.affiliation} onChange={e => setForm(f => ({ ...f, affiliation: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={adding}>{adding ? 'Adding...' : 'Add College'}</button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ margin: 0 }}>College Directory ({colleges.length})</h3>
            <input className="form-input" style={{ maxWidth: 240 }} placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? <div>Loading...</div> : filtered.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No colleges found. Seed the database from Admin Dashboard first.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: 500, overflowY: 'auto' }}>
              {filtered.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📍 {c.location} · {c.type}</div>
                  </div>
                  <button onClick={() => handleDelete(c.id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
