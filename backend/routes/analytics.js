const express = require('express');
const router = express.Router();
const db = require('../config/firebaseAdmin');
const { authenticate } = require('../middleware/auth');

// GET /api/analytics/platform-stats — public
router.get('/platform-stats', async (req, res) => {
  try {
    const [[stuCount]] = await db.execute('SELECT COUNT(*) as count FROM students');
    const [[colCount]] = await db.execute('SELECT COUNT(*) as count FROM colleges');
    const [[compCount]] = await db.execute('SELECT COUNT(*) as count FROM companies');
    const [[jobCount]] = await db.execute('SELECT COUNT(*) as count FROM jobs WHERE is_active=1');
    const [[courseCount]] = await db.execute('SELECT COUNT(*) as count FROM courses WHERE is_active=1');
    const [[skillCount]] = await db.execute('SELECT COUNT(*) as count FROM skills');
    res.json({ success: true, data: {
      students: stuCount.count, colleges: colCount.count, companies: compCount.count,
      active_jobs: jobCount.count, courses: courseCount.count, skills: skillCount.count
    }});
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// GET /api/analytics/top-skills
router.get('/top-skills', async (req, res) => {
  try {
    const [skills] = await db.execute(`
      SELECT s.name, s.category, COUNT(ss.student_id) as student_count
      FROM skills s LEFT JOIN student_skills ss ON ss.skill_id=s.id
      GROUP BY s.id ORDER BY student_count DESC LIMIT 15
    `);
    res.json({ success: true, data: skills });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch skill trends.' });
  }
});

module.exports = router;
