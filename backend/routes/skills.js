const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/skillController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', ctrl.getAllSkills);
router.get('/categories', ctrl.getCategories);
router.get('/industry-demand', ctrl.getIndustryDemand);

// Admin-only: manage skills
router.post('/', authenticate, authorize('admin'), ctrl.addSkill);
router.delete('/:id', authenticate, authorize('admin'), ctrl.deleteSkill);

module.exports = router;
