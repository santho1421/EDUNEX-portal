import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { subscribeCompanyApplications, updateApplicationStatus } from '../../api/applications';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied', color: '#6366f1' },
  { value: 'shortlisted', label: 'Shortlisted', color: '#f59e0b' },
  { value: 'interview_scheduled', label: 'Interview Scheduled', color: '#3b82f6' },
  { value: 'offer_extended', label: 'Offer Extended', color: '#10b981' },
  { value: 'rejected', label: 'Rejected', color: '#ef4444' }
];

export default function IndustryApplications() {
  const { user } = useAuth();
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [noteModal, setNoteModal] = useState(null); // { appId, newStatus }
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    const unsub = subscribeCompanyApplications(user.id, (apps) => {
      setApplications(apps);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleStatusChange = (app, newStatus) => {
    setNoteModal({ app, newStatus });
    setNote('');
  };

  const confirmStatusChange = async () => {
    const { app, newStatus } = noteModal;
    setUpdating(app.id);
    try {
      await updateApplicationStatus(app.id, newStatus, note);
      toast.success(`Application status updated to "${newStatus}". Student notified!`);
      setNoteModal(null);
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    }
    setUpdating(null);
  };

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  const statusStyle = (status) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return { background: `${opt?.color}20`, color: opt?.color, border: `1px solid ${opt?.color}40` };
  };

  return (
    <DashboardLayout title="Manage Applications" subtitle="Review and update applicant statuses in real-time">
      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('all')}>All ({applications.length})</button>
        {STATUS_OPTIONS.map(s => {
          const count = applications.filter(a => a.status === s.value).length;
          return count > 0 ? (
            <button key={s.value} className={`btn btn-sm ${filter === s.value ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(s.value)}>
              {s.label} ({count})
            </button>
          ) : null;
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>Loading applications...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📥</div>
          <h3>No applications yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Post jobs to start receiving applications!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {filtered.map(app => (
            <div key={app.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 6 }}>
                    <h4 style={{ margin: 0 }}>{app.studentName}</h4>
                    <span style={{ ...statusStyle(app.status), padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>{app.status?.replace(/_/g, ' ')}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    💼 Applied for: <strong style={{ color: 'var(--text-primary)' }}>{app.jobTitle}</strong>
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 6, flexWrap: 'wrap' }}>
                    {app.studentEmail && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>✉️ {app.studentEmail}</span>}
                    {app.studentCollege && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🏛️ {app.studentCollege}</span>}
                    {app.studentDept && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📚 {app.studentDept}</span>}
                    {app.studentPhone && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📞 {app.studentPhone}</span>}
                  </div>
                  {app.coverNote && <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--color-primary)', paddingLeft: 10 }}>{app.coverNote}</p>}
                  {app.appliedAt?.seconds && <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Applied: {new Date(app.appliedAt.seconds * 1000).toLocaleString()}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flexShrink: 0, alignItems: 'flex-end' }}>
                  {app.resumeUrl && (
                    <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">📄 Resume</a>
                  )}
                  <select
                    className="form-select"
                    value={app.status}
                    onChange={(e) => handleStatusChange(app, e.target.value)}
                    disabled={updating === app.id}
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  >
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: 420, padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Update Status</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
              Changing <strong>{noteModal.app.studentName}</strong>'s status to <strong style={{ color: 'var(--color-primary-light)' }}>{noteModal.newStatus.replace(/_/g, ' ')}</strong>. Add an optional note for the student:
            </p>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Interview scheduled for Monday 2pm via Google Meet..."
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ resize: 'none', marginBottom: 'var(--space-4)' }}
            />
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button onClick={confirmStatusChange} className="btn btn-primary" style={{ flex: 1 }}>Confirm</button>
              <button onClick={() => setNoteModal(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
