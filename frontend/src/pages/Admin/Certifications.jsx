import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getMasterCertifications, addMasterCertification, deleteMasterCertification } from '../../api/admin';
import { useToast } from '../../contexts/ToastContext';

export default function AdminCertifications() {
  const toast = useToast();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', mapped_skill: '', proficiency: 'intermediate' });

  useEffect(() => {
    loadCerts();
  }, []);

  const loadCerts = async () => {
    setLoading(true);
    try {
      const res = await getMasterCertifications();
      setCerts(res || []);
    } catch (err) {
      toast.error('Failed to load certifications');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addMasterCertification(form);
      toast.success('Certification added successfully');
      setForm({ name: '', mapped_skill: '', proficiency: 'intermediate' });
      loadCerts();
    } catch (err) {
      toast.error('Failed to add certification');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this certification?')) {
      try {
        await deleteMasterCertification(id);
        toast.success('Certification deleted');
        loadCerts();
      } catch (err) {
        toast.error('Failed to delete certification');
      }
    }
  };

  return (
    <DashboardLayout title="Manage Master Certifications" subtitle="Add global certifications and their skill mappings">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)' }}>
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Add New Certification</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Certification Name *</label>
              <input className="form-input" placeholder="e.g. AWS Certified Cloud Practitioner" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mapped Skill *</label>
              <input className="form-input" placeholder="e.g. AWS" value={form.mapped_skill} onChange={e => setForm(f => ({...f, mapped_skill: e.target.value}))} required />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>The exact skill name this cert grants.</span>
            </div>
            <div className="form-group">
              <label className="form-label">Granted Proficiency</label>
              <select className="form-select" value={form.proficiency} onChange={e => setForm(f => ({...f, proficiency: e.target.value}))}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Add Certification</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Certification Directory</h3>
          {loading ? <div>Loading...</div> : certs.length === 0 ? <p>No certifications found.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {certs.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{c.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Maps to: <strong>{c.mapped_skill}</strong> ({c.proficiency})</p>
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
