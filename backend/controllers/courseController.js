const { db } = require('../config/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

const ts = () => FieldValue.serverTimestamp();

// ─── GET /api/courses — public ────────────────────────────────────────────────
exports.getCourses = async (req, res) => {
  try {
    const { search, difficulty, page = 1, limit = 20 } = req.query;
    let query = db.collection('courses').where('isActive', '==', true);
    if (difficulty) query = query.where('difficulty', '==', difficulty);
    const snap = await query.orderBy('createdAt', 'desc').limit(Number(limit)).get();

    let courses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (search) {
      const s = search.toLowerCase();
      courses = courses.filter(c =>
        (c.title || '').toLowerCase().includes(s) ||
        (c.providerName || '').toLowerCase().includes(s)
      );
    }

    res.json({ success: true, data: courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch courses.' });
  }
};

// ─── GET /api/courses/:id ─────────────────────────────────────────────────────
exports.getCourse = async (req, res) => {
  try {
    const doc = await db.collection('courses').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Course not found.' });
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch course.' });
  }
};

// ─── POST /api/courses — industry only ───────────────────────────────────────
exports.createCourse = async (req, res) => {
  try {
    const uid = req.user.uid;
    const companyDoc = await db.collection('industries').doc(uid).get();
    if (!companyDoc.exists) return res.status(404).json({ success: false, message: 'Company not found.' });
    const company = companyDoc.data();

    const {
      title, description, difficulty, durationHours, durationWeeks,
      eligibility, certificationProvided, certificationName,
      courseUrl, isFree, price, skillsCovered,
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Course title is required.' });
    if (!courseUrl) return res.status(400).json({ success: false, message: 'Course URL is required.' });

    const ref = await db.collection('courses').add({
      companyUid: uid,
      companyName: company.name,
      companyLogoUrl: company.logoUrl || '',
      companyWebsite: company.website || '',
      // ── Provider info (who is offering this course) ──
      providerName: company.name,
      providerType: 'company',
      // ── Course fields ─────────────────────────────────
      title,
      description: description || '',
      difficulty: difficulty || 'intermediate',
      durationHours: Number(durationHours) || 0,
      durationWeeks: Number(durationWeeks) || 0,
      eligibility: eligibility || '',
      certificationProvided: certificationProvided !== false,
      certificationName: certificationName || '',
      courseUrl,                     // The link to access / enroll in the course
      isFree: isFree || false,
      price: Number(price) || 0,
      skillsCovered: skillsCovered || [],  // [{ skillName, proficiencyCovered }]
      isActive: true,
      createdAt: ts(),
      updatedAt: ts(),
    });

    res.status(201).json({ success: true, message: 'Course created.', id: ref.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create course.' });
  }
};

// ─── DELETE /api/courses/:id — soft delete ────────────────────────────────────
exports.deleteCourse = async (req, res) => {
  try {
    const uid = req.user.uid;
    const ref = db.collection('courses').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().companyUid !== uid) {
      return res.status(404).json({ success: false, message: 'Course not found or access denied.' });
    }
    await ref.set({ isActive: false, updatedAt: ts() }, { merge: true });
    res.json({ success: true, message: 'Course removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to remove course.' });
  }
};

// ─── GET /api/courses/company/mine ────────────────────────────────────────────
exports.getMyCourses = async (req, res) => {
  try {
    const uid = req.user.uid;
    const snap = await db.collection('courses').where('companyUid', '==', uid).orderBy('createdAt', 'desc').get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch courses.' });
  }
};
