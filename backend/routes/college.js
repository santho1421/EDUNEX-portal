const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/collegeController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate, authorize('college'));

router.get('/profile', ctrl.getProfile);
router.put('/profile', upload.single('logo'), ctrl.updateProfile);
router.get('/departments', ctrl.getDepartments);
router.post('/departments', ctrl.addDepartment);
router.delete('/departments/:id', ctrl.deleteDepartment);
router.get('/curriculum', ctrl.getCurriculum);
router.post('/curriculum', ctrl.addCurriculum);
router.get('/skill-gap', ctrl.getSkillGap);
router.get('/students', ctrl.getStudents);
router.post('/approve-student/:studentId', ctrl.approveStudent);
router.get('/dashboard-stats', ctrl.getDashboardStats);

module.exports = router;
