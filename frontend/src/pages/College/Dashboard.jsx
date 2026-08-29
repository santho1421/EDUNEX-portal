import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getDashboardStats, getSkillGap } from '../../api/college';
import { useAuth } from '../../contexts/AuthContext';

export default function CollegeDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [gap, setGap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getSkillGap()])
      .then(([sRes, gRes]) => { setStats(sRes.data.data); setGap(gRes.data.data); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout title="Dashboard">
      <div className="stats-grid">{[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 96 }} />)}</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title={`${user?.name || 'College'} Dashboard`} subtitle="Curriculum vs Industry Intelligence">
      <div className="stats-grid">
        {[
          { icon: '👥', label: 'Total Students', value: stats?.totalStudents || 0, color: 'var(--cyan-500)' },
          { icon: '✅', label: 'Verified Students', value: stats?.verifiedStudents || 0, color: 'var(--color-primary)' },
          { icon: '⏳', label: 'Pending Verifications', value: stats?.pendingVerifications || 0, color: 'var(--color-warning)' },
          { icon: '🏢', label: 'Connected Companies', value: stats?.connectedCompanies || 0, color: 'var(--color-success)' },
        ].map((s, i) => (
          <div key={i} className="card-stat">
            <div className="card-stat-icon" style={{ background: `${s.color}15` }}><span style={{ fontSize: '1.4rem' }}>{s.icon}</span></div>
            <div><div className="card-stat-value" style={{ color: s.color }}>{s.value}</div><div className="card-stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Curriculum vs Industry */}
      {gap && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <div className="card">
            <div className="section-header">
              <h3 className="section-title">Coverage Score</h3>
              <Link to="/college/skill-gap" className="btn btn-secondary btn-sm">Full Analysis →</Link>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <div style={{ fontSize: '4rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: gap.coverage_rate >= 70 ? 'var(--color-success)' : 'var(--color-warning)', lineHeight: 1 }}>{gap.coverage_rate}%</div>
              <p style={{ marginTop: 'var(--space-3)' }}>of industry-required skills are covered in your curriculum</p>
              <div className="progress-track" style={{ marginTop: 'var(--space-5)', height: 12 }}>
                <div className="progress-fill" style={{ width: `${gap.coverage_rate}%`, height: 12, background: gap.coverage_rate >= 70 ? 'var(--gradient-success)' : 'linear-gradient(90deg,#d97706,#f59e0b)' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)' }}>{gap.covered_skills}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Skills Covered</div>
              </div>
              <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-danger)' }}>{gap.missing_skills}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Missing Skills</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-header"><h3 className="section-title">Top Skill Gaps</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {gap.emerging_gaps?.slice(0, 6).map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ width: 8, height: 8, background: 'var(--color-danger)', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{s.skill_name}</span>
                    <span className="badge badge-muted" style={{ fontSize: '0.68rem' }}>{s.category}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.company_count} cos.</span>
                    <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>Missing</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        {[
          { to: '/college/students', icon: '👥', label: 'Manage Students', color: 'var(--cyan-500)' },
          { to: '/college/companies', icon: '🏢', label: 'Partner Companies', color: 'var(--color-success)' },
          { to: '/college/curriculum', icon: '📚', label: 'Manage Curriculum', color: 'var(--color-primary)' },
          { to: '/college/skill-gap', icon: '📊', label: 'Skill Gap Analysis', color: 'var(--color-warning)' },
        ].map((item, i) => (
          <Link key={i} to={item.to} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'var(--space-3)', textDecoration: 'none', padding: 'var(--space-6)' }}>
            <div style={{ width: 52, height: 52, background: `${item.color}15`, border: `1px solid ${item.color}30`, borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{item.icon}</div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
