import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';

export default function DashboardLayout({ children, title, subtitle, actions }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="dashboard-layout">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="dashboard-main">
        {/* Topbar */}
        <div className="dashboard-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <button
              onClick={() => setMobileOpen(true)}
              className="btn btn-icon btn-secondary"
              style={{ display: 'none' }}
              id="sidebar-toggle"
            >☰</button>
            <div>
              {title && <h1 style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1 }}>{title}</h1>}
              {subtitle && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            {actions}
            <button
              onClick={toggleTheme}
              className="btn btn-icon btn-secondary"
              title="Toggle Theme"
              style={{ borderRadius: '50%', width: 36, height: 36 }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="dashboard-content animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile toggle CSS */}
      <style>{`
        @media (max-width: 1024px) {
          #sidebar-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
