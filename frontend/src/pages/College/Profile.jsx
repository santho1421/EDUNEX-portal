import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProfile, updateProfile, getDepartments, addDepartment, deleteDepartment } from '../../api/college';
import { useToast } from '../../contexts/ToastContext';

export default function CollegeProfile() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Forms
  const [profileForm, setProfileForm] = useState({});
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });

  useEffect(() => {
    Promise.all([getProfile(), getDepartments()])
      .then(([pRes, dRes]) => {
        setProfile(pRes.data.data);
        setProfileForm(pRes.data.data);
        setDepts(dRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profileForm);
      toast.success('Institution profile updated!');
    } catch (err) {
      toast.error('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) {
      toast.error('Please fill in all department fields.');
      return;
    }
    try {
      await addDepartment(deptForm);
      const res = await getDepartments();
      setDepts(res.data.data);
      setDeptForm({ name: '', code: '' });
      toast.success('Department added successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add department.');
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? This might affect students in this department.')) return;
    try {
      await deleteDepartment(id);
      setDepts(prev => prev.filter(d => d.id !== id));
      toast.success('Department removed.');
    } catch (err) {
      toast.error('Failed to remove department.');
    }
  };

  if (loading) return <DashboardLayout title="College Profile"><div style={{ padding: 40, textAlign: 'center' }}>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout title="Institution Profile" subtitle="Manage university details and departments">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2)', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
        {[['info', '🏛️ University Info'], ['departments', '👥 Departments']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-lg)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: activeTab === tab ? 'var(--gradient-primary)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--text-secondary)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-6)' }}>General Details</h3>
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
              <div className="form-group">
                <label className="form-label">Institution Name</label>
                <input className="form-input" value={profileForm.name || ''} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">City/Location</label>
                <input className="form-input" value={profileForm.city || ''} onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Website URL</label>
                <input type="url" className="form-input" value={profileForm.website_url || ''} onChange={e => setProfileForm(p => ({ ...p, website_url: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Location / City</label>
                <input className="form-input" placeholder="e.g. Chennai" value={profileForm.location || ''} onChange={e => setProfileForm(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input type="email" className="form-input" value={profileForm.email || ''} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input className="form-input" placeholder="+91 98765 43210" value={profileForm.phone || ''} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Website</label>
                <input type="url" className="form-input" placeholder="https://college.edu" value={profileForm.website || ''} onChange={e => setProfileForm(p => ({ ...p, website: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">University Affiliation</label>
                <input className="form-input" placeholder="Anna University" value={profileForm.affiliation || ''} onChange={e => setProfileForm(p => ({ ...p, affiliation: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Established Year</label>
                <input type="number" className="form-input" placeholder="1995" value={profileForm.established_year || ''} onChange={e => setProfileForm(p => ({ ...p, established_year: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">NAAC Grade</label>
                <select className="form-select" value={profileForm.naac_grade || ''} onChange={e => setProfileForm(p => ({ ...p, naac_grade: e.target.value }))}>
                  <option value="">Select Grade...</option>
                  <option value="A++">A++</option>
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B++">B++</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">About the Institution</label>
              <textarea className="form-textarea" value={profileForm.about || ''} onChange={e => setProfileForm(p => ({ ...p, about: e.target.value }))} placeholder="Provide a brief description of the college, credentials, and achievements..." />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'departments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-5)' }}>Create Department</h3>
            <form onSubmit={handleAddDept} style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
                <label className="form-label">Department Name</label>
                <input className="form-input" placeholder="Computer Science & Engineering" value={deptForm.name} onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                <label className="form-label">Code / Abbreviation</label>
                <input className="form-input" placeholder="CSE" value={deptForm.code} onChange={e => setDeptForm(p => ({ ...p, code: e.target.value }))} required />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">Add Department</button>
              </div>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-5)' }}>Registered Departments</h3>
            {depts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <p className="empty-desc">No departments listed yet. Add one above to start enrolling students.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Department Name</th>
                      <th>Code</th>
                      <th>Students Count</th>
                      <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depts.map((d, i) => (
                      <tr key={i}>
                        <td>{d.name}</td>
                        <td><span className="badge badge-muted">{d.code}</span></td>
                        <td>{d.student_count || 0}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => handleDeleteDept(d.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1rem' }} title="Delete">🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
