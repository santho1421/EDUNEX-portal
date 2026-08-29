const express = require('express');
const router = express.Router();
const {
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getCollegeStudentRequests,
  approveStudent,
  getMyStatus,
} = require('../controllers/verificationController');
const { authenticate, authorize } = require('../middleware/auth');

// Any authenticated user can check their own verification status
router.get('/status', authenticate, getMyStatus);

// Admin-only routes
router.get('/pending', authenticate, authorize('admin'), getPendingRequests);
router.post('/approve/:requestId', authenticate, authorize('admin'), approveRequest);
router.post('/reject/:requestId', authenticate, authorize('admin'), rejectRequest);

// College-only: manage student verification requests
router.get('/college-students', authenticate, authorize('college'), getCollegeStudentRequests);
router.post('/approve-student/:studentId', authenticate, authorize('college'), approveStudent);

module.exports = router;
