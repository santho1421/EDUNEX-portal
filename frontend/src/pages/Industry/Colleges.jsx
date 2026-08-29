import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getMasterColleges, sendConnectionRequest, getConnectionRequests, updateConnectionStatus } from '../../api/colleges';
import { getAllUsers } from '../../api/admin';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { sendNotification } from '../../api/notifications';

export default function IndustryColleges() {
  const { user } = useAuth();
  const toast = useToast();
  const [colleges, setColleges] = useState([]);
  const [connections, setConnections] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('browse');
  const [sending, setSending] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      getMasterColleges().catch(() => []),
      getAllUsers('college').catch(() => []),
      getConnectionRequests(user.id).catch(() => ({ received: [], sent: [] }))
    ]).then(([masterCols, regCols, conns]) => {
      if (regCols.length === 0) {
        console.warn('No registered colleges found. This might be due to Firebase security rules preventing non-admins from reading the users collection.');
      }
      
      const allCols = [...(masterCols || []), ...(regCols || [])].filter(c => c.name);
      
      // Deduplicate by name. regCols are processed later and will override masterCols
      // This is good because regCols contain the real user 'id' and 'role'
      const uniqueCols = Array.from(new Map(allCols.map(c => [c.name.toLowerCase().trim(), c])).values());
      
      setColleges(uniqueCols);
      setConnections(conns);
      setLoading(false);
    });
  }, [user]);

  const getConnectionStatus = (collegeId) => {
    const sent = connections.sent.find(c => c.receiverId === collegeId);
    return sent?.status || null;
  };

  const handleSendRequest = async (college) => {
    setSending(college.id);
    try {
      await sendConnectionRequest({
        senderId: user.id,
        senderName: user.name,
        senderRole: 'industry',
        senderEmail: user.hr_email || user.email,
        senderPhone: user.phone || '',
        receiverId: college.id,
        receiverName: college.name,
        receiverRole: 'college',
        message: `${user.name} would like to connect with ${college.name} for talent collaboration.`
      });
      // Notify the college (if they have a user account)
      await sendNotification(college.id, `🏢 ${user.name} has sent a connection request to your institution.`, 'connection_request');
      toast.success(`Connection request sent to ${college.name}!`);
      // Refresh connections
      const updated = await getConnectionRequests(user.id);
      setConnections(updated);
    } catch (err) {
      toast.error(err.message || 'Failed to send request.');
    }
    setSending(null);
  };

  const handleConnectionDecision = async (reqId, status, senderId) => {
    try {
      await updateConnectionStatus(reqId, status, senderId);
      if (status === 'accepted') {
        await sendNotification(senderId, `✅ ${user.name} accepted your connection request!`, 'connection_accepted');
      }
      toast.success(`Connection request ${status}.`);
      const updated = await getConnectionRequests(user.id);
      setConnections(updated);
    } catch (err) {
      toast.error('Failed: ' + err.message);
    }
  };

  const filtered = colleges.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.location?.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout title="College Network" subtitle="Browse and connect with top institutions for talent collaboration">
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <button className={`btn btn-sm ${tab === 'browse' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('browse')}>🏛️ Browse Colleges</button>
        <button className={`btn btn-sm ${tab === 'requests' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('requests')}>
          🤝 Connection Requests
          {connections.received.filter(r => r.status === 'pending').length > 0 && (
            <span style={{ marginLeft: 6, background: 'var(--color-danger)', color: 'white', borderRadius: 10, padding: '0 6px', fontSize: '0.75rem' }}>
              {connections.received.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {tab === 'browse' && (
        <>
          <input
            className="form-input"
            placeholder="🔍 Search colleges by name or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 'var(--space-5)', maxWidth: 480 }}
          />
          {loading ? <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
              {filtered.map(college => {
                const status = getConnectionStatus(college.id);
                return (
                  <div key={college.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                      <div style={{ width: 44, height: 44, background: 'var(--gradient-primary)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🏛️</div>
                      <div>
                        <h4 style={{ margin: '0 0 2px', fontSize: '0.95rem' }}>
                          {college.name} 
                          {college.role === 'college' && <span style={{fontSize: '0.7rem', marginLeft: 6}} className="badge badge-success">Registered</span>}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>📍 {college.location || 'Location Not Provided'}</p>
                        {college.type && <span className="badge badge-violet" style={{ marginTop: 4 }}>{college.type}</span>}
                      </div>
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {status === 'accepted' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                          <span className="badge badge-success" style={{ alignSelf: 'flex-start', marginBottom: 4 }}>✅ Connected</span>
                          <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {college.email && <div title="Email">📧 {college.email}</div>}
                            {college.phone && <div title="Phone">📞 {college.phone}</div>}
                            {college.website && <a href={college.website.startsWith('http') ? college.website : `https://${college.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }} title="Website">🌐 Visit Website</a>}
                            {!college.email && !college.phone && <span>Contact info not provided</span>}
                          </div>
                        </div>
                      ) : status === 'pending' ? (
                        <span className="badge badge-warning" style={{ alignSelf: 'flex-start' }}>⏳ Request Pending</span>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ alignSelf: 'flex-start' }}
                          disabled={sending === college.id}
                          onClick={() => handleSendRequest(college)}
                        >
                          {sending === college.id ? 'Sending...' : '🤝 Connect'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {connections.received.length > 0 && (
            <div>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Received Requests</h3>
              {connections.received.map(req => (
                <div key={req.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <strong>{req.senderName}</strong> <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({req.senderRole})</span>
                    <span className={`badge ${req.status === 'pending' ? 'badge-warning' : req.status === 'accepted' ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: 8 }}>{req.status}</span>
                    {req.message && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.message}</p>}
                  </div>
                  {req.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button onClick={() => handleConnectionDecision(req.id, 'accepted', req.senderId)} className="btn btn-success btn-sm">Accept</button>
                      <button onClick={() => handleConnectionDecision(req.id, 'rejected', req.senderId)} className="btn btn-danger btn-sm">Decline</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {connections.sent.length > 0 && (
            <div>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Sent Requests</h3>
              {connections.sent.map(req => (
                <div key={req.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <strong>{req.receiverName}</strong>
                    <span className={`badge ${req.status === 'pending' ? 'badge-warning' : req.status === 'accepted' ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: 8 }}>{req.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {connections.received.length === 0 && connections.sent.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No connection requests yet. Browse colleges to start connecting!</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
