import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getJobs, getInternships, getRecommendedJobs, getRecommendedInternships } from '../../api/jobs';
import { applyToJob, hasApplied } from '../../api/applications';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentJobs() {
  const toast = useToast();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [filterType, setFilterType] = useState('all'); // 'all' or 'recommended'
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recommendedInternships, setRecommendedInternships] = useState([]);
  const [search, setSearch] = useState('');
  const [applyModal, setApplyModal] = useState(null); // { job, type }
  const [coverNote, setCoverNote] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [applying, setApplying] = useState(false);
  const [appliedIds, setAppliedIds] = useState(new Set());

  useEffect(() => {
    Promise.all([getJobs(), getInternships(), getRecommendedJobs(), getRecommendedInternships()])
      .then(([jRes, iRes, rjRes, riRes]) => {
        setJobs(jRes.data?.data || []);
        setInternships(iRes.data?.data || []);
        setRecommendedJobs(rjRes.data?.data || []);
        setRecommendedInternships(riRes.data?.data || []);
      })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const openApplyModal = (job, type) => {
    setApplyModal({ job, type });
    setCoverNote('');
    setResumeFile(null);
  };

  const handleApply = async () => {
    if (!applyModal) return;
    if (!resumeFile) { toast.error('Please attach your resume (PDF).'); return; }
    setApplying(true);
    try {
      await applyToJob({
        jobId: applyModal.job.id,
        jobTitle: applyModal.job.title,
        companyId: applyModal.job.companyId || applyModal.job.company_id || applyModal.job.id,
        companyName: applyModal.job.company_name,
        resumeFile,
        coverNote
      });
      setAppliedIds(prev => new Set([...prev, applyModal.job.id]));
      toast.success('Application submitted! 🎉 Track it in My Applications.');
      setApplyModal(null);
    } catch (err) {
      toast.error(err.message || 'Failed to apply. Please try again.');
    } finally { setApplying(false); }
  };

  const items = activeTab === 'jobs' 
    ? (filterType === 'recommended' ? recommendedJobs : jobs) 
    : (filterType === 'recommended' ? recommendedInternships : internships);
  const filtered = items.filter(j => !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.company_name?.toLowerCase().includes(search.toLowerCase()));

  const JobCard = ({ j, type }) => {
    const applied = appliedIds.has(j.id) || false;
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: 48, height: 48, background: 'var(--gradient-primary)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>🏢</div>
            <div>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0, marginBottom: 2 }}>{j.title}</h4>
              <p style={{ fontSize: '0.82rem', margin: 0, color: 'var(--text-muted)' }}>{j.company_name}</p>
            </div>
          </div>
          {j.matchScore > 0 && (
            <span className="badge badge-success" style={{ fontWeight: 800 }}>✨ {j.matchScore}% Match</span>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {j.location && <span className="badge badge-muted">📍 {j.location}</span>}
          {type === 'job' && j.salary_min && <span className="badge badge-cyan">₹{(j.salary_min/100000).toFixed(1)}L–₹{(j.salary_max/100000).toFixed(1)}L</span>}
          {type === 'internship' && j.stipend_min > 0 && <span className="badge badge-cyan">₹{j.stipend_min?.toLocaleString()}/mo</span>}
          {j.department && <span className="badge badge-muted">{j.department}</span>}
        </div>

        {j.required_skills && (
          <div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Required Skills</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(Array.isArray(j.required_skills) ? j.required_skills : j.required_skills.split(',')).map((s, i) => (
                <span key={i} className="badge badge-muted" style={{ fontSize: '0.72rem' }}>{s.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {j.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>{j.description}</p>}

        <button
          className={applied ? 'btn btn-outline btn-sm' : 'btn btn-primary btn-sm'}
          disabled={applied}
          onClick={() => !applied && openApplyModal(j, type)}
          style={{ alignSelf: 'flex-start' }}
        >
          {applied ? '✅ Applied' : `Apply Now →`}
        </button>
      </div>
    );
  };

  return (
    <DashboardLayout title="Jobs & Internships" subtitle="Find and apply for opportunities that match your skills">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: 4, borderRadius: 'var(--radius-md)' }}>
            <button className={`btn btn-sm ${activeTab === 'jobs' ? 'btn-primary' : ''}`} style={activeTab !== 'jobs' ? { background: 'transparent', color: 'var(--text-muted)' } : {}} onClick={() => setActiveTab('jobs')}>💼 Jobs ({filterType === 'all' ? jobs.length : recommendedJobs.length})</button>
            <button className={`btn btn-sm ${activeTab === 'internships' ? 'btn-primary' : ''}`} style={activeTab !== 'internships' ? { background: 'transparent', color: 'var(--text-muted)' } : {}} onClick={() => setActiveTab('internships')}>🎓 Internships ({filterType === 'all' ? internships.length : recommendedInternships.length})</button>
          </div>
          
          <div style={{ width: 1, background: 'var(--border-subtle)', margin: '0 8px' }}></div>
          
          <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: 4, borderRadius: 'var(--radius-md)' }}>
            <button className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : ''}`} style={filterType !== 'all' ? { background: 'transparent', color: 'var(--text-muted)' } : {}} onClick={() => setFilterType('all')}>All</button>
            <button className={`btn btn-sm ${filterType === 'recommended' ? 'btn-success' : ''}`} style={filterType !== 'recommended' ? { background: 'transparent', color: 'var(--text-muted)' } : {}} onClick={() => setFilterType('recommended')}>✨ Recommended For Me</button>
          </div>
        </div>
        <input className="form-input" style={{ maxWidth: 280 }} placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>Loading opportunities...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>📭</div>
          <p style={{ color: 'var(--text-muted)' }}>No {activeTab} found. Check back soon!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
          {filtered.map(j => <JobCard key={j.id} j={j} type={activeTab === 'jobs' ? 'job' : 'internship'} />)}
        </div>
      )}

      {/* Apply Modal */}
      {applyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 'var(--space-7)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 4 }}>Apply for {applyModal.job.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>🏢 {applyModal.job.company_name}</p>

            <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>APPLICATION DETAILS (AUTO-FILLED FROM PROFILE)</p>
              <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>👤 {user?.name}</p>
              {user?.college && <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>🏛️ {user.college}</p>}
              {user?.degree && <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>📚 {user.degree}</p>}
              {user?.email && <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>✉️ {user.email}</p>}
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">Resume / CV (PDF) *</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={e => setResumeFile(e.target.files[0])}
                className="form-input"
                style={{ padding: '0.5rem' }}
              />
              {resumeFile && <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', marginTop: 4, display: 'block' }}>✅ {resumeFile.name}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
              <label className="form-label">Cover Note (Optional)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Briefly explain why you are a great fit for this role..."
                value={coverNote}
                onChange={e => setCoverNote(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button onClick={handleApply} disabled={applying} className="btn btn-primary" style={{ flex: 1 }}>
                {applying ? 'Submitting...' : 'Submit Application →'}
              </button>
              <button onClick={() => setApplyModal(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
