import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getCourses } from '../../api/jobs';
import { getSkillGap } from '../../api/student';

const DIFFICULTY_COLORS = { beginner: 'badge-success', intermediate: 'badge-warning', advanced: 'badge-danger' };

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [activeTab, setActiveTab] = useState('recommended');

  useEffect(() => {
    Promise.all([
      getSkillGap().then(r => setRecommended(r.data.data.recommended_courses)).catch(() => {}),
      getCourses().then(r => setCourses(r.data.data)).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    (!search || c.title.toLowerCase().includes(search.toLowerCase()) || c.company_name?.toLowerCase().includes(search.toLowerCase())) &&
    (!difficulty || c.difficulty === difficulty)
  );

  const CourseCard = ({ c }) => (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className={`badge ${DIFFICULTY_COLORS[c.difficulty] || 'badge-muted'}`}>{c.difficulty}</span>
        {c.is_free ? <span className="badge badge-success">Free</span> : c.price > 0 ? <span className="badge badge-muted">₹{c.price?.toLocaleString()}</span> : null}
      </div>
      <div>
        <h4 style={{ fontSize: '1rem', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>{c.title}</h4>
        <p style={{ fontSize: '0.82rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.description}</p>
      </div>
      {c.skills_covered && Array.isArray(c.skills_covered) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {c.skills_covered.slice(0, 3).map((s, i) => <span key={i} className="badge badge-violet" style={{ fontSize: '0.68rem' }}>{s}</span>)}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)', marginTop: 'auto' }}>
        <div>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{c.company_name}</p>
          {c.duration_weeks && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{c.duration_weeks} weeks · {c.duration_hours}h</p>}
        </div>
        {c.certification_provided && <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>🏆 Certificate</span>}
      </div>
      {c.course_url && <a href={c.course_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Enroll Now →</a>}
    </div>
  );

  return (
    <DashboardLayout title="Courses" subtitle="Recommended courses to close your skill gaps">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        {[['recommended', `🎯 Recommended (${recommended.length})`], ['all', `🌐 All Courses`]].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', border: '1px solid', borderColor: activeTab === tab ? 'transparent' : 'var(--border-default)', background: activeTab === tab ? 'var(--gradient-primary)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--text-secondary)', transition: 'all 0.2s' }}>{label}</button>
        ))}
      </div>

      {/* All Courses Filters */}
      {activeTab === 'all' && (
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: 2, minWidth: 200 }} placeholder="🔍 Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-select" style={{ flex: 1, minWidth: 160 }} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 'var(--space-5)' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 240 }} />)}
        </div>
      ) : activeTab === 'recommended' ? (
        recommended.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <p className="empty-title">No recommendations yet</p>
            <p className="empty-desc">Add your skills in your profile to get personalized course recommendations based on your gaps.</p>
          </div>
        ) : (
          <>
            <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem' }}>🎯</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-primary-light)', margin: 0 }}>These courses are recommended specifically to close your skill gaps based on your current skills vs. industry requirements.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 'var(--space-5)' }}>
              {recommended.map((c, i) => <CourseCard key={i} c={c} />)}
            </div>
          </>
        )
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 'var(--space-5)' }}>
          {filtered.length === 0 ? <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>No courses found.</p> : filtered.map((c, i) => <CourseCard key={i} c={c} />)}
        </div>
      )}
    </DashboardLayout>
  );
}
