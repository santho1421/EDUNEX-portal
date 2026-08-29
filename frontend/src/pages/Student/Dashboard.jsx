import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getDashboardStats, getSkillGap } from '../../api/student';
import { getJobs } from '../../api/jobs';
import { useAuth } from '../../contexts/AuthContext';

const ReadinessRing = ({ score }) => {
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#f43f5e';

  return (
    <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
      <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r={radius} fill="none" stroke="var(--bg-surface)" strokeWidth="12" />
        <circle cx="90" cy="90" r={radius} fill="none" stroke="url(#rg)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-display)', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>{score}%</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Readiness</span>
      </div>
    </div>
  );
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [gap, setGap] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getSkillGap(), getJobs({ limit: 4 })])
      .then(([sRes, gRes, jRes]) => {
        setStats(sRes.data.data);
        setGap(gRes.data.data);
        setJobs(jRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { icon: '⚡', label: 'Skills Added', value: stats?.skill_count || 0, color: 'var(--color-primary)' },
    { icon: '📋', label: 'Applications', value: stats?.application_count || 0, color: 'var(--cyan-500)' },
    { icon: '🏆', label: 'Certifications', value: stats?.certification_count || 0, color: 'var(--color-warning)' },
    { icon: '🚀', label: 'Projects', value: stats?.project_count || 0, color: 'var(--color-success)' },
  ];

  if (loading) return (
    <DashboardLayout title="Dashboard">
      <div className="stats-grid">
        {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 96 }} />)}
      </div>
      <div className="skeleton skeleton-card" style={{ height: 240, marginBottom: 'var(--space-6)' }} />
    </DashboardLayout>
  );

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.name?.split(' ')[0] || 'Student'}! 👋`}
      subtitle="Here's your industry readiness overview"
    >
      {/* Verification Banner */}
      {user?.verification_status === 'pending' && (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem' }}>⏳</span>
          <div>
            <strong style={{ color: '#f59e0b' }}>Verification Pending</strong>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your college is reviewing your enrollment. Some features are restricted until verified.</p>
          </div>
        </div>
      )}
      {user?.verification_status === 'rejected' && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>❌</span>
            <div>
              <strong style={{ color: '#ef4444' }}>Verification Rejected</strong>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your college could not verify your enrollment. Please update your profile with correct details and re-register.</p>
            </div>
          </div>
          <a href="/signup/student" className="btn btn-danger btn-sm" style={{ flexShrink: 0 }}>Re-Register</a>
        </div>
      )}
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

      {/* Skill Gap Overview */}
      {gap && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="section-header">
            <h3 className="section-title">Industry Readiness for {gap.target_role?.title || 'Target Role'}</h3>
            <Link to="/student/skills" className="btn btn-secondary btn-sm">View Full Analysis →</Link>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'center', flexWrap: 'wrap' }}>
            <ReadinessRing score={gap.readiness_score} />
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                {[
                  { label: 'Matched', value: gap.matched_count, color: 'var(--color-success)', icon: '✓' },
                  { label: 'Needs Work', value: gap.partial_count, color: 'var(--color-warning)', icon: '▲' },
                  { label: 'Missing', value: gap.missing_count, color: 'var(--color-danger)', icon: '✗' },
                ].map((item, i) => (
                  <div key={i} style={{ textAlign: 'center', background: `${item.color}10`, border: `1px solid ${item.color}25`, borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: item.color, fontFamily: 'var(--font-display)' }}>{item.value}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
              {/* Top missing skills */}
              {gap.skills.missing.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Missing Skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {gap.skills.missing.slice(0, 5).map((s, i) => (
                      <span key={i} className="skill-tag skill-missing">{s.skill_name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Recommended Courses */}
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Recommended Courses</h3>
            <Link to="/student/courses" className="btn btn-ghost btn-sm">See All</Link>
          </div>
          {gap?.recommended_courses?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {gap.recommended_courses.slice(0, 3).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 40, height: 40, background: 'rgba(139,92,246,0.15)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🎓</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</p>
                    <p style={{ fontSize: '0.75rem', margin: 0, marginTop: 2 }}>{c.company_name}</p>
                  </div>
                  <span className="badge badge-violet">{c.difficulty}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8) var(--space-4)' }}>
              <div className="empty-icon">🎓</div>
              <p className="empty-desc">Add more skills to get course recommendations!</p>
              <Link to="/student/skills" className="btn btn-primary btn-sm">Add Skills</Link>
            </div>
          )}
        </div>

        {/* Latest Jobs */}
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Latest Opportunities</h3>
            <Link to="/student/jobs" className="btn btn-ghost btn-sm">See All</Link>
          </div>
          {jobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {jobs.slice(0, 3).map((j, i) => (
                <div key={i} style={{ padding: 'var(--space-3)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{j.title}</p>
                      <p style={{ fontSize: '0.75rem', margin: '2px 0 0' }}>{j.company_name}</p>
                    </div>
                    <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{j.location}</span>
                  </div>
                  {j.salary_min && <p style={{ fontSize: '0.75rem', color: 'var(--color-success-light)', marginTop: 4, fontWeight: 600 }}>₹{(j.salary_min/100000).toFixed(1)}L – ₹{(j.salary_max/100000).toFixed(1)}L</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8) var(--space-4)' }}>
              <div className="empty-icon">💼</div>
              <p className="empty-desc">No jobs found. Add skills to see matched opportunities!</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
