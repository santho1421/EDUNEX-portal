import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getPendingVerifications, approveVerification, rejectVerification } from '../../api/auth';
import { useToast } from '../../contexts/ToastContext';

export default function AdminVerifications() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await getPendingVerifications();
      if (res.data.success) {
        setRequests(res.data.data || []);
      } else {
        toast.error('Failed to load pending verifications.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error loading verifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this registration?')) return;
    try {
      const res = await approveVerification(id, 'Approved by Admin');
      if (res.data.success) {
        toast.success('Registration approved successfully!');
        setRequests(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve request.');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    try {
      const res = await rejectVerification(id, reason);
      if (res.data.success) {
        toast.success('Registration rejected.');
        setRequests(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request.');
    }
  };

  return (
    <DashboardLayout title="Pending Verifications" subtitle="Review and approve college and industry registrations">
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Loading pending requests...</div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>✅</div>
          <h3>All Caught Up!</h3>
          <p style={{ color: 'var(--text-muted)' }}>There are no pending registrations waiting for your approval.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
          {requests.map(req => (
            <div key={req.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <span className={`badge ${req.type === 'college_to_admin' ? 'badge-success' : 'badge-warning'}`}>
                      {req.type === 'college_to_admin' ? 'College Registration' : 'Company Registration'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Applied {req.createdAt?._seconds ? new Date(req.createdAt._seconds * 1000).toLocaleDateString() : 'recently'}
                    </span>
                  </div>
                  <h3 style={{ margin: 0 }}>{req.institutionName || req.companyName}</h3>
                  <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    {req.type === 'college_to_admin' 
                      ? `${req.type || 'College'} · ${req.affiliation || 'Independent'}` 
                      : `${req.industrySector || 'Industry'} · ${req.companySize || 'Unknown size'}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button onClick={() => handleApprove(req.id)} className="btn btn-success btn-sm">✅ Approve</button>
                  <button onClick={() => handleReject(req.id)} className="btn btn-danger btn-sm">❌ Reject</button>
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 'var(--space-3)' }}>
                  Contact Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Management Name</div>
                    <div style={{ fontWeight: 500 }}>{req.managementName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email Address</div>
                    <div style={{ fontWeight: 500 }}>
                      <a href={`mailto:${req.contactEmail || req.applicantEmail}`} style={{ color: 'var(--color-primary)' }}>
                        {req.contactEmail || req.applicantEmail}
                      </a>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone Number</div>
                    <div style={{ fontWeight: 500 }}>
                      <a href={`tel:${req.contactPhone}`} style={{ color: 'var(--color-primary)' }}>
                        {req.contactPhone}
                      </a>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Location</div>
                    <div style={{ fontWeight: 500 }}>{req.city || 'N/A'}, {req.state || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Website</div>
                    <div style={{ fontWeight: 500 }}>
                      {req.website ? (
                        <a href={req.website.startsWith('http') ? req.website : `https://${req.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>
                          {req.website}
                        </a>
                      ) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
