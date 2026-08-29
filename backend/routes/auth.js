const express = require('express');
const router = express.Router();
const {
  login,
  registerStudent,
  registerCollege,
  registerCompany,
  getMe,
  refreshCheck,
} = require('../controllers/authController');
const { getColleges } = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');

// Public — verify Firebase token, get user state
router.post('/login', login);

// Registration routes — require a valid Firebase token
router.post('/register/student', authenticate, registerStudent);
router.post('/register/college', authenticate, registerCollege);
router.post('/register/company', authenticate, registerCompany);

// Protected
router.get('/me', authenticate, getMe);
router.post('/refresh', authenticate, refreshCheck);
router.get('/colleges', authenticate, getColleges);

module.exports = router;
