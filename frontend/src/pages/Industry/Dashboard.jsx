import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getDashboardStats } from '../../api/industry';
import { getCompanyApplications } from '../../api/jobs';
import { useAuth } from '../../contexts/AuthContext';

export default function IndustryDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getCompanyApplications({ limit: 5 })])
      .then(([sRes, aRes]) => {
        setStats(sRes.data.data);
        setApps(aRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { icon: '💼', label: 'Active Jobs', value: stats?.active_jobs || 0, color: 'var(--color-primary)' },
    { icon: '🎓', label: 'Active Internships', value: stats?.active_internships || 0, color: 'var(--cyan-500)' },
    { icon: '📚', label: 'Active Courses', value: stats?.active_courses || 0, color: 'var(--color-warning)' },
    { icon: '📋', label: 'Applications Received', value: stats?.total_applications || 0, color: 'var(--color-success)' },
  ];

  if (loading) return (
    <DashboardLayout title="Industry Portal">
      <div className="stats-grid">
        {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 96 }} />)}
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout
      title={`${user?.name || 'Company'} Dashboard`}
      subtitle="Bridge university skills and hire pre-vetted students"
    >
      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="card-stat">
            <div className="card-stat-icon" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
              <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
            </div>
            <div className="card-stat-info">
              <div className="card-stat-value">{s.value}</div>
              <div className="card-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* Latest Applications */}
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Latest Applications</h3>
            <Link to="/industry/applications" className="btn btn-secondary btn-sm">Manage All</Link>
          </div>
          {apps.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
              <div className="empty-icon">📋</div>
              <p className="empty-title">No applications received yet</p>
              <p className="empty-desc">Your job postings will display applications here once candidates apply.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Role</th>
                    <th>CGPA</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.slice(0, 5).map((app, i) => (
                    <tr key={i}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.student_name}</span>
                      </td>
                      <td>{app.title}</td>
                      <td>{app.cgpa || 'N/A'}</td>
                      <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge status-${app.status}`}>{app.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 className="section-title">Quick Tasks</h3>
          {[
            { to: '/industry/jobs', label: 'Post a New Job', icon: '💼', desc: 'Create job or internship openings' },
            { to: '/industry/courses', label: 'Publish a Course', icon: '📚', desc: 'Up-skill colleges with industry content' },
            { to: '/industry/talent', label: 'Search Talent', icon: '🔍', desc: 'Search students by skill & readiness' },
            { to: '/industry/profile', label: 'Required Skills', icon: '⚡', desc: 'Define required tech stack' },
          ].map((action, i) => (
            <Link
              key={i}
              to={action.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-4)',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-violet)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              <span style={{ fontSize: '1.4rem' }}>{action.icon}</span>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontSize: '0.875rem' }}>{action.label}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
