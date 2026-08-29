import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getAllUsers, getMasterCourses, getMasterCertifications } from '../../api/admin';
import { addDocument, setDocument } from '../../services/firebaseDb';
import { useToast } from '../../contexts/ToastContext';
import { FALLBACK_SKILLS } from '../../data/fallbackSkills';
import { CERTIFICATIONS } from '../../data/certifications';
import { INDIAN_COLLEGES } from '../../data/colleges';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      getAllUsers('student'),
      getAllUsers('college'),
      getAllUsers('industry'),
      getMasterCourses(),
      getMasterCertifications()
    ]).then(([students, colleges, industries, courses, certs]) => {
      setStats({
        studentCount: students.length,
        collegeCount: colleges.length,
        industryCount: industries.length,
        courseCount: courses.length,
        certCount: certs.length
      });
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <DashboardLayout title="Admin Dashboard"><div style={{ padding: 40, textAlign: 'center' }}>Loading...</div></DashboardLayout>;
  }

  const handleSeedDatabase = async () => {
    if (!window.confirm('This will insert 50+ certificates and 100+ skills into the database. Proceed?')) return;
    setSeeding(true);
    toast.success('Seeding started. This might take a moment...');
    
    try {
      // Seed Skills
      for (const skill of FALLBACK_SKILLS) {
        await addDocument('master_skills', { name: skill.name, category: skill.category });
      }
      
      // Seed Certifications
      for (const cert of CERTIFICATIONS) {
        await addDocument('master_certifications', { name: cert.name, mapped_skill: cert.mapped_skill, proficiency: cert.proficiency });
      }

      // Seed Courses
      const sampleCourses = [
        { title: 'Advanced React Patterns', description: 'Master React performance and patterns.', difficulty: 'advanced', price: 0, is_free: true, company_name: 'TechFlow', skills_covered: 'React, Frontend, JavaScript' },
        { title: 'Intro to Node.js', description: 'Build scalable backends with Node.', difficulty: 'beginner', price: 500, is_free: false, company_name: 'Code Academy', skills_covered: 'Node.js, Backend' },
        { title: 'Full Stack Python', description: 'Complete Django and React guide.', difficulty: 'intermediate', price: 1500, is_free: false, company_name: 'TechFlow', skills_covered: 'Python, React, Django' }
      ];
      for (const course of sampleCourses) {
        await addDocument('master_courses', course);
      }
      
      // Seed 2 sample jobs just to have something in the DB
      await addDocument('jobs', { title: 'Frontend Developer Intern', company_name: 'TechFlow', location: 'Remote', salary_min: 300000, salary_max: 500000 });
      await addDocument('jobs', { title: 'Backend Developer', company_name: 'CloudSys', location: 'Hyderabad', salary_min: 600000, salary_max: 900000 });

      // Seed Dummy Users (Students, College, Company) so Admin table populates
      await setDocument('users', 'dummy-student', { name: 'Alice Student', email: 'alice@student.local', role: 'student', first_name: 'Alice', last_name: 'Doe' });
      await setDocument('users', 'dummy-college', { name: 'Tech University', email: 'admin@techuniv.edu', role: 'college', first_name: 'Tech', last_name: 'Univ' });
      await setDocument('users', 'dummy-industry', { name: 'TechFlow Corp', email: 'hr@techflow.com', role: 'industry', first_name: 'TechFlow', last_name: 'HR' });

      // Seed Colleges
      for (const college of INDIAN_COLLEGES) {
        await addDocument('master_colleges', college);
      }

      toast.success('Database seeded successfully! Please refresh the page.');
    } catch (err) {
      toast.error('Error during seeding: ' + err.message);
    }
    setSeeding(false);
  };

  const statCards = [
    { label: 'Total Students', value: stats.studentCount, icon: '👨‍🎓', color: 'var(--color-primary)' },
    { label: 'Total Colleges', value: stats.collegeCount, icon: '🏛️', color: 'var(--color-success)' },
    { label: 'Total Industries', value: stats.industryCount, icon: '🏢', color: 'var(--color-warning)' },
    { label: 'Master Courses', value: stats.courseCount, icon: '📚', color: 'var(--color-danger)' },
    { label: 'Master Certifications', value: stats.certCount, icon: '🏆', color: 'var(--cyan-500)' },
  ];

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Manage master data and platform users">
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="card-stat">
            <div className="card-stat-icon" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
              <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
            </div>
            <div className="card-stat-info">
              <div className="card-stat-value">{s.value}</div>
              <div className="card-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--color-success-light)' }}>Database Seeding Tool</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>If your database is empty, click this to upload the default 100+ skills and 50+ certifications to Firebase.</p>
        </div>
        <button onClick={handleSeedDatabase} disabled={seeding} className="btn btn-success">
          {seeding ? 'Seeding...' : 'Seed Database 🌱'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Master Data Management</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>Add, edit, or delete the global lists of courses and certifications available to users.</p>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Link to="/admin/certifications" className="btn btn-primary">Manage Certifications</Link>
            <Link to="/admin/courses" className="btn btn-secondary">Manage Courses</Link>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>User Management</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>View and manage registered students, colleges, and industry partners.</p>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Link to="/admin/users" className="btn btn-primary">Manage Users</Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
