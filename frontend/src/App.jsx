import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import VerificationGuard from './components/auth/VerificationGuard';

// Lazy load pages for performance
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Onboarding = lazy(() => import('./pages/Auth/Onboarding'));

// Student Pages
const StudentDashboard = lazy(() => import('./pages/Student/Dashboard'));
const StudentProfile = lazy(() => import('./pages/Student/Profile'));
const StudentSkills = lazy(() => import('./pages/Student/Skills'));
const StudentCourses = lazy(() => import('./pages/Student/Courses'));
const StudentJobs = lazy(() => import('./pages/Student/Jobs'));
const StudentApplications = lazy(() => import('./pages/Student/Applications'));
const StudentNotifications = lazy(() => import('./pages/Student/Notifications'));

// College Pages
const CollegeDashboard = lazy(() => import('./pages/College/Dashboard'));
const CollegeProfile = lazy(() => import('./pages/College/Profile'));
const CollegeCurriculum = lazy(() => import('./pages/College/Curriculum'));
const CollegeSkillGap = lazy(() => import('./pages/College/SkillGap'));
const CollegeStudents = lazy(() => import('./pages/College/ManageStudents'));
const CollegeCompanies = lazy(() => import('./pages/College/Companies'));
const CollegeOpportunities = lazy(() => import('./pages/College/Opportunities'));

// Industry Pages
const IndustryDashboard = lazy(() => import('./pages/Industry/Dashboard'));
const IndustryProfile = lazy(() => import('./pages/Industry/Profile'));
const IndustryJobs = lazy(() => import('./pages/Industry/Jobs'));
const IndustryCourses = lazy(() => import('./pages/Industry/Courses'));
const IndustryTalent = lazy(() => import('./pages/Industry/Talent'));
const IndustryColleges = lazy(() => import('./pages/Industry/Colleges'));
const IndustryApplications = lazy(() => import('./pages/Industry/Applications'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminCourses = lazy(() => import('./pages/Admin/Courses'));
const AdminCertifications = lazy(() => import('./pages/Admin/Certifications'));
const AdminUsers = lazy(() => import('./pages/Admin/Users'));
const AdminSkills = lazy(() => import('./pages/Admin/Skills'));
const AdminJobs = lazy(() => import('./pages/Admin/Jobs'));
const AdminColleges = lazy(() => import('./pages/Admin/Colleges'));
const AdminLogin = lazy(() => import('./pages/Admin/Login'));
const AdminVerifications = lazy(() => import('./pages/Admin/Verifications'));

const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.needsOnboarding) return <Navigate to="/onboarding" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) {
    if (user.needsOnboarding) return <Navigate to="/onboarding" replace />;
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return children;
};

const OnboardingRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  
  // If they don't explicitly need onboarding AND they aren't a student missing a college, send them to dashboard
  if (!user.needsOnboarding && !(user.role === 'student' && !user.college)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  
  return children;
};

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/admin/login" element={<PublicRoute><AdminLogin /></PublicRoute>} />

      {/* Onboarding */}
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={<ProtectedRoute role="student"><VerificationGuard><StudentDashboard /></VerificationGuard></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute role="student"><VerificationGuard><StudentProfile /></VerificationGuard></ProtectedRoute>} />
      <Route path="/student/skills" element={<ProtectedRoute role="student"><VerificationGuard><StudentSkills /></VerificationGuard></ProtectedRoute>} />
      <Route path="/student/courses" element={<ProtectedRoute role="student"><VerificationGuard><StudentCourses /></VerificationGuard></ProtectedRoute>} />
      <Route path="/student/jobs" element={<ProtectedRoute role="student"><VerificationGuard><StudentJobs /></VerificationGuard></ProtectedRoute>} />
      <Route path="/student/applications" element={<ProtectedRoute role="student"><VerificationGuard><StudentApplications /></VerificationGuard></ProtectedRoute>} />
      <Route path="/student/notifications" element={<ProtectedRoute role="student"><VerificationGuard><StudentNotifications /></VerificationGuard></ProtectedRoute>} />

      {/* College Routes */}
      <Route path="/college/dashboard" element={<ProtectedRoute role="college"><VerificationGuard><CollegeDashboard /></VerificationGuard></ProtectedRoute>} />
      <Route path="/college/profile" element={<ProtectedRoute role="college"><VerificationGuard><CollegeProfile /></VerificationGuard></ProtectedRoute>} />
      <Route path="/college/curriculum" element={<ProtectedRoute role="college"><VerificationGuard><CollegeCurriculum /></VerificationGuard></ProtectedRoute>} />
      <Route path="/college/skill-gap" element={<ProtectedRoute role="college"><VerificationGuard><CollegeSkillGap /></VerificationGuard></ProtectedRoute>} />
      <Route path="/college/students" element={<ProtectedRoute role="college"><VerificationGuard><CollegeStudents /></VerificationGuard></ProtectedRoute>} />
      <Route path="/college/companies" element={<ProtectedRoute role="college"><VerificationGuard><CollegeCompanies /></VerificationGuard></ProtectedRoute>} />
      <Route path="/college/opportunities" element={<ProtectedRoute role="college"><VerificationGuard><CollegeOpportunities /></VerificationGuard></ProtectedRoute>} />

      {/* Industry Routes */}
      <Route path="/industry/dashboard" element={<ProtectedRoute role="industry"><VerificationGuard><IndustryDashboard /></VerificationGuard></ProtectedRoute>} />
      <Route path="/industry/profile" element={<ProtectedRoute role="industry"><VerificationGuard><IndustryProfile /></VerificationGuard></ProtectedRoute>} />
      <Route path="/industry/jobs" element={<ProtectedRoute role="industry"><VerificationGuard><IndustryJobs /></VerificationGuard></ProtectedRoute>} />
      <Route path="/industry/courses" element={<ProtectedRoute role="industry"><VerificationGuard><IndustryCourses /></VerificationGuard></ProtectedRoute>} />
      <Route path="/industry/talent" element={<ProtectedRoute role="industry"><VerificationGuard><IndustryTalent /></VerificationGuard></ProtectedRoute>} />
      <Route path="/industry/colleges" element={<ProtectedRoute role="industry"><VerificationGuard><IndustryColleges /></VerificationGuard></ProtectedRoute>} />
      <Route path="/industry/applications" element={<ProtectedRoute role="industry"><VerificationGuard><IndustryApplications /></VerificationGuard></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute role="admin"><AdminCourses /></ProtectedRoute>} />
      <Route path="/admin/certifications" element={<ProtectedRoute role="admin"><AdminCertifications /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/skills" element={<ProtectedRoute role="admin"><AdminSkills /></ProtectedRoute>} />
      <Route path="/admin/jobs" element={<ProtectedRoute role="admin"><AdminJobs /></ProtectedRoute>} />
      <Route path="/admin/colleges" element={<ProtectedRoute role="admin"><AdminColleges /></ProtectedRoute>} />
      <Route path="/admin/verifications" element={<ProtectedRoute role="admin"><AdminVerifications /></ProtectedRoute>} />

      {/* Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
