import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getMyCourses, createCourse, deleteCourse } from '../../api/jobs';
import { getAllSkills } from '../../api/skills';
import { useToast } from '../../contexts/ToastContext';

const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'];

export default function IndustryCourses() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '', description: '', difficulty: 'intermediate', duration_hours: '', duration_weeks: '',
    eligibility: '', certification_provided: true, certification_name: '', course_url: '', is_free: true, price: 0,
    skill_ids: []
  });
  const [selectedSkill, setSelectedSkill] = useState({ skill_id: '', proficiency: 'intermediate' });

  const loadData = () => {
    setLoading(true);
    Promise.all([getMyCourses(), getAllSkills()])
      .then(([cRes, sRes]) => {
        setCourses(cRes.data.data);
        setAllSkills(sRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleAddSkill = () => {
    if (!selectedSkill.skill_id) return;
    const exists = form.skill_ids.some(s => s.skill_id === parseInt(selectedSkill.skill_id));
    if (exists) {
      toast.warning('Skill already added.');
      return;
    }
    const skillObj = allSkills.find(s => s.id === parseInt(selectedSkill.skill_id));
    setForm(p => ({
      ...p,
      skill_ids: [...p.skill_ids, { skill_id: skillObj.id, name: skillObj.name, proficiency: selectedSkill.proficiency }]
    }));
    setSelectedSkill({ skill_id: '', proficiency: 'intermediate' });
  };

  const handleRemoveSkill = (id) => {
    setForm(p => ({ ...p, skill_ids: p.skill_ids.filter(s => s.skill_id !== id) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.course_url) {
      toast.error('Title and Course URL are required.');
      return;
    }
    try {
      await createCourse(form);
      toast.success('Course published successfully! 🎓');
      setShowModal(false);
      setForm({
        title: '', description: '', difficulty: 'intermediate', duration_hours: '', duration_weeks: '',
        eligibility: '', certification_provided: true, certification_name: '', course_url: '', is_free: true, price: 0,
        skill_ids: []
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish course.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      toast.success('Course removed.');
    } catch {
      toast.error('Failed to remove course.');
    }
  };

  return (
    <DashboardLayout
      title="Courses & Training"
      subtitle="Publish academic training modules and certified curricula to colleges & students"
      actions={<button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">+ Publish Course</button>}
    >
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 220 }} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p className="empty-title">No courses published yet</p>
          <p className="empty-desc">Publish curriculum courses that cover your tech stack so colleges can align their subjects and students can learn.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
          {courses.map((c, i) => (
            <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="badge badge-violet">{c.difficulty}</span>
                <span className={`badge ${c.is_free ? 'badge-success' : 'badge-muted'}`}>
                  {c.is_free ? 'Free' : `₹${c.price?.toLocaleString()}`}
                </span>
              </div>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>{c.title}</h4>
              <p style={{ fontSize: '0.82rem', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{c.description}</p>
              {c.skills_covered && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {c.skills_covered.split(', ').slice(0, 3).map((s, idx) => (
                    <span key={idx} className="badge badge-muted" style={{ fontSize: '0.68rem' }}>{s}</span>
                  ))}
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.duration_weeks || 0} weeks · {c.duration_hours || 0}h</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={c.course_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">View</a>
                  <button onClick={() => handleDelete(c.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">Publish Training Module</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Course Title *</label>
                    <input className="form-input" placeholder="e.g. Masterclass in React & Node.js" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Course URL / Portal Link *</label>
                    <input type="url" className="form-input" placeholder="https://coursera.org/..." value={form.course_url} onChange={e => setForm(p => ({ ...p, course_url: e.target.value }))} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-textarea" placeholder="Detail the syllabus, curriculum roadmap, and projects covered..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">Difficulty Level</label>
                    <select className="form-select" value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>
                      {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (Hours)</label>
                    <input type="number" className="form-input" placeholder="40" value={form.duration_hours} onChange={e => setForm(p => ({ ...p, duration_hours: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (Weeks)</label>
                    <input type="number" className="form-input" placeholder="8" value={form.duration_weeks} onChange={e => setForm(p => ({ ...p, duration_weeks: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Eligibility Criteria</label>
                    <input className="form-input" placeholder="e.g. Basic JS knowledge" value={form.eligibility} onChange={e => setForm(p => ({ ...p, eligibility: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.is_free} onChange={e => setForm(p => ({ ...p, is_free: e.target.checked }))} />
                        Free Course
                      </label>
                    </div>
                    {!form.is_free && (
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Price (INR)</label>
                        <input type="number" className="form-input" placeholder="1999" value={form.price} onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) }))} />
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group" style={{ justifyContent: 'center' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.certification_provided} onChange={e => setForm(p => ({ ...p, certification_provided: e.target.checked }))} />
                      Provide Certification
                    </label>
                  </div>
                  {form.certification_provided && (
                    <div className="form-group">
                      <label className="form-label">Certificate Name</label>
                      <input className="form-input" placeholder="e.g. Advanced React Developer Certificate" value={form.certification_name} onChange={e => setForm(p => ({ ...p, certification_name: e.target.value }))} />
                    </div>
                  )}
                </div>

                {/* Skills covered */}
                <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                  <label className="form-label" style={{ marginBottom: 'var(--space-3)', display: 'block' }}>Skills Covered / Taught</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <select className="form-select" style={{ flex: 2 }} value={selectedSkill.skill_id} onChange={e => setSelectedSkill(p => ({ ...p, skill_id: e.target.value }))}>
                      <option value="">Choose Skill...</option>
                      {allSkills.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                    </select>
                    <select className="form-select" style={{ flex: 1 }} value={selectedSkill.proficiency} onChange={e => setSelectedSkill(p => ({ ...p, proficiency: e.target.value }))}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                    <button type="button" className="btn btn-secondary" onClick={handleAddSkill}>Add</button>
                  </div>

                  {form.skill_ids.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {form.skill_ids.map((s, idx) => (
                        <span key={idx} className="badge badge-violet" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {s.name} ({s.proficiency})
                          <button type="button" onClick={() => handleRemoveSkill(s.skill_id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Course</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
