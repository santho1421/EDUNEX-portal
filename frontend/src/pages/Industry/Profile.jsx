import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProfile, updateProfile, getRequiredSkills, addRequiredSkill, removeRequiredSkill } from '../../api/industry';
import { getAllSkills } from '../../api/skills';
import { useToast } from '../../contexts/ToastContext';

const PROFICIENCY_OPTIONS = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function IndustryProfile() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Forms
  const [profileForm, setProfileForm] = useState({});
  const [skillForm, setSkillForm] = useState({ skill_id: '', required_proficiency: 'intermediate', is_mandatory: true, demand_level: 'high' });

  useEffect(() => {
    Promise.all([getProfile(), getRequiredSkills(), getAllSkills()])
      .then(([pRes, sRes, asRes]) => {
        setProfile(pRes.data.data);
        setProfileForm(pRes.data.data);
        setSkills(sRes.data.data);
        setAllSkills(asRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profileForm);
      toast.success('Company profile updated!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!skillForm.skill_id) {
      toast.error('Please select a skill.');
      return;
    }
    try {
      await addRequiredSkill({
        skill_id: parseInt(skillForm.skill_id),
        required_proficiency: skillForm.required_proficiency,
        is_mandatory: skillForm.is_mandatory,
        demand_level: skillForm.demand_level
      });
      const res = await getRequiredSkills();
      setSkills(res.data.data);
      setSkillForm({ skill_id: '', required_proficiency: 'intermediate', is_mandatory: true, demand_level: 'high' });
      toast.success('Skill requirement added/updated.');
    } catch {
      toast.error('Failed to add skill requirement.');
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      await removeRequiredSkill(skillId);
      setSkills(prev => prev.filter(s => s.skill_id !== skillId));
      toast.success('Skill requirement removed.');
    } catch {
      toast.error('Failed to remove skill.');
    }
  };

  if (loading) return <DashboardLayout title="Company Profile"><div style={{ padding: 40, textAlign: 'center' }}>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout title="Company Profile" subtitle="Manage details, sector, size, and required tech stack">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2)', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
        {[['info', '🏢 Company Info'], ['skills', '⚡ Tech Stack Requirements']].map(([tab, label]) => (
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
                <label className="form-label">Company Name</label>
                <input className="form-input" value={profileForm.name || ''} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Industry Sector</label>
                <input className="form-input" placeholder="e.g. Technology, Finance, Health" value={profileForm.industry_sector || ''} onChange={e => setProfileForm(p => ({ ...p, industry_sector: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Company Size</label>
                <select className="form-select" value={profileForm.company_size || ''} onChange={e => setProfileForm(p => ({ ...p, company_size: e.target.value }))}>
                  <option value="">Choose size...</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Founded Year</label>
                <input type="number" className="form-input" placeholder="2018" value={profileForm.founded_year || ''} onChange={e => setProfileForm(p => ({ ...p, founded_year: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Website URL</label>
                <input type="url" className="form-input" value={profileForm.website || ''} onChange={e => setProfileForm(p => ({ ...p, website: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input type="url" className="form-input" value={profileForm.linkedin_url || ''} onChange={e => setProfileForm(p => ({ ...p, linkedin_url: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">HR Contact Phone</label>
                <input className="form-input" placeholder="+91 98765 43210" value={profileForm.phone || ''} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">HR Contact Email</label>
                <input type="email" className="form-input" placeholder="hr@company.com" value={profileForm.hr_email || ''} onChange={e => setProfileForm(p => ({ ...p, hr_email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" value={profileForm.city || ''} onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">About the Company</label>
              <textarea className="form-textarea" value={profileForm.about || ''} onChange={e => setProfileForm(p => ({ ...p, about: e.target.value }))} placeholder="Provide a brief summary about your product/services and mission..." />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'skills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-5)' }}>Require a Skill</h3>
            <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
                <label className="form-label">Skill</label>
                <select className="form-select" value={skillForm.skill_id} onChange={e => setSkillForm(p => ({ ...p, skill_id: e.target.value }))}>
                  <option value="">Select skill...</option>
                  {allSkills.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                <label className="form-label">Min Proficiency</label>
                <select className="form-select" value={skillForm.required_proficiency} onChange={e => setSkillForm(p => ({ ...p, required_proficiency: e.target.value }))}>
                  {PROFICIENCY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                <label className="form-label">Demand Level</label>
                <select className="form-select" value={skillForm.demand_level} onChange={e => setSkillForm(p => ({ ...p, demand_level: e.target.value }))}>
                  <option value="high">High Demand</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 100, justifyContent: 'center' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 24 }}>
                  <input type="checkbox" checked={skillForm.is_mandatory} onChange={e => setSkillForm(p => ({ ...p, is_mandatory: e.target.checked }))} />
                  Mandatory
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">Add Skill Requirement</button>
              </div>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-5)' }}>Our Tech Stack Requirements ({skills.length})</h3>
            {skills.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⚡</div>
                <p className="empty-desc">No skill requirements specified yet. Add one above to let students and colleges know your requirements.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Skill Name</th>
                      <th>Category</th>
                      <th>Req. Level</th>
                      <th>Importance</th>
                      <th>Demand Level</th>
                      <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.map((s, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.skill_name}</td>
                        <td><span className="badge badge-muted">{s.category}</span></td>
                        <td><strong style={{ color: 'var(--color-primary-light)' }}>{s.required_proficiency}</strong></td>
                        <td>
                          {s.is_mandatory ? (
                            <span className="badge badge-danger">Mandatory</span>
                          ) : (
                            <span className="badge badge-muted">Optional</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${s.demand_level === 'high' ? 'badge-warning' : 'badge-cyan'}`}>
                            {s.demand_level}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => handleRemoveSkill(s.skill_id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }} title="Remove">🗑</button>
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
