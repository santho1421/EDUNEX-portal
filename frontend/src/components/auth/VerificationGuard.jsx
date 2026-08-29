import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Pending screen component (reused for both student and college/company pending states)
function PendingScreen({ icon, title, description, details, onRefresh }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 'var(--space-6)' }}>
      <div className="card" style={{ maxWidth: 520, width: '100%', textAlign: 'center', padding: 'var(--space-8)' }}>
        <div style={{ width: 80, height: 80, background: 'var(--gradient-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto var(--space-6)' }}>
          {icon}
        </div>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>{title}</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
          {description}
        </p>
        <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', textAlign: 'left', marginBottom: 'var(--space-6)', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-3)', letterSpacing: 1 }}>What happens next?</h4>
          <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {details.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
        <button onClick={onRefresh} className="btn btn-outline btn-full">
          🔄 Refresh Status
        </button>
      </div>
    </div>
  );
}

export default function VerificationGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Verifying account status...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Student who hasn't completed onboarding OR hasn't selected their college yet
  if (!user.role || user.needsOnboarding || (user.role === 'student' && !user.college)) {
    return <Navigate to="/onboarding" replace />;
  }

  // ── STUDENT: awaiting college verification ──────────────────────────────
  if (user.role === 'student' && !user.verified) {
    if (user.verificationStatus === 'rejected') {
      return (
        <PendingScreen
          icon="❌"
          title="Verification Rejected"
          description={`Your verification request was rejected by ${user.college || 'your college'}. Please contact your college admin or re-register with correct details.`}
          details={[
            'Contact your college admin directly to clarify the issue.',
            'You may also email edunex.support@gmail.com for help.',
            'After resolving, log out and sign in again to retry.',
          ]}
          onRefresh={() => window.location.reload()}
        />
      );
    }

    return (
      <PendingScreen
        icon="⏳"
        title="Awaiting College Verification"
        description={`Your account is pending verification from ${user.college || 'your college'}. A notification has been sent to your college admin.`}
        details={[
          'Your college admin will review your profile and student details.',
          'Once approved, your profile will be activated.',
          'You will gain full access to Skill Gap Analysis and the Job Board.',
        ]}
        onRefresh={() => window.location.reload()}
      />
    );
  }

  // ── COLLEGE: awaiting admin verification ────────────────────────────────
  if (user.role === 'college' && !user.verified) {
    if (user.verificationStatus === 'rejected') {
      return (
        <PendingScreen
          icon="❌"
          title="Registration Rejected"
          description="Your college registration was rejected by the EduNex admin. Please check your email for details or contact support."
          details={[
            'Review the rejection reason sent to your email.',
            'Contact edunex.support@gmail.com for assistance.',
            'You may re-register with corrected details.',
          ]}
          onRefresh={() => window.location.reload()}
        />
      );
    }

    return (
      <PendingScreen
        icon="🏛️"
        title="Awaiting Admin Approval"
        description="Your college registration is pending approval by the EduNex admin. We will notify you once your account is approved."
        details={[
          'The EduNex admin team will review your registration details.',
          'This typically takes 1–2 business days.',
          'Once approved, you can manage students, curriculum, and skill gap analysis.',
        ]}
        onRefresh={() => window.location.reload()}
      />
    );
  }

  // ── COMPANY: awaiting admin verification ────────────────────────────────
  if (user.role === 'industry' && !user.verified) {
    if (user.verificationStatus === 'rejected') {
      return (
        <PendingScreen
          icon="❌"
          title="Registration Rejected"
          description="Your company registration was rejected by the EduNex admin. Please check your email or contact support."
          details={[
            'Review the rejection reason sent to your email.',
            'Contact edunex.support@gmail.com for assistance.',
            'You may re-register with corrected details.',
          ]}
          onRefresh={() => window.location.reload()}
        />
      );
    }

    return (
      <PendingScreen
        icon="🏢"
        title="Awaiting Admin Approval"
        description="Your company registration is pending approval by the EduNex admin. We will notify you once your account is approved."
        details={[
          'The EduNex admin team will review your company details.',
          'This typically takes 1–2 business days.',
          'Once approved, you can post jobs, internships, and courses.',
        ]}
        onRefresh={() => window.location.reload()}
      />
    );
  }

  // User is verified / admin — allow through
  return children;
}
