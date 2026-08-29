import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getCurriculum, addCurriculum, getSubjects, addSubject, deleteSubject, getDepartments } from '../../api/college';
import { getAllSkills } from '../../api/skills';
import { useToast } from '../../contexts/ToastContext';

export default function CollegeCurriculum() {
  const toast = useToast();
  const [curriculums, setCurriculums] = useState([]);
  const [depts, setDepts] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Modals
  const [showAddCurriculum, setShowAddCurriculum] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);

  // Forms
  const [currForm, setCurrForm] = useState({ department_id: '', name: '', semester: 1, academic_year: new Date().getFullYear().toString() });
  const [subForm, setSubForm] = useState({ name: '', code: '', credits: 3, semester: 1, is_core: true, skill_ids: [] });
  const [selectedSkill, setSelectedSkill] = useState({ id: '', proficiency: 'intermediate' });

  useEffect(() => {
    Promise.all([getCurriculum(), getDepartments(), getAllSkills()])
      .then(([cRes, dRes, sRes]) => {
        setCurriculums(cRes.data.data);
        setDepts(dRes.data.data);
        setAllSkills(sRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelectCurriculum = async (curr) => {
    setSelectedCurriculum(curr);
    setLoadingSubjects(true);
    try {
      const res = await getSubjects(curr.id);
      setSubjects(res.data.data);
    } catch {
      toast.error('Failed to load subjects.');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleCreateCurriculum = async (e) => {
    e.preventDefault();
    if (!currForm.department_id || !currForm.name) {
      toast.error('Department and Curriculum Name are required.');
      return;
    }
    try {
      const res = await addCurriculum(currForm);
      const updated = await getCurriculum();
      setCurriculums(updated.data.data);
      setShowAddCurriculum(false);
      setCurrForm({ department_id: '', name: '', semester: 1, academic_year: new Date().getFullYear().toString() });
      toast.success('Curriculum track added successfully!');
    } catch (err) {
      toast.error('Failed to create curriculum.');
    }
  };

  const handleAddSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!subForm.name) {
      toast.error('Subject Name is required.');
      return;
    }
    try {
      await addSubject({ ...subForm, curriculum_id: selectedCurriculum.id });
      // Reload subjects
      const res = await getSubjects(selectedCurriculum.id);
      setSubjects(res.data.data);
      // Reload curriculum to update subject count
      const updated = await getCurriculum();
      setCurriculums(updated.data.data);
      setShowAddSubject(false);
      setSubForm({ name: '', code: '', credits: 3, semester: 1, is_core: true, skill_ids: [] });
      toast.success('Subject added to curriculum.');
    } catch (err) {
      toast.error('Failed to add subject.');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await deleteSubject(id, selectedCurriculum.id);
      setSubjects(prev => prev.filter(s => s.id !== id));
      const updated = await getCurriculum();
      setCurriculums(updated.data.data);
      toast.success('Subject removed from curriculum.');
    } catch {
      toast.error('Failed to delete subject.');
    }
  };

  const addSkillToSubject = () => {
    if (!selectedSkill.id) return;
    const exists = subForm.skill_ids.some(s => s.id === parseInt(selectedSkill.id));
    if (exists) {
      toast.warning('Skill already added.');
      return;
    }
    const skillObj = allSkills.find(s => s.id === parseInt(selectedSkill.id));
    setSubForm(p => ({
      ...p,
      skill_ids: [...p.skill_ids, { id: skillObj.id, name: skillObj.name, proficiency: selectedSkill.proficiency }]
    }));
    setSelectedSkill({ id: '', proficiency: 'intermediate' });
  };

  const removeSkillFromSubject = (id) => {
    setSubForm(p => ({
      ...p,
      skill_ids: p.skill_ids.filter(s => s.id !== id)
    }));
  };

  if (loading) return <DashboardLayout title="Curriculum"><div style={{ padding: 40, textAlign: 'center' }}>Loading curriculum tracks...</div></DashboardLayout>;

  return (
    <DashboardLayout
      title="Curriculum Management"
      subtitle="Define departments, curriculum regulations, and map skills to subjects"
      actions={<button onClick={() => setShowAddCurriculum(true)} className="btn btn-primary">+ Add Curriculum Track</button>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {curriculums.map((c, i) => (
          <div
            key={i}
            onClick={() => handleSelectCurriculum(c)}
            style={{
              padding: 'var(--space-5)',
              background: selectedCurriculum?.id === c.id ? 'var(--gradient-primary)' : 'var(--bg-card)',
              border: '1px solid',
              borderColor: selectedCurriculum?.id === c.id ? 'transparent' : 'var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              color: selectedCurriculum?.id === c.id ? 'white' : 'var(--text-primary)',
              transform: selectedCurriculum?.id === c.id ? 'translateY(-4px)' : 'none',
              boxShadow: selectedCurriculum?.id === c.id ? '0 12px 24px -10px rgba(139,92,246,0.4)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, background: selectedCurriculum?.id === c.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: 'var(--space-4)' }}>
                🎓
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: selectedCurriculum?.id === c.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface)', color: selectedCurriculum?.id === c.id ? 'white' : 'var(--text-secondary)' }}>
                {c.subject_count} Subjects
              </span>
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: 'inherit' }}>{c.name}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: selectedCurriculum?.id === c.id ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>{c.dept_name} • Regulation {c.academic_year}</p>
          </div>
        ))}
      </div>

      {selectedCurriculum && (
        <div className="card" style={{ animation: 'slideUp 0.4s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem' }}>{selectedCurriculum.name}</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Detailed course breakdown and skill mapping</p>
            </div>
            <button onClick={() => setShowAddSubject(true)} className="btn btn-primary btn-sm">+ Add Subject</button>
          </div>

          {loadingSubjects ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              Loading curriculum details...
            </div>
          ) : subjects.length === 0 ? (
            <div className="empty-state" style={{ margin: 'var(--space-8) 0' }}>
              <div className="empty-icon">📚</div>
              <p className="empty-title">No subjects defined</p>
              <p className="empty-desc">Start building this track by adding subjects and mapping them to industry skills.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {Array.from(new Set(subjects.map(s => s.semester))).sort((a,b)=>a-b).map(sem => (
                <div key={sem} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--bg-card)', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600 }}>
                    Semester {sem}
                  </div>
                  <div style={{ padding: 'var(--space-4)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Code</th>
                          <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Subject</th>
                          <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Credits</th>
                          <th style={{ textAlign: 'left', paddingBottom: 12, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Mapped Skills</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.filter(s => s.semester == sem).map(s => (
                          <tr key={s.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '12px 0', fontSize: '0.85rem' }}><span className="badge badge-muted">{s.code}</span></td>
                            <td style={{ padding: '12px 0' }}>
                              <div style={{ fontWeight: 600 }}>{s.name}</div>
                              {s.is_core ? <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>Core Subject</span> : <span style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>Elective</span>}
                            </td>
                            <td style={{ padding: '12px 0', fontSize: '0.9rem', fontWeight: 600 }}>{s.credits}</td>
                            <td style={{ padding: '12px 0' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {s.skills_taught ? s.skills_taught.split(', ').map((st, idx) => (
                                  <span key={idx} className="badge badge-violet" style={{ fontSize: '0.7rem' }}>{st}</span>
                                )) : <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Not mapped</span>}
                              </div>
                            </td>
                            <td style={{ padding: '12px 0', textAlign: 'right' }}>
                              <button onClick={() => handleDeleteSubject(s.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', opacity: 0.6 }}>🗑️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Curriculum Modal */}
      {showAddCurriculum && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddCurriculum(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Create Curriculum Track</h3>
              <button className="modal-close" onClick={() => setShowAddCurriculum(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCurriculum}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select className="form-select" value={currForm.department_id} onChange={e => setCurrForm(p => ({ ...p, department_id: e.target.value }))} required>
                    <option value="">Select department...</option>
                    {depts.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Track Name *</label>
                  <input className="form-input" placeholder="e.g. B.Tech Computer Science (2024 Regulation)" value={currForm.name} onChange={e => setCurrForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Default Semesters</label>
                    <input type="number" min="1" max="10" className="form-input" value={currForm.semester} onChange={e => setCurrForm(p => ({ ...p, semester: parseInt(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Regulation Year</label>
                    <input className="form-input" placeholder="2024" value={currForm.academic_year} onChange={e => setCurrForm(p => ({ ...p, academic_year: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCurriculum(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Track</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddSubject(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Subject to {selectedCurriculum?.name}</h3>
              <button className="modal-close" onClick={() => setShowAddSubject(false)}>×</button>
            </div>
            <form onSubmit={handleAddSubjectSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Subject Code</label>
                    <input className="form-input" placeholder="CS8401" value={subForm.code} onChange={e => setSubForm(p => ({ ...p, code: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject Name *</label>
                    <input className="form-input" placeholder="Operating Systems" value={subForm.name} onChange={e => setSubForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <input type="number" min="1" max="10" className="form-input" value={subForm.semester} onChange={e => setSubForm(p => ({ ...p, semester: parseInt(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credits</label>
                    <input type="number" min="1" max="10" className="form-input" value={subForm.credits} onChange={e => setSubForm(p => ({ ...p, credits: parseInt(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject Type</label>
                    <select className="form-select" value={subForm.is_core ? 'core' : 'elective'} onChange={e => setSubForm(p => ({ ...p, is_core: e.target.value === 'core' }))}>
                      <option value="core">Core Subject</option>
                      <option value="elective">Elective</option>
                    </select>
                  </div>
                </div>

                {/* Map skills block */}
                <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                  <label className="form-label" style={{ marginBottom: 'var(--space-3)', display: 'block' }}>Map Skills Covered in Subject</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <select className="form-select" style={{ flex: 2 }} value={selectedSkill.id} onChange={e => setSelectedSkill(p => ({ ...p, id: e.target.value }))}>
                      <option value="">Choose Skill...</option>
                      {allSkills.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                    </select>
                    <select className="form-select" style={{ flex: 1 }} value={selectedSkill.proficiency} onChange={e => setSelectedSkill(p => ({ ...p, proficiency: e.target.value }))}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                    <button type="button" className="btn btn-secondary" onClick={addSkillToSubject}>Add</button>
                  </div>

                  {subForm.skill_ids.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {subForm.skill_ids.map((s, idx) => (
                        <span key={idx} className="badge badge-violet" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {s.name} ({s.proficiency})
                          <button type="button" onClick={() => removeSkillFromSubject(s.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddSubject(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
