import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getCollectionData, addDocument, deleteDocument } from '../../services/firebaseDb';
import { useToast } from '../../contexts/ToastContext';

export default function AdminSkills() {
  const toast = useToast();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', category: 'Skill' });

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const res = await getCollectionData('master_skills');
      setSkills(res || []);
    } catch (err) {
      toast.error('Failed to load skills');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDocument('master_skills', form);
      toast.success('Skill added successfully');
      setForm({ name: '', category: 'Skill' });
      loadSkills();
    } catch (err) {
      toast.error('Failed to add skill');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this skill?')) {
      try {
        await deleteDocument('master_skills', id);
        toast.success('Skill deleted');
        loadSkills();
      } catch (err) {
        toast.error('Failed to delete skill');
      }
    }
  };

  return (
    <DashboardLayout title="Manage Master Skills" subtitle="Add or remove technical and soft skills available on the platform">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)' }}>
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Add New Skill</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Skill Name *</label>
              <input className="form-input" placeholder="e.g. React, Python" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                <option value="Skill">Skill</option>
                <option value="Language">Language</option>
                <option value="Tool">Tool</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Add Skill</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Skill Directory ({skills.length})</h3>
          {loading ? <div>Loading...</div> : skills.length === 0 ? <p>No skills found in database. Seed the database from Dashboard.</p> : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              {skills.map(s => (
                <div key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 8px 4px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 20 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.name}</span>
                  <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
