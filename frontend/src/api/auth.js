import api from './axios';

// Auth with backend
export const login = () => api.post('/auth/login');
export const getMe = () => api.get('/auth/me');
export const refreshCheck = () => api.post('/auth/refresh');

// New role-specific registration endpoints
export const registerStudent = (data) => api.post('/auth/register/student', data);
export const registerCollege = (data) => api.post('/auth/register/college', data);
export const registerCompany = (data) => api.post('/auth/register/company', data);

// Verification
export const getVerificationStatus = () => api.get('/verification/status');
export const getPendingVerifications = () => api.get('/verification/pending');
export const approveVerification = (requestId, notes) => api.post(`/verification/approve/${requestId}`, { notes });
export const rejectVerification = (requestId, reason) => api.post(`/verification/reject/${requestId}`, { reason });
export const getCollegeStudentRequests = () => api.get('/verification/college-students');
export const approveStudent = (studentId, action, reason) =>
  api.post(`/verification/approve-student/${studentId}`, { action, reason });
