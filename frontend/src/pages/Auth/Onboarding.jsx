import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerStudent } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api/axios';
import logo from '../../assets/logo.jpeg';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    college: '',
    degree: '',
    department: '',
    currentYear: '',
    currentSemester: '',
    graduationYear: new Date().getFullYear() + 3,
  });
  const [dbColleges, setDbColleges] = useState([]);
  const [collegeSuggestions, setCollegeSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, logout, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Fetch verified colleges from database on mount
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await api.get('/auth/colleges');
        if (res.data.success) {
          setDbColleges(res.data.data.map(c => c.name));
        }
      } catch (err) {
        console.error('Failed to fetch colleges:', err);
      }
    };
    fetchColleges();
  }, []);

  // Filter suggestions as user types
  useEffect(() => {
    if (form.college.length >= 2) {
      const filtered = dbColleges.filter(c =>
        c.toLowerCase().includes(form.college.toLowerCase())
      );
      setCollegeSuggestions(filtered);
    } else {
      setCollegeSuggestions([]);
    }
  }, [form.college, dbColleges]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.college || !form.degree || !form.department) {
      toast.error('Please fill in all required fields.');
      return;
    }
    
    // Ensure the selected college is from the registered database
    if (!dbColleges.includes(form.college)) {
      toast.error('Please select a registered college from the dropdown list.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerStudent(form);
      if (res.data.success) {
        toast.success('Profile saved! Awaiting college verification.');
        updateUser({ ...res.data.user, needsOnboarding: false });
        navigate('/student/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete profile.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { className: 'form-input' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-hero)', padding: 'var(--space-6)', position: 'relative', overflow: 'hidden' }}>
      <div className="hero-glow hero-glow-1" />
      <div style={{ width: '100%', maxWidth: 540, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem' }}>
            <img src={logo} alt="Logo" style={{ width: 40, height: 40, background: '#fff', borderRadius: 'var(--radius-lg)', padding: '2px', objectFit: 'contain' }} />
            <span className="text-gradient">EduNex</span>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-8)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
              <button onClick={logout} className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
                Sign Out
              </button>
            </div>
            <div style={{ width: 56, height: 56, background: 'var(--gradient-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto var(--space-4)' }}>
              🎓
            </div>
            <h2 style={{ marginBottom: 4 }}>Complete Your Profile</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Hi {user?.email?.split('@')[0]}! Tell us about yourself to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input id="onboard-first-name" className="form-input" placeholder="Arjun"
                  value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input id="onboard-last-name" className="form-input" placeholder="Sharma"
                  value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>

            {/* College (searchable) */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">College / Institution *</label>
              <input
                id="onboard-college"
                className="form-input"
                placeholder="Type to search your college..."
                value={form.college}
                onChange={e => { setForm(p => ({ ...p, college: e.target.value })); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                required
                autoComplete="off"
              />
              {showSuggestions && collegeSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', maxHeight: 200, overflowY: 'auto',
                }}>
                  {collegeSuggestions.map((c, i) => (
                    <button key={i} type="button"
                      onMouseDown={(e) => { 
                        e.preventDefault(); // Prevent input from losing focus if needed, though onBlur will still fire.
                        setForm(p => ({ ...p, college: c })); 
                        setShowSuggestions(false); 
                      }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: 'var(--space-2) var(--space-3)', background: 'none', border: 'none',
                        cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.9rem',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      🏛️ {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Degree & Department */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Degree *</label>
                <select id="onboard-degree" className="form-input" value={form.degree} onChange={e => setForm(p => ({ ...p, degree: e.target.value }))} required>
                  <option value="">Select...</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="B.E.">B.E.</option>
                  <option value="B.Sc">B.Sc</option>
                  <option value="B.Com">B.Com</option>
                  <option value="BCA">BCA</option>
                  <option value="MBA">MBA</option>
                  <option value="MCA">MCA</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="M.Sc">M.Sc</option>
                  <option value="PhD">PhD</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <input id="onboard-department" className="form-input" placeholder="e.g. Computer Science"
                  value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} required />
              </div>
            </div>

            {/* Academic Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Current Year</label>
                <select id="onboard-year" className="form-input" value={form.currentYear} onChange={e => setForm(p => ({ ...p, currentYear: e.target.value }))}>
                  <option value="">Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select id="onboard-semester" className="form-input" value={form.currentSemester} onChange={e => setForm(p => ({ ...p, currentSemester: e.target.value }))}>
                  <option value="">Sem</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Grad Year</label>
                <input id="onboard-grad-year" type="number" className="form-input" placeholder="2027"
                  min={new Date().getFullYear()} max={new Date().getFullYear() + 6}
                  value={form.graduationYear} onChange={e => setForm(p => ({ ...p, graduationYear: e.target.value }))} />
              </div>
            </div>

            {/* Info note */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', border: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                📨 A verification request will be sent to your college admin. You'll have limited access until they verify your account.
              </p>
            </div>

            <button id="onboard-submit-btn" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 'var(--space-2)' }}>
              {loading
                ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Submitting...</>
                : 'Complete Profile & Continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
