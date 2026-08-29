const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/courseController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', ctrl.getCourses);
router.get('/:id', ctrl.getCourse);
router.post('/', authenticate, authorize('industry'), ctrl.createCourse);
router.delete('/:id', authenticate, authorize('industry'), ctrl.deleteCourse);
router.get('/company/mine', authenticate, authorize('industry'), ctrl.getMyCourses);

module.exports = router;
