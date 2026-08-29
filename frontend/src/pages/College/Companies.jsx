import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { sendConnectionRequest, getConnectionRequests, updateConnectionStatus } from '../../api/colleges';
import { getAllUsers } from '../../api/admin';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { sendNotification } from '../../api/notifications';

export default function CollegeCompanies() {
  const { user } = useAuth();
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [connections, setConnections] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('browse');
  const [sending, setSending] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([getAllUsers('industry'), getConnectionRequests(user.id)]).then(([indUsers, conns]) => {
      setCompanies(indUsers || []);
      setConnections(conns);
      setLoading(false);
    });
  }, [user]);

  const getConnectionStatus = (companyId) => {
    const sent = connections.sent.find(c => c.receiverId === companyId);
    return sent?.status || null;
  };

  const handleSendRequest = async (company) => {
    setSending(company.id);
    try {
      await sendConnectionRequest({
        senderId: user.id,
        senderName: user.name,
        senderRole: 'college',
        senderEmail: user.hr_email || user.email,
        senderPhone: user.phone || '',
        receiverId: company.id,
        receiverName: company.name,
        receiverRole: 'industry',
        message: `${user.name} would like to connect with ${company.name} for talent placement.`
      });
      // Notify the company
      await sendNotification(company.id, `🏛️ ${user.name} has sent a connection request to your company.`, 'connection_request');
      toast.success(`Connection request sent to ${company.name}!`);
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
      toast.success(`Connection ${status}!`);
      if (status === 'accepted') {
        await sendNotification(senderId, `✅ Your connection request was accepted.`, 'connection_accepted');
      }
      const updated = await getConnectionRequests(user.id);
      setConnections(updated);
    } catch (err) {
      toast.error('Failed to update connection.');
    }
  };

  const filteredCompanies = companies.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout title="Partner Companies" subtitle="Connect with industries for student placements and internships.">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2)', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
        <button onClick={() => setTab('browse')} style={{ padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-lg)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: tab === 'browse' ? 'var(--gradient-primary)' : 'transparent', color: tab === 'browse' ? 'white' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
          🏢 Browse Companies
        </button>
        <button onClick={() => setTab('requests')} style={{ padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-lg)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: tab === 'requests' ? 'var(--gradient-primary)' : 'transparent', color: tab === 'requests' ? 'white' : 'var(--text-secondary)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
          💌 Connection Requests
          {connections.received.filter(c => c.status === 'pending').length > 0 && (
            <span style={{ background: tab === 'requests' ? 'rgba(255,255,255,0.2)' : 'var(--color-danger)', color: 'white', padding: '2px 6px', borderRadius: 10, fontSize: '0.7rem' }}>
              {connections.received.filter(c => c.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>Loading companies...</div>
      ) : tab === 'browse' ? (
        <>
          <input className="form-input" placeholder="🔍 Search companies by name..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 'var(--space-6)', maxWidth: 400 }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
            {filteredCompanies.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No companies found.</div>
            ) : (
              filteredCompanies.map(company => {
                const status = getConnectionStatus(company.id);
                const initial = (company.name || 'C').charAt(0).toUpperCase();
                return (
                  <div key={company.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {initial}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px' }}>{company.name}</h4>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {company.industry_sector || 'General Sector'} • {company.company_size || 'Startup'}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {status === 'accepted' ? (
                        <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {company.email && <div title="Email">📧 {company.email}</div>}
                          {company.phone && <div title="Phone">📞 {company.phone}</div>}
                          {company.website && <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }} title="Website">🌐 Visit Website</a>}
                          {!company.email && !company.phone && <span>Contact info not provided</span>}
                        </div>
                      ) : (
                        <div />
                      )}
                      
                      <div>
                        {status === 'pending' ? (
                          <span className="badge badge-warning">Request Pending</span>
                        ) : status === 'accepted' ? (
                          <span className="badge badge-success">✅ Connected</span>
                        ) : (
                          <button onClick={() => handleSendRequest(company)} disabled={sending === company.id} className="btn btn-primary btn-sm">
                            {sending === company.id ? 'Sending...' : '🤝 Connect'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {connections.received.length === 0 && connections.sent.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No connection requests yet.</div>
          ) : (
            <>
              {connections.received.length > 0 && (
                <div className="card">
                  <h4 style={{ marginBottom: 'var(--space-4)' }}>Received Requests</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {connections.received.map(req => (
                      <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{req.senderName} <span className="badge badge-muted" style={{ marginLeft: 8 }}>Company</span></div>
                          {req.message && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>"{req.message}"</div>}
                        </div>
                        {req.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button onClick={() => handleConnectionDecision(req.id, 'accepted', req.senderId)} className="btn btn-success btn-sm">Accept</button>
                            <button onClick={() => handleConnectionDecision(req.id, 'rejected', req.senderId)} className="btn btn-danger btn-sm">Decline</button>
                          </div>
                        ) : (
                          <span className={`badge ${req.status === 'accepted' ? 'badge-success' : 'badge-danger'}`} style={{ textTransform: 'capitalize' }}>{req.status}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {connections.sent.length > 0 && (
                <div className="card">
                  <h4 style={{ marginBottom: 'var(--space-4)' }}>Sent Requests</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {connections.sent.map(req => (
                      <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>To: {req.receiverName}</div>
                        </div>
                        <span className={`badge ${req.status === 'accepted' ? 'badge-success' : req.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
