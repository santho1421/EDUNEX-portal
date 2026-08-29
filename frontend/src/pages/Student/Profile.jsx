import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProfile, updateProfile, getSkills, addSkill, removeSkill, getProjects, addProject, deleteProject, getCertifications, addCertification, deleteCertification } from '../../api/student';
import { getAllSkills } from '../../api/skills';
import { useToast } from '../../contexts/ToastContext';
import { getMasterCertifications } from '../../api/admin';

const PROFICIENCY_OPTIONS = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function StudentProfile() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [masterCerts, setMasterCerts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('info');

  // Forms
  const [profileForm, setProfileForm] = useState({});
  const [skillForm, setSkillForm] = useState({ skill_id: '', skill_name: '', proficiency: 'intermediate' });
  const [projectForm, setProjectForm] = useState({ title: '', description: '', tech_stack: '', github_url: '', live_url: '' });
  const [certForm, setCertForm] = useState({ name: '', issuer: '', issue_date: '', credential_url: '' });

  useEffect(() => {
    Promise.all([getProfile(), getSkills(), getAllSkills(), getProjects(), getCertifications(), getMasterCertifications()])
      .then(([pRes, sRes, asRes, prRes, cRes, mcRes]) => {
        setProfile(pRes.data.data);
        setProfileForm(pRes.data.data);
        setSkills(sRes.data.data);
        setAllSkills(asRes.data.data);
        setProjects(prRes.data.data);
        setCerts(cRes.data.data);
        setMasterCerts(mcRes || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(profileForm);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save profile.'); }
    finally { setSaving(false); }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!skillForm.skill_name) { toast.error('Please enter or select a skill.'); return; }
    try {
      const sId = skillForm.skill_id || skillForm.skill_name.toLowerCase().replace(/\s+/g, '-');
      await addSkill({ skill_id: sId, skill_name: skillForm.skill_name, proficiency: skillForm.proficiency });
      const r = await getSkills(); setSkills(r.data.data);
      setSkillForm({ skill_id: '', skill_name: '', proficiency: 'intermediate' });
      toast.success('Skill added!');
    } catch { toast.error('Failed to add skill.'); }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      await removeSkill(skillId);
      setSkills(prev => prev.filter(s => s.skill_id !== skillId));
      toast.success('Skill removed.');
    } catch { toast.error('Failed to remove skill.'); }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      await addProject({ ...projectForm, tech_stack: projectForm.tech_stack.split(',').map(t => t.trim()) });
      const r = await getProjects(); setProjects(r.data.data);
      setProjectForm({ title: '', description: '', tech_stack: '', github_url: '', live_url: '' });
      toast.success('Project added!');
    } catch { toast.error('Failed to add project.'); }
  };

  const handleAddCert = async (e) => {
    e.preventDefault();
    try {
      await addCertification(certForm);
      const r = await getCertifications(); setCerts(r.data.data);
      setCertForm({ name: '', issuer: '', issue_date: '', credential_url: '' });
      toast.success('Certification added!');
    } catch { toast.error('Failed to add certification.'); }
  };

  const tabs = ['info', 'skills', 'projects', 'certifications'];
  const tabLabel = { info: '👤 Personal Info', skills: '⚡ Skills', projects: '🚀 Projects', certifications: '🏆 Certifications' };

  if (loading) return <DashboardLayout title="My Profile"><div style={{ padding: 40, textAlign: 'center' }}>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout title="My Profile" subtitle="Manage your personal information, skills, and portfolio">
      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2)', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveSection(tab)} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-lg)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: activeSection === tab ? 'var(--gradient-primary)' : 'transparent', color: activeSection === tab ? 'white' : 'var(--text-secondary)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            {tabLabel[tab]}
          </button>
        ))}
      </div>

      {/* Personal Info */}
      {activeSection === 'info' && (
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-6)' }}>Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
            {[['first_name', 'First Name', 'text'], ['last_name', 'Last Name', 'text'], ['phone', 'Phone', 'tel'], ['city', 'City', 'text'], ['degree', 'Degree', 'text'], ['department', 'Department / Branch', 'text'], ['current_year', 'Current Year (1-4)', 'number'], ['current_semester', 'Semester (1-8)', 'number'], ['graduation_year', 'Graduation Year', 'number'], ['cgpa', 'CGPA', 'number'], ['linkedin_url', 'LinkedIn URL', 'url'], ['github_url', 'GitHub URL', 'url'], ['portfolio_url', 'Portfolio URL', 'url']].map(([key, label, type]) => (
              <div key={key} className="form-group">
                <label className="form-label">{label}</label>
                <input type={type} className="form-input" value={profileForm[key] || ''} onChange={e => setProfileForm(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label">Bio</label>
            <textarea className="form-textarea" value={profileForm.bio || ''} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell us about yourself..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <button onClick={saveProfile} disabled={saving} className="btn btn-primary btn-lg">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      )}

      {/* Skills */}
      {activeSection === 'skills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-5)' }}>Add Skill</h3>
            <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
                <label className="form-label">Skill</label>
                <input 
                  type="text"
                  list="all-skills-list"
                  className="form-input" 
                  placeholder="Search or type a skill..."
                  value={skillForm.skill_name} 
                  onChange={e => {
                    const val = e.target.value;
                    const matched = allSkills.find(s => s.name === val);
                    setSkillForm(p => ({ ...p, skill_name: val, skill_id: matched ? matched.id : '' }));
                  }}
                  required
                />
                <datalist id="all-skills-list">
                  {allSkills.map(s => <option key={s.id} value={s.name} />)}
                </datalist>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                <label className="form-label">Proficiency</label>
                <select className="form-select" value={skillForm.proficiency} onChange={e => setSkillForm(p => ({ ...p, proficiency: e.target.value }))}>
                  {PROFICIENCY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">Add Skill</button>
              </div>
            </form>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-5)' }}>My Skills ({skills.length})</h3>
            {skills.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">⚡</div><p className="empty-desc">No skills yet. Add your first skill above!</p></div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                {skills.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-full)', padding: '0.35rem 0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.skill_name}</span>
                    <span className="badge badge-violet" style={{ fontSize: '0.65rem' }}>{s.proficiency}</span>
                    <button onClick={() => handleRemoveSkill(s.skill_id)} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1, padding: '0 2px' }} title="Remove">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projects */}
      {activeSection === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-5)' }}>Add Project</h3>
            <form onSubmit={handleAddProject} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Project Title *</label>
                  <input className="form-input" value={projectForm.title} onChange={e => setProjectForm(p => ({ ...p, title: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tech Stack (comma-separated)</label>
                  <input className="form-input" placeholder="React, Node.js, MySQL" value={projectForm.tech_stack} onChange={e => setProjectForm(p => ({ ...p, tech_stack: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" style={{ minHeight: 80 }} value={projectForm.description} onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group"><label className="form-label">GitHub URL</label><input type="url" className="form-input" value={projectForm.github_url} onChange={e => setProjectForm(p => ({ ...p, github_url: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Live URL</label><input type="url" className="form-input" value={projectForm.live_url} onChange={e => setProjectForm(p => ({ ...p, live_url: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">Add Project</button>
              </div>
            </form>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-5)' }}>My Projects ({projects.length})</h3>
            {projects.length === 0 ? <div className="empty-state"><div className="empty-icon">🚀</div><p className="empty-desc">No projects yet. Add your first project!</p></div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {projects.map((p, i) => (
                  <div key={i} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', marginBottom: 'var(--space-2)' }}>{p.title}</h4>
                        <p style={{ fontSize: '0.82rem', margin: 0, marginBottom: 'var(--space-3)' }}>{p.description}</p>
                        {p.tech_stack && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{(typeof p.tech_stack === 'string' ? JSON.parse(p.tech_stack) : p.tech_stack).map((t, j) => <span key={j} className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{t}</span>)}</div>}
                      </div>
                      <button onClick={() => deleteProject(p.id).then(() => setProjects(prev => prev.filter(x => x.id !== p.id)))} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1.1rem' }}>🗑</button>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                      {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">GitHub →</a>}
                      {p.live_url && <a href={p.live_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">Live Demo →</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certifications */}
      {activeSection === 'certifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-5)' }}>Add Certification</h3>
            <form onSubmit={handleAddCert} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Certification Name *</label>
                  <input 
                    className="form-input" 
                    list="certs-list"
                    placeholder="Search certificates..."
                    value={certForm.name} 
                    onChange={e => setCertForm(p => ({ ...p, name: e.target.value }))} 
                    required 
                  />
                  <datalist id="certs-list">
                    {masterCerts.map((c, idx) => <option key={idx} value={c.name} />)}
                  </datalist>
                </div>
                <div className="form-group"><label className="form-label">Issuer</label><input className="form-input" value={certForm.issuer} onChange={e => setCertForm(p => ({ ...p, issuer: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Issue Date</label><input type="date" className="form-input" max={new Date().toISOString().split('T')[0]} value={certForm.issue_date} onChange={e => setCertForm(p => ({ ...p, issue_date: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Credential URL</label><input type="url" className="form-input" value={certForm.credential_url} onChange={e => setCertForm(p => ({ ...p, credential_url: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="submit" className="btn btn-primary">Add Certification</button></div>
            </form>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-5)' }}>My Certifications ({certs.length})</h3>
            {certs.length === 0 ? <div className="empty-state"><div className="empty-icon">🏆</div><p className="empty-desc">No certifications yet.</p></div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {certs.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ width: 44, height: 44, background: 'rgba(245,158,11,0.12)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🏆</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{c.name}</p>
                      <p style={{ fontSize: '0.78rem', margin: '2px 0 0' }}>{c.issuer} {c.issue_date && `· ${c.issue_date}`}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {c.credential_url && <a href={c.credential_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">View</a>}
                      <button onClick={() => deleteCertification(c.id).then(() => setCerts(prev => prev.filter(x => x.id !== c.id)))} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
