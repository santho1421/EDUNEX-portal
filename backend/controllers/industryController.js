const { db } = require('../config/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

const ts = () => FieldValue.serverTimestamp();

// ─── GET /api/industry/profile ────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection('industries').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Company profile not found.' });
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

// ─── PUT /api/industry/profile ────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const allowed = ['name', 'industrySector', 'companySize', 'foundedYear', 'website', 'phone', 'city', 'state', 'country', 'about', 'linkedinUrl'];
    const updates = { updatedAt: ts() };
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (req.file) updates.logoUrl = `/uploads/profiles/${req.file.filename}`;

    await db.collection('industries').doc(uid).set(updates, { merge: true });
    if (updates.name) await db.collection('users').doc(uid).set({ name: updates.name }, { merge: true });

    const updated = await db.collection('industries').doc(uid).get();
    res.json({ success: true, message: 'Profile updated.', data: { id: uid, ...updated.data() } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// ─── GET /api/industry/required-skills ───────────────────────────────────────
exports.getRequiredSkills = async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection('industries').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Company not found.' });
    res.json({ success: true, data: doc.data().requiredSkills || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch required skills.' });
  }
};

// ─── POST /api/industry/required-skills ──────────────────────────────────────
exports.addRequiredSkill = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { skillId, skillName, requiredProficiency, isMandatory, demandLevel } = req.body;
    if (!skillName) return res.status(400).json({ success: false, message: 'skillName is required.' });

    const skill = {
      id: skillId || skillName.toLowerCase().replace(/\s+/g, '_'),
      skillName,
      requiredProficiency: requiredProficiency || 'intermediate',
      isMandatory: isMandatory !== false,
      demandLevel: demandLevel || 'high',
    };

    const doc = await db.collection('industries').doc(uid).get();
    const existing = (doc.data()?.requiredSkills || []).filter(s => s.id !== skill.id);
    await db.collection('industries').doc(uid).set({ requiredSkills: [...existing, skill], updatedAt: ts() }, { merge: true });
    res.json({ success: true, message: 'Skill requirement added.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add skill requirement.' });
  }
};

// ─── DELETE /api/industry/required-skills/:skillId ───────────────────────────
exports.removeRequiredSkill = async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection('industries').doc(uid).get();
    const skills = (doc.data()?.requiredSkills || []).filter(s => s.id !== req.params.skillId);
    await db.collection('industries').doc(uid).set({ requiredSkills: skills, updatedAt: ts() }, { merge: true });
    res.json({ success: true, message: 'Skill requirement removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to remove skill.' });
  }
};

// ─── GET /api/industry/talent-search ─────────────────────────────────────────
exports.talentSearch = async (req, res) => {
  try {
    const { department, minCgpa, graduationYear, search } = req.query;
    let query = db.collection('students').where('isOpenToWork', '==', true).where('verificationStatus', '==', 'approved');
    if (graduationYear) query = query.where('graduationYear', '==', Number(graduationYear));

    const snap = await query.limit(50).get();
    let students = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (department) students = students.filter(s => (s.department || '').toLowerCase().includes(department.toLowerCase()));
    if (minCgpa) students = students.filter(s => Number(s.cgpa) >= Number(minCgpa));
    if (search) {
      const s = search.toLowerCase();
      students = students.filter(st =>
        (st.name || '').toLowerCase().includes(s) ||
        (st.college || '').toLowerCase().includes(s)
      );
    }

    res.json({ success: true, data: students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Talent search failed.' });
  }
};

// ─── GET /api/industry/colleges ──────────────────────────────────────────────
exports.getColleges = async (req, res) => {
  try {
    const snap = await db.collection('colleges').where('verified', '==', true).limit(50).get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch colleges.' });
  }
};

// ─── GET /api/industry/dashboard-stats ───────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const uid = req.user.uid;
    const [jobsSnap, internsSnap, appsSnap, coursesSnap] = await Promise.all([
      db.collection('jobs').where('companyUid', '==', uid).where('isActive', '==', true).get(),
      db.collection('internships').where('companyUid', '==', uid).where('isActive', '==', true).get(),
      db.collection('applications').where('companyUid', '==', uid).get(),
      db.collection('courses').where('companyUid', '==', uid).where('isActive', '==', true).get(),
    ]);

    res.json({
      success: true,
      data: {
        active_jobs: jobsSnap.size,
        active_internships: internsSnap.size,
        total_applications: appsSnap.size,
        active_courses: coursesSnap.size,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};
