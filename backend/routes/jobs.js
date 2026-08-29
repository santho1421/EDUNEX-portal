const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', ctrl.getJobs);
router.get('/:id', ctrl.getJob);

// Industry routes
router.post('/', authenticate, authorize('industry'), ctrl.createJob);
router.put('/:id', authenticate, authorize('industry'), ctrl.updateJob);
router.delete('/:id', authenticate, authorize('industry'), ctrl.deleteJob);
router.get('/company/mine', authenticate, authorize('industry'), ctrl.getMyJobs);

module.exports = router;
