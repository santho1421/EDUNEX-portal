import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getCollectionData, deleteDocument } from '../../services/firebaseDb';
import { useToast } from '../../contexts/ToastContext';

export default function AdminJobs() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await getCollectionData('jobs');
      setJobs(res || []);
    } catch (err) {
      toast.error('Failed to load jobs');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        await deleteDocument('jobs', id);
        toast.success('Job deleted');
        loadJobs();
      } catch (err) {
        toast.error('Failed to delete job');
      }
    }
  };

  return (
    <DashboardLayout title="Manage Job Postings" subtitle="View and moderate all active job postings on the platform">
      <div className="card">
        {loading ? <div>Loading jobs...</div> : jobs.length === 0 ? <p>No job postings found in the database.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {jobs.map(job => (
              <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{job.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{job.company_name} · {job.location} · ₹{job.salary_min} - ₹{job.salary_max}</p>
                </div>
                <button onClick={() => handleDelete(job.id)} className="btn btn-danger btn-sm">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
