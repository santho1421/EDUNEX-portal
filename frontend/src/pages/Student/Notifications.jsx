import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { subscribeNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/notifications';
import { useAuth } from '../../contexts/AuthContext';

const TYPE_ICONS = {
  applied: '📤',
  shortlisted: '⭐',
  interview_scheduled: '📅',
  offer_extended: '🏆',
  rejected: '📩',
  approved: '✅',
  connection_request: '🤝',
  connection_accepted: '✅',
  info: '🔔',
};

export default function StudentNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = subscribeNotifications(user.id, (items) => {
      setNotifications(items);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await markAllNotificationsRead(user.id);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout
      title="Notifications"
      subtitle="Real-time updates on your applications, verifications, and connections"
      actions={unreadCount > 0 && (
        <button onClick={handleMarkAllRead} className="btn btn-outline btn-sm">
          Mark All Read ({unreadCount})
        </button>
      )}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔔</div>
          <h3>No notifications yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Apply for jobs and complete your profile to receive updates here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.read && handleMarkRead(n.id)}
              style={{
                display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start',
                padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                background: n.read ? 'var(--bg-glass)' : 'rgba(99,102,241,0.08)',
                border: `1px solid ${n.read ? 'var(--border-subtle)' : 'rgba(99,102,241,0.25)'}`,
                cursor: n.read ? 'default' : 'pointer', transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{TYPE_ICONS[n.type] || '🔔'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: n.read ? 400 : 600, color: 'var(--text-primary)' }}>{n.message}</p>
                {n.meta?.jobTitle && <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Job: {n.meta.jobTitle} at {n.meta.companyName}</p>}
                {n.createdAt?.seconds && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt.seconds * 1000).toLocaleString()}</p>}
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: 6 }} />}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
