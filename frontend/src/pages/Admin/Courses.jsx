import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getMasterCourses, addMasterCourse, deleteMasterCourse } from '../../api/admin';
import { useToast } from '../../contexts/ToastContext';

export default function AdminCourses() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', company_name: '', difficulty: 'beginner', price: 0, is_free: true, skills_covered: '' });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await getMasterCourses();
      setCourses(res || []);
    } catch (err) {
      toast.error('Failed to load courses');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addMasterCourse({
        ...form,
        price: Number(form.price),
        skills_covered: form.skills_covered.split(',').map(s => s.trim()).filter(Boolean)
      });
      toast.success('Course added successfully');
      setForm({ title: '', description: '', company_name: '', difficulty: 'beginner', price: 0, is_free: true, skills_covered: '' });
      loadCourses();
    } catch (err) {
      toast.error('Failed to add course');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteMasterCourse(id);
        toast.success('Course deleted');
        loadCourses();
      } catch (err) {
        toast.error('Failed to delete course');
      }
    }
  };

  return (
    <DashboardLayout title="Manage Master Courses" subtitle="Add or edit courses that will be recommended to students">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)' }}>
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Add New Course</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Course Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Provider / Company *</label>
              <input className="form-input" value={form.company_name} onChange={e => setForm(f => ({...f, company_name: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-select" value={form.difficulty} onChange={e => setForm(f => ({...f, difficulty: e.target.value}))}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input type="number" className="form-input" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value, is_free: Number(e.target.value) === 0}))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Skills Covered (comma separated) *</label>
              <input className="form-input" placeholder="e.g. React, Node.js, AWS" value={form.skills_covered} onChange={e => setForm(f => ({...f, skills_covered: e.target.value}))} required />
            </div>
            <button type="submit" className="btn btn-primary">Add Course</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Course Directory</h3>
          {loading ? <div>Loading...</div> : courses.length === 0 ? <p>No courses found.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {courses.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{c.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.company_name} · {c.difficulty} · {c.is_free ? 'Free' : `₹${c.price}`}</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      {(Array.isArray(c.skills_covered) ? c.skills_covered : []).map((s, i) => (
                        <span key={i} className="badge badge-muted" style={{ fontSize: '0.65rem' }}>{s}</span>
                      ))}
                    </div>
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
