import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  getMyJobs, getMyInternships, getMyCourses,
  createJob, updateJob, deleteJob,
  createInternship, updateInternship, deleteInternship,
  createCourse, updateCourse, deleteCourse
} from '../../api/jobs';
import { getAllSkills } from '../../api/skills';
import { subscribeCompanyApplications } from '../../api/applications';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const EMPTY_JOB = {
  title: '', description: '', location: '', is_remote: false, department: '',
  eligibility: '', deadline: '', job_type: 'full_time',
  salary_min: '', salary_max: '', required_skills: ''
};
const EMPTY_INTERN = {
  title: '', description: '', location: '', is_remote: false, department: '',
  eligibility: '', deadline: '', duration_months: '', stipend_min: '', stipend_max: '',
  start_date: '', required_skills: ''
};
const EMPTY_COURSE = {
  title: '', description: '', difficulty: 'intermediate', price: 0, is_free: false,
  skills_covered: '', duration_hours: ''
};

function PostingCard({ item, type, appCount, onEdit, onDelete }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{item.title}</h4>
          {type === 'job' && item.salary_min && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>₹{(item.salary_min / 100000).toFixed(1)}L – ₹{(item.salary_max / 100000).toFixed(1)}L</span>
          )}
          {type === 'internship' && item.stipend_min && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>₹{item.stipend_min?.toLocaleString()}/mo · {item.duration_months} months</span>
          )}
          {type === 'course' && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.is_free ? 'Free' : `₹${item.price}`} · {item.difficulty}</span>
          )}
        </div>
        <span className={`badge ${item.is_active !== false ? 'badge-success' : 'badge-muted'}`}>
          {item.is_active !== false ? 'Active' : 'Draft'}
        </span>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {item.location && <span className="badge badge-muted">📍 {item.location}</span>}
        {item.department && <span className="badge badge-muted">{item.department}</span>}
        {item.job_type && <span className="badge badge-violet">{item.job_type.replace('_', ' ')}</span>}
        {type !== 'course' && item.deadline && <span className="badge badge-muted">⏰ {item.deadline}</span>}
      </div>

      {type !== 'course' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>{appCount || 0} Applicants</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button className="btn btn-outline btn-sm" onClick={() => onEdit(item)}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(item.id, type)}>🗑️ Delete</button>
      </div>
    </div>
  );
}

function PostModal({ show, onClose, editItem, type, setType, onSave, allSkills }) {
  const [form, setForm] = useState(EMPTY_JOB);

  useEffect(() => {
    if (editItem) { setForm(editItem); }
    else {
      if (type === 'job') setForm(EMPTY_JOB);
      else if (type === 'internship') setForm(EMPTY_INTERN);
      else setForm(EMPTY_COURSE);
    }
  }, [editItem, type, show]);

  if (!show) return null;
  const isEdit = !!editItem;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <h3 style={{ margin: 0 }}>{isEdit ? 'Edit' : 'Post'} {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>

        {!isEdit && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
            {['job', 'internship', 'course'].map(t => (
              <button key={t} className={`btn btn-sm ${type === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setType(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
            ))}
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); onSave(form, type); }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" placeholder={type === 'course' ? 'e.g. React Advanced Patterns' : 'e.g. Frontend Developer'} value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" placeholder="e.g. Engineering" value={form.department || ''} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-input" rows={4} placeholder="Full description of responsibilities, requirements, and benefits..." value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required style={{ resize: 'vertical' }} />
          </div>

          {type === 'course' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-select" value={form.difficulty || 'intermediate'} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>
                  {['beginner', 'intermediate', 'advanced'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input type="number" className="form-input" value={form.price || 0} onChange={e => setForm(p => ({ ...p, price: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (hrs)</label>
                <input type="number" className="form-input" placeholder="40" value={form.duration_hours || ''} onChange={e => setForm(p => ({ ...p, duration_hours: e.target.value }))} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" placeholder="Bangalore, Remote" value={form.location || ''} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input type="date" className="form-input" value={form.deadline || ''} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
                </div>
              </div>
              {type === 'job' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">Min Salary (₹/yr)</label>
                    <input type="number" className="form-input" placeholder="500000" value={form.salary_min || ''} onChange={e => setForm(p => ({ ...p, salary_min: parseInt(e.target.value) || '' }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Salary (₹/yr)</label>
                    <input type="number" className="form-input" placeholder="1200000" value={form.salary_max || ''} onChange={e => setForm(p => ({ ...p, salary_max: parseInt(e.target.value) || '' }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Schedule</label>
                    <select className="form-select" value={form.job_type || 'full_time'} onChange={e => setForm(p => ({ ...p, job_type: e.target.value }))}>
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">Min Stipend (₹/mo)</label>
                    <input type="number" className="form-input" placeholder="15000" value={form.stipend_min || ''} onChange={e => setForm(p => ({ ...p, stipend_min: parseInt(e.target.value) || '' }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Stipend (₹/mo)</label>
                    <input type="number" className="form-input" placeholder="35000" value={form.stipend_max || ''} onChange={e => setForm(p => ({ ...p, stipend_max: parseInt(e.target.value) || '' }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (months)</label>
                    <input type="number" className="form-input" placeholder="6" value={form.duration_months || ''} onChange={e => setForm(p => ({ ...p, duration_months: e.target.value }))} />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label className="form-label">{type === 'course' ? 'Skills Covered' : 'Required Skills'} (comma-separated)</label>
            <input className="form-input" placeholder="React, Node.js, Python, Problem Solving..." value={form.required_skills || form.skills_covered || ''} onChange={e => setForm(p => ({ ...p, required_skills: e.target.value, skills_covered: e.target.value }))} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={type === 'course' ? form.is_free : form.is_remote} onChange={e => setForm(p => ({ ...p, ...(type === 'course' ? { is_free: e.target.checked } : { is_remote: e.target.checked }) }))} />
            {type === 'course' ? 'This course is free' : 'This is a remote role'}
          </label>

          <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {isEdit ? 'Save Changes' : `Post ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IndustryJobs() {
  const { user } = useAuth();
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [internships, setInternships] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [postType, setPostType] = useState('job');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [jRes, iRes, cRes] = await Promise.all([getMyJobs(), getMyInternships(), getMyCourses()]);
      setJobs(jRes.data.data || []);
      setInternships(iRes.data.data || []);
      setCourses(cRes.data.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    if (!user?.id) return;
    const unsub = subscribeCompanyApplications(user.id, setAllApplications);
    return () => unsub();
  }, [user, loadData]);

  const getAppCount = (id) => allApplications.filter(a => a.jobId === id).length;

  const handleSave = async (form, type) => {
    try {
      if (editItem) {
        if (type === 'job') await updateJob(editItem.id, form);
        else if (type === 'internship') await updateInternship(editItem.id, form);
        else await updateCourse(editItem.id, form);
        toast.success('Updated successfully!');
      } else {
        if (type === 'job') await createJob(form);
        else if (type === 'internship') await createInternship(form);
        else await createCourse(form);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} posted!`);
      }
      setShowModal(false); setEditItem(null);
      loadData();
    } catch (err) { toast.error('Failed: ' + err.message); }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Delete this ${type}? This cannot be undone.`)) return;
    try {
      if (type === 'job') await deleteJob(id);
      else if (type === 'internship') await deleteInternship(id);
      else await deleteCourse(id);
      toast.success(`${type} deleted.`);
      loadData();
    } catch (err) { toast.error('Failed to delete: ' + err.message); }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setPostType(item.type || activeTab.slice(0, -1)); // jobs→job, internships→internship
    setShowModal(true);
  };

  const openNew = () => { setEditItem(null); setPostType('job'); setShowModal(true); };

  const tabData = { jobs, internships, courses };
  const currentItems = tabData[activeTab] || [];

  return (
    <DashboardLayout
      title="Manage Postings"
      subtitle="Post and manage your jobs, internships, and training courses"
      actions={<button className="btn btn-primary btn-sm" onClick={openNew}>+ Post Opportunity</button>}
    >
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        {[['jobs', `💼 Jobs (${jobs.length})`], ['internships', `🎓 Internships (${internships.length})`], ['courses', `📚 Courses (${courses.length})`]].map(([tab, label]) => (
          <button key={tab} className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab(tab)}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 200, background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : currentItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>{activeTab === 'jobs' ? '💼' : activeTab === 'internships' ? '🎓' : '📚'}</div>
          <h3>No {activeTab} posted yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Click "Post Opportunity" to get started.</p>
          <button className="btn btn-primary" onClick={openNew}>+ Post Now</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
          {currentItems.map(item => (
            <PostingCard
              key={item.id}
              item={item}
              type={activeTab.slice(0, -1)}
              appCount={getAppCount(item.id)}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <PostModal
        show={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        editItem={editItem}
        type={postType}
        setType={setPostType}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
}
