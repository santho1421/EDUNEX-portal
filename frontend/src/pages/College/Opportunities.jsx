import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getJobs, getInternships, getCourses } from '../../api/jobs';

export default function CollegeOpportunities() {
  const [jobs, setJobs] = useState([]);
  const [internships, setInternships] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([getJobs({ limit: 30 }), getInternships({ limit: 30 }), getCourses({ limit: 30 })])
      .then(([jRes, iRes, cRes]) => {
        setJobs(jRes.data.data);
        setInternships(iRes.data.data);
        setCourses(cRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const items = activeTab === 'jobs' ? jobs : activeTab === 'internships' ? internships : courses;
  const filtered = items.filter(item =>
    !search ||
    (item.title || item.name)?.toLowerCase().includes(search.toLowerCase()) ||
    item.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Industry Collaborations & Postings" subtitle="Monitor active postings and required skill trends from partner companies">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        {[
          ['jobs', `💼 Active Jobs (${jobs.length})`],
          ['internships', `🎓 Internships (${internships.length})`],
          ['courses', `📚 Industry Courses (${courses.length})`],
        ].map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: activeTab === tab ? 'transparent' : 'var(--border-default)',
              background: activeTab === tab ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filter */}
      <input
        className="form-input"
        style={{ marginBottom: 'var(--space-6)', maxWidth: 400 }}
        placeholder="🔍 Filter by keyword or company..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 200 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌐</div>
          <p className="empty-title">No opportunities found</p>
          <p className="empty-desc">There are no active postings matching your search criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
          {filtered.map((item, i) => (
            <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <div style={{ width: 44, height: 44, background: 'rgba(6, 182, 212, 0.12)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                  {activeTab === 'courses' ? '📚' : '💼'}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h4 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)' }} className="truncate">
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }} className="truncate">
                    {item.company_name}
                  </p>
                </div>
              </div>

              {activeTab !== 'courses' && item.required_skills && (
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>Demanded Skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {item.required_skills.split(', ').map((s, idx) => (
                      <span key={idx} className="badge badge-muted" style={{ fontSize: '0.68rem' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'courses' && item.skills_covered && (
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>Skills Taught</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {item.skills_covered.split(', ').map((s, idx) => (
                      <span key={idx} className="badge badge-violet" style={{ fontSize: '0.68rem' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {activeTab === 'courses' ? (
                  <span className="badge badge-cyan">{item.difficulty}</span>
                ) : (
                  <span className="badge badge-muted">📍 {item.location || 'Remote'}</span>
                )}
                {item.course_url || item.website_url ? (
                  <a href={item.course_url || item.website_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">View Details</a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
