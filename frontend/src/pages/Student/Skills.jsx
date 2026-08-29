import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getSkillGap, updateProfile } from '../../api/student';
import { Link } from 'react-router-dom';
import { INDUSTRY_ROLES } from '../../data/industryRoles';

const PROFICIENCY_COLORS = { beginner: '#64748b', intermediate: '#f59e0b', advanced: '#10b981', expert: '#06b6d4' };

export default function StudentSkills() {
  const [gap, setGap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    getSkillGap().then(r => setGap(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const tabStyle = (tab) => ({
    padding: '0.5rem 1.1rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: activeTab === tab ? 'var(--gradient-primary)' : 'var(--bg-glass)',
    color: activeTab === tab ? 'white' : 'var(--text-secondary)',
    transition: 'all 0.2s',
  });

  if (loading) return <DashboardLayout title="My Skills"><div style={{ padding: 40, textAlign: 'center' }}>Loading...</div></DashboardLayout>;

  const score = gap?.readiness_score || 0;
  const scoreColor = score >= 70 ? 'var(--color-success)' : score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <DashboardLayout
      title="Skill Gap Analysis"
      subtitle="Your skills vs what the industry demands"
      actions={<Link to="/student/profile" className="btn btn-primary btn-sm">+ Add Skills</Link>}
    >
      {/* Role Selector */}
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', background: 'var(--bg-glass)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, marginBottom: 4, color: 'var(--text-primary)' }}>Target Career Role</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>We'll compare your skills against the industry requirements for this specific role.</p>
        </div>
        <select 
          className="form-input" 
          value={gap?.target_role?.id || ''} 
          onChange={async (e) => {
            const roleId = e.target.value;
            if (roleId) {
              setLoading(true);
              await updateProfile({ target_role: roleId });
              const r = await getSkillGap(roleId);
              setGap(r.data.data);
              setLoading(false);
            }
          }}
          style={{ maxWidth: 250 }}
        >
          <option value="" disabled>Select a role...</option>
          {INDUSTRY_ROLES.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
      </div>

      {/* Score Banner */}
      <div className="card" style={{ background: 'var(--bg-card)', marginBottom: 'var(--space-6)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'rgba(139,92,246,0.08)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', flexWrap: 'wrap', position: 'relative' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: scoreColor, lineHeight: 1 }}>{score}%</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Industry Readiness</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Progress toward industry standard</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: scoreColor }}>{score}%</span>
            </div>
            <div className="progress-track" style={{ height: 12 }}>
              <div className="progress-fill" style={{ width: `${score}%`, height: 12, background: score >= 70 ? 'var(--gradient-success)' : score >= 40 ? 'linear-gradient(90deg, #d97706, #f59e0b)' : 'var(--gradient-danger)' }} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-5)' }}>
              {[{ label: 'Matched', v: gap?.matched_count, c: 'var(--color-success)' }, { label: 'Partial', v: gap?.partial_count, c: 'var(--color-warning)' }, { label: 'Missing', v: gap?.missing_count, c: 'var(--color-danger)' }].map((s, i) => (
                <div key={i}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: s.c, fontFamily: 'var(--font-display)' }}>{s.v}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        {[['all', `All (${(gap?.matched_count || 0) + (gap?.partial_count || 0) + (gap?.missing_count || 0)})`], ['matched', `✓ Matched (${gap?.matched_count || 0})`], ['partial', `▲ Needs Work (${gap?.partial_count || 0})`], ['missing', `✗ Missing (${gap?.missing_count || 0})`]].map(([tab, label]) => (
          <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>{label}</button>
        ))}
      </div>

      {/* Skills List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {activeTab !== 'missing' && activeTab !== 'partial' && gap?.skills?.matched?.map((s, i) => (
          <div key={i} className="card" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', borderColor: 'rgba(16,185,129,0.2)' }}>
            <div style={{ width: 44, height: 44, background: 'rgba(16,185,129,0.12)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>✓</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.skill_name}</span>
                <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{s.category}</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Your level: <strong style={{ color: PROFICIENCY_COLORS[s.student_proficiency] }}>{s.student_proficiency}</strong> — Required: {s.required_proficiency}
              </span>
              {s.inferred_from && (
                <div style={{ marginTop: 4 }}>
                  <span className="badge badge-violet" style={{ fontSize: '0.65rem' }}>🏆 Inferred from: {s.inferred_from}</span>
                </div>
              )}
            </div>
            <span className="skill-tag skill-matched">Matched</span>
          </div>
        ))}

        {activeTab !== 'matched' && activeTab !== 'missing' && gap?.skills?.partial?.map((s, i) => (
          <div key={i} className="card" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', borderColor: 'rgba(245,158,11,0.2)' }}>
            <div style={{ width: 44, height: 44, background: 'rgba(245,158,11,0.12)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>▲</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.skill_name}</span>
                <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{s.category}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: PROFICIENCY_COLORS[s.student_proficiency] }}>{s.student_proficiency}</strong> → need <strong style={{ color: 'var(--color-warning)' }}>{s.required_proficiency}</strong>
                </span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(245,158,11,0.12)', color: '#fbbf24', padding: '2px 6px', borderRadius: 4 }}>+{s.gap_levels} level{s.gap_levels > 1 ? 's' : ''} needed</span>
              </div>
              {s.inferred_from && (
                <div style={{ marginTop: 4 }}>
                  <span className="badge badge-violet" style={{ fontSize: '0.65rem' }}>🏆 Inferred from: {s.inferred_from}</span>
                </div>
              )}
            </div>
            <span className="skill-tag skill-partial">Needs Work</span>
          </div>
        ))}

        {activeTab !== 'matched' && activeTab !== 'partial' && gap?.skills?.missing?.map((s, i) => (
          <div key={i} className="card" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', borderColor: 'rgba(244,63,94,0.2)' }}>
            <div style={{ width: 44, height: 44, background: 'rgba(244,63,94,0.12)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>✗</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.skill_name}</span>
                <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{s.category}</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Required: <strong style={{ color: 'var(--color-danger-light)' }}>{s.required_proficiency}</strong> · In demand at {s.company_count} companies</span>
            </div>
            <span className="skill-tag skill-missing">Missing</span>
          </div>
        ))}

        {activeTab === 'all' && !gap?.skills?.matched?.length && !gap?.skills?.partial?.length && !gap?.skills?.missing?.length && (
          <div className="empty-state">
            <div className="empty-icon">⚡</div>
            <p className="empty-title">No skill data yet</p>
            <p className="empty-desc">Add your skills in your profile to see your industry readiness score.</p>
            <Link to="/student/profile" className="btn btn-primary">Add Skills Now</Link>
          </div>
        )}
      </div>

      {/* Recommended Courses */}
      {gap?.recommended_courses?.length > 0 && (
        <div style={{ marginTop: 'var(--space-8)' }}>
          <div className="section-header">
            <h3 className="section-title">Recommended Courses for Your Gaps</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
            {gap.recommended_courses.map((c, i) => (
              <div key={i} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <span className="badge badge-violet">{c.difficulty}</span>
                  {c.is_free ? <span className="badge badge-success">Free</span> : <span className="badge badge-muted">₹{c.price?.toLocaleString()}</span>}
                </div>
                <h4 style={{ fontSize: '1rem', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>{c.title}</h4>
                <p style={{ fontSize: '0.8rem', marginBottom: 'var(--space-3)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>by {c.company_name}</span>
                  {c.duration_weeks && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.duration_weeks} weeks</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
