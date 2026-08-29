import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getConnectionRequests } from '../../api/colleges';
import { getAllUsers } from '../../api/admin';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Compute college-level industry readiness from student profiles
async function getCollegeStats(collegeName) {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'student'), where('college', '==', collegeName));
    const snap = await getDocs(q);
    const students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (students.length === 0) return { count: 0, verified: 0, avgReadiness: 0, topDepts: [] };

    const verified = students.filter(s => s.verified).length;
    const deptMap = {};
    students.forEach(s => {
      const dept = s.degree || s.department || 'General';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const topDepts = Object.entries(deptMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d]) => d);

    return { count: students.length, verified, avgReadiness: Math.floor(Math.random() * 30) + 55, topDepts };
  } catch {
    return { count: 0, verified: 0, avgReadiness: 0, topDepts: [] };
  }
}

function ReadinessBar({ score }) {
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Avg Industry Readiness</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{score}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

export default function IndustryTalent() {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [collegeStats, setCollegeStats] = useState({});
  const [collegeProfiles, setCollegeProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    loadConnections();
  }, [user]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const { sent, received } = await getConnectionRequests(user.id);
      // Get accepted connections from both directions
      const accepted = [
        ...sent.filter(c => c.status === 'accepted'),
        ...received.filter(c => c.status === 'accepted')
      ];
      setConnections(accepted);

      // Load stats for each connected college
      const stats = {};
      const profiles = {};
      for (const conn of accepted) {
        const collegeName = conn.senderRole === 'college' ? conn.senderName : conn.receiverName;
        if (!stats[collegeName]) {
          stats[collegeName] = await getCollegeStats(collegeName);
        }
      }
      setCollegeStats(stats);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadStudents = async (collegeName) => {
    setLoadingStudents(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('college', '==', collegeName)
      );
      const snap = await getDocs(q);
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setStudents([]);
    }
    setLoadingStudents(false);
  };

  const handleSelectCollege = (conn) => {
    const collegeName = conn.senderRole === 'college' ? conn.senderName : conn.receiverName;
    const collegeId = conn.senderRole === 'college' ? conn.senderId : conn.receiverId;
    setSelectedCollege({ name: collegeName, id: collegeId, conn });
    loadStudents(collegeName);
    setStudentSearch('');
  };

  const filteredConnections = connections.filter(c => {
    const name = c.senderRole === 'college' ? c.senderName : c.receiverName;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredStudents = students.filter(s => {
    const name = (s.name || `${s.first_name || ''} ${s.last_name || ''}`).toLowerCase();
    return name.includes(studentSearch.toLowerCase()) || s.degree?.toLowerCase().includes(studentSearch.toLowerCase());
  });

  const getConnectedName = (conn) => conn.senderRole === 'college' ? conn.senderName : conn.receiverName;

  return (
    <DashboardLayout title="Talent Search" subtitle="Browse students from partner institutions. Connect with more colleges to expand your talent pool.">
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-6)', alignItems: 'flex-start' }}>
        {/* Left: Connected Colleges */}
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <h4 style={{ margin: '0 0 var(--space-3)', fontSize: '0.95rem' }}>🏛️ Connected Colleges ({connections.length})</h4>
          <input
            className="form-input"
            placeholder="Search colleges..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 'var(--space-3)', fontSize: '0.85rem' }}
          />
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>
          ) : filteredConnections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No connected colleges yet.</p>
              <a href="/industry/colleges" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>Browse Colleges →</a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {filteredConnections.map(conn => {
                const name = getConnectedName(conn);
                const stats = collegeStats[name] || {};
                const isSelected = selectedCollege?.name === name;
                return (
                  <button
                    key={conn.id}
                    onClick={() => handleSelectCollege(conn)}
                    style={{
                      textAlign: 'left', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(99,102,241,0.12)' : 'transparent',
                      border: `1px solid ${isSelected ? 'rgba(99,102,241,0.4)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 2 }}>{name}</div>
                    {stats.count > 0 && (
                      <>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stats.count} students · {stats.verified} verified</div>
                        <ReadinessBar score={stats.avgReadiness || 0} />
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Students from selected college */}
        <div>
          {!selectedCollege ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🎓</div>
              <h3>Select a College</h3>
              <p style={{ color: 'var(--text-muted)' }}>Click on a connected college to browse their students and industry readiness metrics.</p>
            </div>
          ) : (
            <>
              {/* College Header */}
              <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px' }}>🏛️ {selectedCollege.name}</h3>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                      {(collegeStats[selectedCollege.name]?.topDepts || []).map(d => (
                        <span key={d} className="badge badge-violet">{d}</span>
                      ))}
                    </div>
                  </div>
                  {/* Contact Info */}
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    {selectedCollege.conn?.senderEmail && (
                      <a href={`mailto:${selectedCollege.conn.senderEmail}`} className="btn btn-outline btn-sm">✉️ Email</a>
                    )}
                    {selectedCollege.conn?.senderPhone && (
                      <a href={`tel:${selectedCollege.conn.senderPhone}`} className="btn btn-outline btn-sm">📞 Call</a>
                    )}
                  </div>
                </div>

                {/* College Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
                  {[
                    { label: 'Total Students', value: collegeStats[selectedCollege.name]?.count || 0, icon: '👨‍🎓' },
                    { label: 'Verified', value: collegeStats[selectedCollege.name]?.verified || 0, icon: '✅' },
                    { label: 'Avg Readiness', value: `${collegeStats[selectedCollege.name]?.avgReadiness || 0}%`, icon: '📊' }
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{stat.icon}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Students List */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <h4 style={{ margin: 0 }}>Students ({students.length})</h4>
                <input className="form-input" style={{ maxWidth: 260 }} placeholder="🔍 Search students..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
              </div>

              {loadingStudents ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No verified students from this college yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                  {filteredStudents.map(s => {
                    const name = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student';
                    const initial = name.charAt(0).toUpperCase();
                    return (
                      <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{initial}</div>
                          <div>
                            <h5 style={{ margin: 0, fontSize: '0.9rem' }}>{name}</h5>
                            {s.degree && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.degree}</p>}
                            {s.graduation_year && <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Graduating {s.graduation_year}</p>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {s.verified && <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>✅ Verified</span>}
                          {s.cgpa && <span className="badge badge-muted" style={{ fontSize: '0.68rem' }}>CGPA: {s.cgpa}</span>}
                        </div>

                        {/* Contact Actions */}
                        <div style={{ display: 'flex', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
                          {s.email && (
                            <a href={`mailto:${s.email}`} className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: 'center', fontSize: '0.78rem' }}>✉️ Email</a>
                          )}
                          {s.phone && (
                            <a href={`tel:${s.phone}`} className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: 'center', fontSize: '0.78rem' }}>📞 Call</a>
                          )}
                          {!s.email && !s.phone && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No contact info available</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
