const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', authenticate, authorize('student'), upload.single('resume'), ctrl.apply);
router.get('/company', authenticate, authorize('industry'), ctrl.getCompanyApplications);
router.patch('/:id/status', authenticate, authorize('industry'), ctrl.updateStatus);

module.exports = router;
