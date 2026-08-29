const { db } = require('../config/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

const ts = () => FieldValue.serverTimestamp();

// ─── GET /api/jobs — public listing ──────────────────────────────────────────
exports.getJobs = async (req, res) => {
  try {
    const { search, location, page = 1, limit = 20 } = req.query;
    let query = db.collection('jobs').where('isActive', '==', true);
    const snap = await query.orderBy('createdAt', 'desc').limit(Number(limit)).get();

    let jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Client-side filters (Firestore free tier has limited compound query support)
    if (search) {
      const s = search.toLowerCase();
      jobs = jobs.filter(j =>
        (j.title || '').toLowerCase().includes(s) ||
        (j.companyName || '').toLowerCase().includes(s)
      );
    }
    if (location) {
      jobs = jobs.filter(j => (j.location || '').toLowerCase().includes(location.toLowerCase()));
    }

    res.json({ success: true, data: jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs.' });
  }
};

// ─── GET /api/jobs/:id ────────────────────────────────────────────────────────
exports.getJob = async (req, res) => {
  try {
    const doc = await db.collection('jobs').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Job not found.' });
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch job.' });
  }
};

// ─── POST /api/jobs — industry only ──────────────────────────────────────────
exports.createJob = async (req, res) => {
  try {
    const uid = req.user.uid;
    const companyDoc = await db.collection('industries').doc(uid).get();
    if (!companyDoc.exists) return res.status(404).json({ success: false, message: 'Company not found.' });
    const company = companyDoc.data();

    const {
      title, description, jobType, location, isRemote,
      salaryMin, salaryMax, experienceMin, experienceMax,
      department, eligibility, deadline, requiredSkills, applyUrl,
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Job title is required.' });

    const ref = await db.collection('jobs').add({
      companyUid: uid,
      companyName: company.name,
      companyLogoUrl: company.logoUrl || '',
      companyWebsite: company.website || '',
      companyCity: company.city || '',
      // ── Provider info (who is offering this job) ──
      providerName: company.name,
      providerType: 'company',
      // ── Job fields ────────────────────────────────
      title,
      description: description || '',
      jobType: jobType || 'full_time',
      location: location || '',
      isRemote: isRemote || false,
      salaryMin: Number(salaryMin) || 0,
      salaryMax: Number(salaryMax) || 0,
      experienceMin: Number(experienceMin) || 0,
      experienceMax: Number(experienceMax) || null,
      department: department || '',
      eligibility: eligibility || '',
      deadline: deadline || null,
      requiredSkills: requiredSkills || [], // [{ skillName, proficiency, isMandatory }]
      applyUrl: applyUrl || '',            // External apply link (e.g., company careers page)
      isActive: true,
      applicationCount: 0,
      createdAt: ts(),
      updatedAt: ts(),
    });

    res.status(201).json({ success: true, message: 'Job posted successfully.', id: ref.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create job.' });
  }
};

// ─── PUT /api/jobs/:id ────────────────────────────────────────────────────────
exports.updateJob = async (req, res) => {
  try {
    const uid = req.user.uid;
    const allowed = ['title', 'description', 'location', 'salaryMin', 'salaryMax', 'deadline', 'isActive', 'applyUrl', 'requiredSkills'];
    const updates = { updatedAt: ts() };
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const jobRef = db.collection('jobs').doc(req.params.id);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists || jobDoc.data().companyUid !== uid) {
      return res.status(404).json({ success: false, message: 'Job not found or access denied.' });
    }
    await jobRef.set(updates, { merge: true });
    res.json({ success: true, message: 'Job updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update job.' });
  }
};

// ─── DELETE /api/jobs/:id (soft delete) ──────────────────────────────────────
exports.deleteJob = async (req, res) => {
  try {
    const uid = req.user.uid;
    const jobRef = db.collection('jobs').doc(req.params.id);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists || jobDoc.data().companyUid !== uid) {
      return res.status(404).json({ success: false, message: 'Job not found or access denied.' });
    }
    await jobRef.set({ isActive: false, updatedAt: ts() }, { merge: true });
    res.json({ success: true, message: 'Job closed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to close job.' });
  }
};

// ─── GET /api/jobs/company/mine ───────────────────────────────────────────────
exports.getMyJobs = async (req, res) => {
  try {
    const uid = req.user.uid;
    const snap = await db.collection('jobs').where('companyUid', '==', uid).orderBy('createdAt', 'desc').get();
    const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs.' });
  }
};
