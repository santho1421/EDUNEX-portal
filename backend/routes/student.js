const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate, authorize('student'));

router.get('/profile', ctrl.getProfile);
router.put('/profile', upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'profile_photo', maxCount: 1 }]), ctrl.updateProfile);

router.get('/skills', ctrl.getSkills);
router.post('/skills', ctrl.addSkill);
router.delete('/skills/:skillId', ctrl.removeSkill);

router.get('/skill-gap', ctrl.getSkillGap);

router.get('/projects', ctrl.getProjects);
router.post('/projects', ctrl.addProject);
router.delete('/projects/:id', ctrl.deleteProject);

router.get('/certifications', ctrl.getCertifications);
router.post('/certifications', ctrl.addCertification);
router.delete('/certifications/:id', ctrl.deleteCertification);



router.get('/applications', ctrl.getApplications);
router.get('/dashboard-stats', ctrl.getDashboardStats);

module.exports = router;
