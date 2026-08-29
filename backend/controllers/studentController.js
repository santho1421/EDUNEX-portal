const { db } = require('../config/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

const ts = () => FieldValue.serverTimestamp();

// ─── GET /api/students/profile ────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection('students').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

// ─── PUT /api/students/profile ────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const allowed = [
      'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender',
      'degree', 'department', 'graduationYear', 'cgpa',
      'linkedinUrl', 'githubUrl', 'portfolioUrl', 'bio',
      'isOpenToWork', 'city', 'state',
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (req.files?.resume?.[0]) updates.resumeUrl = `/uploads/resumes/${req.files.resume[0].filename}`;
    if (req.files?.profile_photo?.[0]) updates.profilePhotoUrl = `/uploads/profiles/${req.files.profile_photo[0].filename}`;
    updates.name = `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim() || undefined;
    updates.updatedAt = ts();

    await db.collection('students').doc(uid).set(updates, { merge: true });
    // Also update name in users collection
    if (updates.name) await db.collection('users').doc(uid).set({ name: updates.name }, { merge: true });

    const updated = await db.collection('students').doc(uid).get();
    res.json({ success: true, message: 'Profile updated.', data: { id: uid, ...updated.data() } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// ─── GET /api/students/skills ─────────────────────────────────────────────────
exports.getSkills = async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection('students').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: doc.data().skills || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch skills.' });
  }
};

// ─── POST /api/students/skills ────────────────────────────────────────────────
exports.addSkill = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { skillId, skillName, proficiency, yearsOfExperience, category } = req.body;
    if (!skillName) return res.status(400).json({ success: false, message: 'skillName is required.' });

    const newSkill = {
      id: skillId || skillName.toLowerCase().replace(/\s+/g, '_'),
      skillName,
      proficiency: proficiency || 'intermediate',
      yearsOfExperience: yearsOfExperience || 0,
      category: category || 'General',
      addedAt: new Date().toISOString(),
    };

    await db.collection('students').doc(uid).set(
      { skills: FieldValue.arrayUnion(newSkill), updatedAt: ts() },
      { merge: true }
    );
    res.json({ success: true, message: 'Skill added.', data: newSkill });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add skill.' });
  }
};

// ─── DELETE /api/students/skills/:skillId ─────────────────────────────────────
exports.removeSkill = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { skillId } = req.params;
    const doc = await db.collection('students').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Student not found.' });

    const skills = (doc.data().skills || []).filter(s => s.id !== skillId && s.skillName !== skillId);
    await db.collection('students').doc(uid).set({ skills, updatedAt: ts() }, { merge: true });
    res.json({ success: true, message: 'Skill removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to remove skill.' });
  }
};

// ─── GET /api/students/projects ──────────────────────────────────────────────
exports.getProjects = async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection('students').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: doc.data().projects || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
  }
};

// ─── POST /api/students/projects ─────────────────────────────────────────────
exports.addProject = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { title, description, techStack, githubUrl, liveUrl, startDate, endDate, isFeatured } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Project title is required.' });

    const project = {
      id: Date.now().toString(),
      title,
      description: description || '',
      techStack: techStack || [],
      githubUrl: githubUrl || '',
      liveUrl: liveUrl || '',
      startDate: startDate || '',
      endDate: endDate || '',
      isFeatured: isFeatured || false,
      createdAt: new Date().toISOString(),
    };

    await db.collection('students').doc(uid).set(
      { projects: FieldValue.arrayUnion(project), updatedAt: ts() },
      { merge: true }
    );
    res.status(201).json({ success: true, message: 'Project added.', data: project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add project.' });
  }
};

// ─── DELETE /api/students/projects/:id ───────────────────────────────────────
exports.deleteProject = async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection('students').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Student not found.' });
    const projects = (doc.data().projects || []).filter(p => p.id !== req.params.id);
    await db.collection('students').doc(uid).set({ projects, updatedAt: ts() }, { merge: true });
    res.json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete project.' });
  }
};

// ─── GET /api/students/certifications ────────────────────────────────────────
exports.getCertifications = async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection('students').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: doc.data().certifications || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch certifications.' });
  }
};

// ─── POST /api/students/certifications ───────────────────────────────────────
exports.addCertification = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, issuer, issueDate, expiryDate, credentialId, credentialUrl, skillIds } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Certification name is required.' });

    const cert = {
      id: Date.now().toString(),
      name,
      issuer: issuer || '',
      issueDate: issueDate || '',
      expiryDate: expiryDate || '',
      credentialId: credentialId || '',
      credentialUrl: credentialUrl || '',
      skillIds: skillIds || [],
      createdAt: new Date().toISOString(),
    };

    await db.collection('students').doc(uid).set(
      { certifications: FieldValue.arrayUnion(cert), updatedAt: ts() },
      { merge: true }
    );
    res.status(201).json({ success: true, message: 'Certification added.', data: cert });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add certification.' });
  }
};

// ─── DELETE /api/students/certifications/:id ─────────────────────────────────
exports.deleteCertification = async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection('students').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Student not found.' });
    const certs = (doc.data().certifications || []).filter(c => c.id !== req.params.id);
    await db.collection('students').doc(uid).set({ certifications: certs, updatedAt: ts() }, { merge: true });
    res.json({ success: true, message: 'Certification deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete certification.' });
  }
};

// ─── GET /api/students/applications ──────────────────────────────────────────
exports.getApplications = async (req, res) => {
  try {
    const uid = req.user.uid;
    const snap = await db.collection('applications')
      .where('studentUid', '==', uid)
      .orderBy('appliedAt', 'desc')
      .get();
    const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: apps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
};

// ─── GET /api/students/dashboard-stats ───────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection('students').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Student not found.' });
    const data = doc.data();

    const appsSnap = await db.collection('applications').where('studentUid', '==', uid).get();

    res.json({
      success: true,
      data: {
        skill_count: (data.skills || []).length,
        application_count: appsSnap.size,
        certification_count: (data.certifications || []).length,
        project_count: (data.projects || []).length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};

// ─── GET /api/students/skill-gap ─────────────────────────────────────────────
exports.getSkillGap = async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection('students').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Student not found.' });

    const { calculateStudentSkillGap } = require('../services/skillGapEngine');
    const result = await calculateStudentSkillGap(uid, doc.data());
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to calculate skill gap.' });
  }
};

// ─── GET /api/student/colleges ──────────────────────────────────────────────────
// Fetch all registered colleges so students can select them during onboarding
exports.getColleges = async (req, res) => {
  try {
    const snap = await db.collection('colleges').limit(500).get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch colleges.' });
  }
};
