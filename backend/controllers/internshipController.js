const { db } = require('../config/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

const ts = () => FieldValue.serverTimestamp();

// ─── GET /api/internships ─────────────────────────────────────────────────────
exports.getInternships = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const snap = await db.collection('internships').where('isActive', '==', true)
      .orderBy('createdAt', 'desc').limit(Number(limit)).get();

    let internships = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (search) {
      const s = search.toLowerCase();
      internships = internships.filter(i =>
        (i.title || '').toLowerCase().includes(s) ||
        (i.companyName || '').toLowerCase().includes(s)
      );
    }

    res.json({ success: true, data: internships });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch internships.' });
  }
};

// ─── GET /api/internships/:id ─────────────────────────────────────────────────
exports.getInternship = async (req, res) => {
  try {
    const doc = await db.collection('internships').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Internship not found.' });
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch internship.' });
  }
};

// ─── POST /api/internships — industry only ────────────────────────────────────
exports.createInternship = async (req, res) => {
  try {
    const uid = req.user.uid;
    const companyDoc = await db.collection('industries').doc(uid).get();
    if (!companyDoc.exists) return res.status(404).json({ success: false, message: 'Company not found.' });
    const company = companyDoc.data();

    const {
      title, description, durationMonths, location, isRemote,
      stipendMin, stipendMax, department, eligibility,
      startDate, deadline, requiredSkills, applyUrl,
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });

    const ref = await db.collection('internships').add({
      companyUid: uid,
      companyName: company.name,
      companyLogoUrl: company.logoUrl || '',
      companyWebsite: company.website || '',
      // ── Provider info ─────────────────────────────
      providerName: company.name,
      providerType: 'company',
      // ── Internship fields ─────────────────────────
      title,
      description: description || '',
      durationMonths: Number(durationMonths) || 1,
      location: location || '',
      isRemote: isRemote || false,
      stipendMin: Number(stipendMin) || 0,
      stipendMax: Number(stipendMax) || 0,
      department: department || '',
      eligibility: eligibility || '',
      startDate: startDate || null,
      deadline: deadline || null,
      requiredSkills: requiredSkills || [],
      applyUrl: applyUrl || '',           // External apply link
      isActive: true,
      applicationCount: 0,
      createdAt: ts(),
      updatedAt: ts(),
    });

    res.status(201).json({ success: true, message: 'Internship posted.', id: ref.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create internship.' });
  }
};

// ─── GET /api/internships/company/mine ───────────────────────────────────────
exports.getMyInternships = async (req, res) => {
  try {
    const uid = req.user.uid;
    const snap = await db.collection('internships').where('companyUid', '==', uid)
      .orderBy('createdAt', 'desc').get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch internships.' });
  }
};

// ─── PATCH /api/internships/:id ───────────────────────────────────────────────
exports.updateInternship = async (req, res) => {
  try {
    const uid = req.user.uid;
    const ref = db.collection('internships').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().companyUid !== uid) {
      return res.status(404).json({ success: false, message: 'Internship not found or access denied.' });
    }
    const allowed = ['title', 'description', 'isActive', 'deadline', 'applyUrl', 'stipendMin', 'stipendMax'];
    const updates = { updatedAt: ts() };
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    await ref.set(updates, { merge: true });
    res.json({ success: true, message: 'Internship updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update internship.' });
  }
};
