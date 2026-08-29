import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { subscribeStudentApplications } from '../../api/applications';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_STEPS = ['applied', 'shortlisted', 'interview_scheduled', 'offer_extended'];
const STATUS_LABELS = {
  applied: { label: 'Applied', icon: '📤', color: '#6366f1' },
  shortlisted: { label: 'Shortlisted', icon: '⭐', color: '#f59e0b' },
  interview_scheduled: { label: 'Interview', icon: '📅', color: '#3b82f6' },
  offer_extended: { label: 'Offer Received', icon: '🏆', color: '#10b981' },
  rejected: { label: 'Not Selected', icon: '❌', color: '#ef4444' }
};

function ApplicationCard({ app }) {
  const isRejected = app.status === 'rejected';
  const currentStep = STATUS_STEPS.indexOf(app.status);
  const date = app.appliedAt?.seconds ? new Date(app.appliedAt.seconds * 1000).toLocaleDateString() : 'Recently';

  return (
    <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{app.jobTitle}</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>🏢 {app.companyName} · Applied: {date}</p>
        </div>
        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, background: `${STATUS_LABELS[app.status]?.color}20`, color: STATUS_LABELS[app.status]?.color, border: `1px solid ${STATUS_LABELS[app.status]?.color}40` }}>
          {STATUS_LABELS[app.status]?.icon} {STATUS_LABELS[app.status]?.label}
        </span>
      </div>

      {!isRejected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 'var(--space-4)' }}>
          {STATUS_STEPS.map((step, idx) => {
            const done = idx <= currentStep;
            const active = idx === currentStep;
            return (
              <React.Fragment key={step}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? STATUS_LABELS[step].color : 'var(--bg-glass)', border: `2px solid ${done ? STATUS_LABELS[step].color : 'var(--border-default)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', boxShadow: active ? `0 0 0 4px ${STATUS_LABELS[step].color}30` : 'none', transition: 'all 0.3s' }}>
                    {done ? '✓' : <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{idx + 1}</span>}
                  </div>
                  <span style={{ fontSize: '0.68rem', marginTop: 4, color: done ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: active ? 700 : 400, textAlign: 'center' }}>{STATUS_LABELS[step].label}</span>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: idx < currentStep ? STATUS_LABELS[STATUS_STEPS[idx]].color : 'var(--border-default)', transition: 'background 0.3s' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* History Timeline */}
      {app.history && app.history.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Activity Log</p>
          {[...app.history].reverse().map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{ fontSize: '0.85rem' }}>{STATUS_LABELS[h.status]?.icon || '📌'}</span>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{STATUS_LABELS[h.status]?.label || h.status}</span>
                {h.note && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}> · {h.note}</span>}
                {h.timestamp && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(h.timestamp).toLocaleString()}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {app.resumeUrl && (
        <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: 'var(--space-3)' }}>
          📄 View Submitted Resume
        </a>
      )}
    </div>
  );
}

export default function StudentApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const unsub = subscribeStudentApplications((apps) => {
      setApplications(apps);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  return (
    <DashboardLayout title="My Applications" subtitle="Real-time tracking of your job and internship applications">
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        {['all', 'applied', 'shortlisted', 'interview_scheduled', 'offer_extended', 'rejected'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
            {STATUS_LABELS[f]?.icon || '📋'} {f === 'all' ? 'All' : STATUS_LABELS[f]?.label}
            {f !== 'all' && <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '0 6px', fontSize: '0.75rem' }}>
              {applications.filter(a => a.status === f).length}
            </span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>Loading your applications...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📋</div>
          <h3>No applications yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Browse Jobs & Internships to start applying!</p>
        </div>
      ) : (
        filtered.map(app => <ApplicationCard key={app.id} app={app} />)
      )}
    </DashboardLayout>
  );
}
