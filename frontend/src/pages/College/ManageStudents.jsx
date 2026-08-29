import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getStudents, unlinkStudent } from '../../api/college';
import { getCollegeStudentRequests, approveStudent } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function ManageStudents() {
  const { user } = useAuth();
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, verified, pending, rejected
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get all students from this college
      const studentsRes = await getStudents();
      const allStudents = studentsRes.data?.data || [];
      
      // Get pending verification requests for this college via backend
      const reqsRes = await getCollegeStudentRequests();
      const reqs = reqsRes.data?.data || [];
      
      setStudents(allStudents);
      setRequests(reqs.filter(r => r.status === 'pending'));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load students');
    }
    setLoading(false);
  };

  const handleVerify = async (requestId, studentId, status) => {
    try {
      const action = status === 'approved' ? 'approve' : 'reject';
      await approveStudent(studentId, action, '');
      toast.success(`Student ${status === 'approved' ? 'verified' : 'rejected'} successfully!`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to remove this student? They will lose verification status and access to college features.")) return;
    try {
      await unlinkStudent(studentId);
      toast.success('Student removed successfully');
      loadData();
    } catch (err) {
      toast.error('Failed to remove student');
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes(search.toLowerCase()) || 
                          (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
                          (s.degree || '').toLowerCase().includes(search.toLowerCase());
                          
    if (!matchesSearch) return false;
    if (filter === 'verified') return s.verified;
    if (filter === 'rejected') return s.verification_status === 'rejected';
    return true; // 'all' or 'pending' handled differently
  });

  return (
    <DashboardLayout title="Manage Students" subtitle="View and verify students registered under your institution">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {['all', 'verified', 'pending', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'} btn-sm`}
              style={{ textTransform: 'capitalize' }}
            >
              {f} {f === 'pending' && requests.length > 0 && `(${requests.length})`}
            </button>
          ))}
        </div>
        <input 
          className="form-input" 
          placeholder="🔍 Search students..." 
          style={{ maxWidth: 300 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Pending Requests Section (Always on top if filter is 'all' or 'pending') */}
          {(filter === 'all' || filter === 'pending') && requests.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
              <h4 style={{ margin: '0 0 var(--space-4)' }}>⚠️ Pending Verifications</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {requests.map(req => (
                  <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{req.studentName}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {req.studentEmail || req.email} • {req.degree} (Class of {req.graduationYear || req.graduation_year})
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button onClick={() => handleVerify(req.id, req.studentUid || req.studentId, 'approved')} className="btn btn-success btn-sm">Approve</button>
                      <button onClick={() => handleVerify(req.id, req.studentUid || req.studentId, 'rejected')} className="btn btn-danger btn-sm">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student List Section */}
          {(filter !== 'pending') && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-surface)' }}>
                  <tr>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Name</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Academic Details</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CGPA</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => (
                      <tr key={student.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <div style={{ fontWeight: 600 }}>{student.name || `${student.first_name || ''} ${student.last_name || ''}`}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{student.email}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3)', fontSize: '0.9rem' }}>
                          <div>{student.degree || 'Degree N/A'} {student.department && <span style={{color: 'var(--text-muted)'}}>— {student.department}</span>}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {student.current_year ? `Year ${student.current_year}` : ''} 
                            {student.current_semester ? ` (Sem ${student.current_semester})` : ''} 
                            {student.graduation_year ? ` • Class of ${student.graduation_year}` : ''}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-3)', fontSize: '0.9rem', fontWeight: 600 }}>
                          {student.cgpa || '-'}
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          {student.verified ? (
                            <span className="badge badge-success">Verified</span>
                          ) : student.verification_status === 'rejected' ? (
                            <span className="badge badge-danger">Rejected</span>
                          ) : (
                            <span className="badge badge-warning">Pending</span>
                          )}
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                          <button onClick={() => handleRemoveStudent(student.id)} className="btn btn-danger btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
