const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/industryController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate, authorize('industry'));

router.get('/profile', ctrl.getProfile);
router.put('/profile', upload.single('logo'), ctrl.updateProfile);
router.get('/required-skills', ctrl.getRequiredSkills);
router.post('/required-skills', ctrl.addRequiredSkill);
router.delete('/required-skills/:skillId', ctrl.removeRequiredSkill);
router.get('/talent-search', ctrl.talentSearch);
router.get('/colleges', ctrl.getColleges);
router.get('/dashboard-stats', ctrl.getDashboardStats);

module.exports = router;
