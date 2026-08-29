const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/internshipController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', ctrl.getInternships);
router.get('/:id', ctrl.getInternship);
router.post('/', authenticate, authorize('industry'), ctrl.createInternship);
router.put('/:id', authenticate, authorize('industry'), ctrl.updateInternship);
router.get('/company/mine', authenticate, authorize('industry'), ctrl.getMyInternships);

module.exports = router;
