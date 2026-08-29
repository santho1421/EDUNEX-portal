import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  loginWithEmailAndPassword,
  loginWithGoogle,
  registerWithEmailAndPassword,
  getFirebaseErrorMessage,
} from '../../services/firebaseAuth';
import { registerStudent, registerCollege, registerCompany } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import logo from '../../assets/logo.jpeg';

const ROLES = [
  { key: 'student', label: 'Student', icon: '🎓', desc: 'Find jobs, internships & courses' },
  { key: 'college', label: 'College', icon: '🏛️', desc: 'Manage students & curriculum' },
  { key: 'company', label: 'Company', icon: '🏢', desc: 'Post jobs & find talent' },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('student');
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Student login/register
  const [studentForm, setStudentForm] = useState({ email: '', password: '', confirmPassword: '' });

  // College registration
  const [collegeForm, setCollegeForm] = useState({
    institutionName: '', managementName: '', contactPhone: '',
    contactEmail: '', password: '', confirmPassword: '', website: '', city: '', state: '', type: 'private', affiliation: '',
  });

  // Company registration
  const [companyForm, setCompanyForm] = useState({
    companyName: '', industrySector: '', companySize: '', website: '',
    managementName: '', contactPhone: '', contactEmail: '', password: '', confirmPassword: '', city: '', state: '',
  });

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // ── Student: Email/Password ──────────────────────────────────────────────
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'register' && studentForm.password !== studentForm.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      let token, user;
      if (mode === 'register') {
        ({ token, user } = await registerWithEmailAndPassword({ email: studentForm.email, password: studentForm.password, role: 'student' }));
        user.needsOnboarding = true; // New students always need onboarding
      } else {
        ({ token, user } = await loginWithEmailAndPassword(studentForm.email, studentForm.password));
      }
      login(token, user);
      if (user.needsOnboarding) {
        navigate('/onboarding');
      } else {
        navigate(`/${user.role || 'student'}/dashboard`);
      }
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign-In (Student only) ────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { token, user } = await loginWithGoogle();
      login(token, user);
      if (user.needsOnboarding) {
        navigate('/onboarding');
      } else {
        navigate(`/${user.role || 'student'}/dashboard`);
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(getFirebaseErrorMessage(err));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── College Registration ──────────────────────────────────────────────────
  const handleCollegeRegister = async (e) => {
    e.preventDefault();
    if (!collegeForm.institutionName || !collegeForm.managementName || !collegeForm.contactPhone || !collegeForm.password) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (collegeForm.password !== collegeForm.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      // Register with Firebase first (email required)
      const email = collegeForm.contactEmail || `${collegeForm.institutionName.toLowerCase().replace(/\s+/g, '')}@edunex.in`;
      const password = collegeForm.password;
      const { token } = await registerWithEmailAndPassword({ email, password, role: 'college', name: collegeForm.institutionName });

      // Save token to localStorage so api calls work
      localStorage.setItem('sb_token', token);

      // Submit college registration to backend
      const res = await registerCollege(collegeForm);
      if (res.data.success) {
        login(token, { ...res.data.user, needsOnboarding: false });
        toast.success('Registration submitted! Admin will review and approve your account.');
        navigate('/college/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || getFirebaseErrorMessage(err) || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── Company Registration ──────────────────────────────────────────────────
  const handleCompanyRegister = async (e) => {
    e.preventDefault();
    if (!companyForm.companyName || !companyForm.managementName || !companyForm.contactPhone || !companyForm.password) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (companyForm.password !== companyForm.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const email = companyForm.contactEmail || `${companyForm.companyName.toLowerCase().replace(/\s+/g, '')}@edunex.in`;
      const password = companyForm.password;
      const { token } = await registerWithEmailAndPassword({ email, password, role: 'industry', name: companyForm.companyName });
      
      // Save token to localStorage so api calls work
      localStorage.setItem('sb_token', token);

      const res = await registerCompany(companyForm);
      if (res.data.success) {
        login(token, { ...res.data.user, needsOnboarding: false });
        toast.success('Registration submitted! Admin will review and approve your account.');
        navigate('/industry/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || getFirebaseErrorMessage(err) || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-hero)', padding: 'var(--space-6)', position: 'relative', overflow: 'hidden' }}>
      <div className="hero-glow hero-glow-1" />

      <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', textDecoration: 'none' }}>
            <img src={logo} alt="EduNex Logo" style={{ width: 40, height: 40, background: '#fff', borderRadius: 'var(--radius-lg)', padding: '2px', objectFit: 'contain' }} />
            <span className="text-gradient">EduNex</span>
          </Link>
        </div>

        <div className="card" style={{ padding: 'var(--space-8)' }}>
          {/* Role Selector */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: 1 }}>I am a</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
              {ROLES.map(r => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setSelectedRole(r.key)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: 'var(--space-3) var(--space-2)',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${selectedRole === r.key ? 'var(--color-primary)' : 'var(--border-default)'}`,
                    background: selectedRole === r.key ? 'var(--color-primary-light)' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{r.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: selectedRole === r.key ? 'var(--color-primary)' : 'var(--text-primary)' }}>{r.label}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-default)', marginBottom: 'var(--space-6)' }}>
            {['login', 'register'].map(m => (
              <button key={m} type="button" onClick={() => setMode(m)} style={{
                flex: 1, padding: 'var(--space-2)', background: mode === m ? 'var(--color-primary)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', textTransform: 'capitalize',
              }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Google Sign-In (Available for all log in, but only student sign up) */}
          {(mode === 'login' || selectedRole === 'student') && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                id="google-signin-btn"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  padding: '0.75rem 1rem', backgroundColor: '#ffffff', color: '#333333',
                  border: '1px solid #dadce0', borderRadius: 'var(--radius-md)', fontSize: '0.95rem',
                  fontWeight: 600, cursor: 'pointer', marginBottom: 'var(--space-4)', transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                {googleLoading ? 'Signing in...' : `${mode === 'register' ? 'Sign up' : 'Sign in'} with Google`}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: 'var(--space-4) 0', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-default)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>OR</span>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-default)' }} />
              </div>
            </>
          )}

          {/* ── GENERIC LOGIN & STUDENT REGISTER ────────────────────────────── */}
          {(mode === 'login' || (mode === 'register' && selectedRole === 'student')) && (
            <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input id="student-email" type="email" className="form-input" placeholder="you@example.com"
                    value={studentForm.email} onChange={e => setStudentForm(p => ({ ...p, email: e.target.value }))} required autoComplete="email" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input id="student-password" type={showPass ? 'text' : 'password'} className="form-input" placeholder="Your password"
                      value={studentForm.password} onChange={e => setStudentForm(p => ({ ...p, password: e.target.value }))} required autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                {mode === 'register' && (
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input id="student-confirm-password" type="password" className="form-input" placeholder="Repeat password"
                      value={studentForm.confirmPassword} onChange={e => setStudentForm(p => ({ ...p, confirmPassword: e.target.value }))} required autoComplete="new-password" />
                  </div>
                )}
                <button id="student-submit-btn" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading
                    ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Processing...</>
                    : mode === 'login' ? 'Sign In →' : 'Create Account →'}
                </button>
              </form>
          )}

          {/* ── COLLEGE REGISTER ────────────────────────────────────────────── */}
          {mode === 'register' && selectedRole === 'college' && (
            <form onSubmit={handleCollegeRegister} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-2)', border: '1px solid var(--color-primary)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', margin: 0, fontWeight: 500 }}>
                  📋 Your registration will be sent to the EduNex admin for review. You'll receive a notification once approved.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Institution Name *</label>
                <input id="college-name" className="form-input" placeholder="e.g. National Institute of Technology"
                  value={collegeForm.institutionName} onChange={e => setCollegeForm(p => ({ ...p, institutionName: e.target.value }))} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select id="college-type" className="form-input" value={collegeForm.type} onChange={e => setCollegeForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="private">Private</option>
                    <option value="government">Government</option>
                    <option value="deemed">Deemed</option>
                    <option value="autonomous">Autonomous</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Affiliation</label>
                  <input id="college-affiliation" className="form-input" placeholder="e.g. Anna University"
                    value={collegeForm.affiliation} onChange={e => setCollegeForm(p => ({ ...p, affiliation: e.target.value }))} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Contact Details</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">Management Name *</label>
                    <input id="college-contact-name" className="form-input" placeholder="e.g. Board of Directors / Dean"
                      value={collegeForm.managementName} onChange={e => setCollegeForm(p => ({ ...p, managementName: e.target.value }))} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="form-group">
                      <label className="form-label">Contact Phone *</label>
                      <input id="college-phone" type="tel" className="form-input" placeholder="+91 98765 43210"
                        value={collegeForm.contactPhone} onChange={e => setCollegeForm(p => ({ ...p, contactPhone: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Email</label>
                      <input id="college-email" type="email" className="form-input" placeholder="admin@college.edu"
                        value={collegeForm.contactEmail} onChange={e => setCollegeForm(p => ({ ...p, contactEmail: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input id="college-city" className="form-input" placeholder="Chennai"
                        value={collegeForm.city} onChange={e => setCollegeForm(p => ({ ...p, city: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input id="college-state" className="form-input" placeholder="Tamil Nadu"
                        value={collegeForm.state} onChange={e => setCollegeForm(p => ({ ...p, state: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input id="college-website" type="url" className="form-input" placeholder="https://www.college.edu"
                      value={collegeForm.website} onChange={e => setCollegeForm(p => ({ ...p, website: e.target.value }))} />
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Account Security</p>
                    <div className="form-group">
                      <label className="form-label">Password *</label>
                      <input id="college-password" type="password" className="form-input" placeholder="Create a password"
                        value={collegeForm.password} onChange={e => setCollegeForm(p => ({ ...p, password: e.target.value }))} required autoComplete="new-password" />
                    </div>
                    <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
                      <label className="form-label">Confirm Password *</label>
                      <input id="college-confirm-password" type="password" className="form-input" placeholder="Repeat password"
                        value={collegeForm.confirmPassword} onChange={e => setCollegeForm(p => ({ ...p, confirmPassword: e.target.value }))} required autoComplete="new-password" />
                    </div>
                  </div>
                </div>
              </div>

              <button id="college-submit-btn" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Submitting...</> : 'Submit Registration Request →'}
              </button>
            </form>
          )}

          {/* ── COMPANY REGISTER ────────────────────────────────────────────── */}
          {mode === 'register' && selectedRole === 'company' && (
            <form onSubmit={handleCompanyRegister} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-2)', border: '1px solid var(--color-primary)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', margin: 0, fontWeight: 500 }}>
                  📋 Your registration will be sent to the EduNex admin for review. You'll receive a notification once approved.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input id="company-name" className="form-input" placeholder="e.g. TechVision Solutions Pvt. Ltd."
                  value={companyForm.companyName} onChange={e => setCompanyForm(p => ({ ...p, companyName: e.target.value }))} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Industry Sector</label>
                  <select id="company-sector" className="form-input" value={companyForm.industrySector} onChange={e => setCompanyForm(p => ({ ...p, industrySector: e.target.value }))}>
                    <option value="">Select...</option>
                    <option value="IT & Software">IT & Software</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Company Size</label>
                  <select id="company-size" className="form-input" value={companyForm.companySize} onChange={e => setCompanyForm(p => ({ ...p, companySize: e.target.value }))}>
                    <option value="">Select...</option>
                    <option value="1-10">1–10 employees</option>
                    <option value="11-50">11–50 employees</option>
                    <option value="51-200">51–200 employees</option>
                    <option value="201-1000">201–1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Contact Details</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div className="form-group">
                    <label className="form-label">Management Name *</label>
                    <input id="company-contact-name" className="form-input" placeholder="e.g. HR Department / Board"
                      value={companyForm.managementName} onChange={e => setCompanyForm(p => ({ ...p, managementName: e.target.value }))} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="form-group">
                      <label className="form-label">Contact Phone *</label>
                      <input id="company-phone" type="tel" className="form-input" placeholder="+91 98765 43210"
                        value={companyForm.contactPhone} onChange={e => setCompanyForm(p => ({ ...p, contactPhone: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Email</label>
                      <input id="company-email" type="email" className="form-input" placeholder="hr@company.com"
                        value={companyForm.contactEmail} onChange={e => setCompanyForm(p => ({ ...p, contactEmail: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input id="company-city" className="form-input" placeholder="Bangalore"
                        value={companyForm.city} onChange={e => setCompanyForm(p => ({ ...p, city: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input id="company-state" className="form-input" placeholder="Karnataka"
                        value={companyForm.state} onChange={e => setCompanyForm(p => ({ ...p, state: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company Website</label>
                    <input id="company-website" type="url" className="form-input" placeholder="https://www.company.com"
                      value={companyForm.website} onChange={e => setCompanyForm(p => ({ ...p, website: e.target.value }))} />
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Account Security</p>
                    <div className="form-group">
                      <label className="form-label">Password *</label>
                      <input id="company-password" type="password" className="form-input" placeholder="Create a password"
                        value={companyForm.password} onChange={e => setCompanyForm(p => ({ ...p, password: e.target.value }))} required autoComplete="new-password" />
                    </div>
                    <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
                      <label className="form-label">Confirm Password *</label>
                      <input id="company-confirm-password" type="password" className="form-input" placeholder="Repeat password"
                        value={companyForm.confirmPassword} onChange={e => setCompanyForm(p => ({ ...p, confirmPassword: e.target.value }))} required autoComplete="new-password" />
                    </div>
                  </div>
                </div>
              </div>

              <button id="company-submit-btn" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Submitting...</> : 'Submit Registration Request →'}
              </button>
            </form>
          )}
        </div>

        {/* Admin login link */}
        <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          EduNex Admin?{' '}
          <Link to="/admin/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
            Admin Login →
          </Link>
        </p>
      </div>
    </div>
  );
}
