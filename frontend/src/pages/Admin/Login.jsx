import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { loginWithEmailAndPassword, registerWithEmailAndPassword } from '../../services/firebaseAuth';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Fixed credentials for Super Admin
    if (form.username === 'admin' && form.password === 'admin123') {
      try {
        // Try to log in with real Firebase Auth so Firestore rules pass
        const { token, user } = await loginWithEmailAndPassword('admin@skillbridge.com', form.password);
        login(token, user);
        toast.success('Admin access granted.');
        navigate('/admin/dashboard');
      } catch (err) {
        // If account doesn't exist yet, create it instantly
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          try {
            const { token, user } = await registerWithEmailAndPassword({
              email: 'admin@skillbridge.com',
              password: form.password,
              name: 'System Admin',
              role: 'admin'
            });
            login(token, user);
            toast.success('Admin account created and access granted.');
            navigate('/admin/dashboard');
          } catch (regErr) {
            toast.error('Failed to authenticate admin with Firebase: ' + regErr.message);
          }
        } else {
          toast.error('Failed to authenticate admin: ' + err.message);
        }
      }
    } else {
      toast.error('Invalid admin credentials.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: 'var(--space-6)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 'var(--space-8)', borderTop: '4px solid var(--color-danger)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 4, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Admin Portal</h2>
        <p style={{ textAlign: 'center', marginBottom: 'var(--space-6)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Restricted Access Only</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter admin username" 
              value={form.username} 
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Enter admin password" 
              value={form.password} 
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} 
              required 
            />
          </div>

          <button type="submit" className="btn btn-danger btn-full btn-lg">
            Secure Login
          </button>
        </form>
      </div>
    </div>
  );
}
