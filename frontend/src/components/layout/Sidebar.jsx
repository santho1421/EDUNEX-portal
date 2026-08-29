import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.jpeg';

const STUDENT_LINKS = [
  { to: '/student/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/student/skills', icon: '⚡', label: 'My Skills' },
  { to: '/student/courses', icon: '🎓', label: 'Courses' },
  { to: '/student/jobs', icon: '💼', label: 'Jobs & Internships' },
  { to: '/student/applications', icon: '📋', label: 'Applications' },
  { to: '/student/profile', icon: '👤', label: 'Profile' },
  { to: '/student/notifications', icon: '🔔', label: 'Notifications' },
];

const COLLEGE_LINKS = [
  { to: '/college/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/college/students', icon: '👥', label: 'Manage Students' },
  { to: '/college/companies', icon: '🏢', label: 'Partner Companies' },
  { to: '/college/curriculum', icon: '📚', label: 'Curriculum' },
  { to: '/college/skill-gap', icon: '⚡', label: 'Skill Gap Analysis' },
  { to: '/college/opportunities', icon: '🌐', label: 'Opportunities' },
  { to: '/college/profile', icon: '🏛️', label: 'Profile' },
];

const INDUSTRY_LINKS = [
  { to: '/industry/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/industry/jobs', icon: '💼', label: 'Jobs & Internships' },
  { to: '/industry/courses', icon: '🎓', label: 'Courses' },
  { to: '/industry/applications', icon: '📋', label: 'Applications' },
  { to: '/industry/talent', icon: '🔍', label: 'Talent Search' },
  { to: '/industry/colleges', icon: '🏛️', label: 'Colleges' },
  { to: '/industry/profile', icon: '🏢', label: 'Profile' },
];

const ADMIN_LINKS = [
  { to: '/admin/dashboard', icon: '⬡', label: 'Admin Dashboard' },
  { to: '/admin/verifications', icon: '🛡️', label: 'Verifications' },
  { to: '/admin/skills', icon: '⚡', label: 'Master Skills' },
  { to: '/admin/certifications', icon: '🏆', label: 'Master Certs' },
  { to: '/admin/courses', icon: '📚', label: 'Master Courses' },
  { to: '/admin/colleges', icon: '🏛️', label: 'Master Colleges' },
  { to: '/admin/jobs', icon: '💼', label: 'Manage Jobs' },
  { to: '/admin/users', icon: '👥', label: 'Manage Users' },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const links = user?.role === 'admin' ? ADMIN_LINKS : user?.role === 'student' ? STUDENT_LINKS : user?.role === 'college' ? COLLEGE_LINKS : INDUSTRY_LINKS;
  const roleLabel = { student: 'Student', college: 'College', industry: 'Industry', admin: 'Admin' }[user?.role] || 'User';
  const roleBadgeColor = { student: 'badge-cyan', college: 'badge-violet', industry: 'badge-success', admin: 'badge-danger' }[user?.role] || 'badge-muted';

  return (
    <>
      {mobileOpen && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 49, backdropFilter: 'blur(4px)' }} />}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} style={{ zIndex: 50 }}>
        {/* Brand */}
        <NavLink to="/" className="sidebar-brand">
          <img src={logo} alt="Logo" className="sidebar-brand-icon" style={{ background: '#fff', padding: '2px', objectFit: 'contain' }} />
          <span className="text-gradient">EduNex</span>
        </NavLink>

        {/* User info */}
        <div style={{ padding: '0 var(--space-5) var(--space-5)' }}>
          <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div className="avatar-placeholder avatar-sm" style={{ background: 'var(--gradient-primary)', fontSize: '0.7rem' }}>
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || user?.email}
                </div>
                <span className={`badge ${roleBadgeColor}`} style={{ marginTop: 3, fontSize: '0.68rem' }}>{roleLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          <div className="sidebar-section-label">Menu</div>
          {links.map(link => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
              <span className="sidebar-icon">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: 'var(--space-4) var(--space-3)' }}>
          <button
            onClick={logout}
            className="btn btn-ghost btn-full"
            style={{ justifyContent: 'flex-start', gap: 'var(--space-3)', fontSize: '0.875rem', color: 'var(--color-danger-light)' }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
