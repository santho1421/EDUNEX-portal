const { db } = require('../config/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

const ts = () => FieldValue.serverTimestamp();

// ─── GET /api/colleges/profile ────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await db.collection('colleges').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'College profile not found.' });
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

// ─── PUT /api/colleges/profile ────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const allowed = ['name', 'shortName', 'type', 'affiliation', 'city', 'state', 'country', 'website', 'phone', 'establishedYear', 'about', 'linkedinUrl'];
    const updates = { updatedAt: ts() };
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (req.file) updates.logoUrl = `/uploads/profiles/${req.file.filename}`;

    await db.collection('colleges').doc(uid).set(updates, { merge: true });
    if (updates.name) await db.collection('users').doc(uid).set({ name: updates.name }, { merge: true });

    const updated = await db.collection('colleges').doc(uid).get();
    res.json({ success: true, message: 'Profile updated.', data: { id: uid, ...updated.data() } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// ─── GET /api/colleges/departments ───────────────────────────────────────────
exports.getDepartments = async (req, res) => {
  try {
    const uid = req.user.uid;
    const snap = await db.collection('departments').where('collegeUid', '==', uid).orderBy('name').get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
  }
};

// ─── POST /api/colleges/departments ──────────────────────────────────────────
exports.addDepartment = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, code, degree, totalStudents } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Department name is required.' });
    const ref = await db.collection('departments').add({
      collegeUid: uid,
      name,
      code: code || '',
      degree: degree || 'B.Tech',
      totalStudents: Number(totalStudents) || 0,
      createdAt: ts(),
    });
    res.status(201).json({ success: true, message: 'Department added.', id: ref.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add department.' });
  }
};

// ─── DELETE /api/colleges/departments/:id ────────────────────────────────────
exports.deleteDepartment = async (req, res) => {
  try {
    await db.collection('departments').doc(req.params.id).delete();
    res.json({ success: true, message: 'Department deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete department.' });
  }
};

// ─── GET /api/colleges/curriculum ────────────────────────────────────────────
exports.getCurriculum = async (req, res) => {
  try {
    const uid = req.user.uid;
    const snap = await db.collection('curriculum').where('collegeUid', '==', uid).get();
    res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch curriculum.' });
  }
};

// ─── POST /api/colleges/curriculum ───────────────────────────────────────────
exports.addCurriculum = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { departmentId, name, semester, academicYear, subjects } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Curriculum name is required.' });
    const ref = await db.collection('curriculum').add({
      collegeUid: uid,
      departmentId: departmentId || '',
      name,
      semester: Number(semester) || 1,
      academicYear: academicYear || '',
      subjects: subjects || [],
      createdAt: ts(),
    });
    res.status(201).json({ success: true, message: 'Curriculum added.', id: ref.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add curriculum.' });
  }
};

// ─── GET /api/colleges/students (pending + approved) ─────────────────────────
exports.getStudents = async (req, res) => {
  try {
    const uid = req.user.uid;
    const collegeDoc = await db.collection('colleges').doc(uid).get();
    if (!collegeDoc.exists) return res.status(404).json({ success: false, message: 'College not found.' });
    const collegeName = collegeDoc.data().name;

    const { status, search } = req.query;
    let query = db.collection('students').where('college', '==', collegeName);
    if (status) query = query.where('verificationStatus', '==', status);

    const snap = await query.get();
    let students = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (search) {
      const s = search.toLowerCase();
      students = students.filter(st =>
        (st.name || '').toLowerCase().includes(s) ||
        (st.department || '').toLowerCase().includes(s)
      );
    }

    res.json({ success: true, data: students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch students.' });
  }
};

// ─── POST /api/colleges/approve-student/:studentId ────────────────────────────
exports.approveStudent = async (req, res) => {
  try {
    const collegeUid = req.user.uid;
    const { studentId } = req.params;
    const { action, reason } = req.body; // action: 'approve' | 'reject'

    const studentRef = db.collection('students').doc(studentId);
    const studentDoc = await studentRef.get();
    if (!studentDoc.exists) return res.status(404).json({ success: false, message: 'Student not found.' });

    const collegeDoc = await db.collection('colleges').doc(collegeUid).get();
    const collegeName = collegeDoc.data()?.name || '';

    // Make sure the student belongs to this college
    if (studentDoc.data().college !== collegeName) {
      return res.status(403).json({ success: false, message: 'This student does not belong to your college.' });
    }

    const isApproved = action === 'approve';
    const newStatus = isApproved ? 'approved' : 'rejected';

    const batch = db.batch();
    batch.set(studentRef, { verified: isApproved, verificationStatus: newStatus, updatedAt: ts() }, { merge: true });
    batch.set(db.collection('users').doc(studentId), { verified: isApproved, verificationStatus: newStatus }, { merge: true });

    // Update verification request
    const reqSnap = await db.collection('verificationRequests')
      .where('studentUid', '==', studentId).where('status', '==', 'pending').get();
    reqSnap.forEach(d => batch.update(d.ref, { status: newStatus, reviewedAt: ts(), reviewedBy: collegeUid }));

    await batch.commit();

    // Notify student
    await db.collection('notifications').add({
      userId: studentId,
      title: isApproved ? '✅ Account Verified!' : '❌ Verification Rejected',
      message: isApproved
        ? `Your account has been verified by ${collegeName}. You now have full access to EduNex.`
        : `Your verification request was rejected by ${collegeName}. ${reason ? 'Reason: ' + reason : ''}`,
      type: 'verification',
      read: false,
      createdAt: ts(),
    });

    res.json({ success: true, message: `Student ${newStatus} successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update student verification.' });
  }
};

// ─── GET /api/colleges/skill-gap ─────────────────────────────────────────────
exports.getSkillGap = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { calculateCollegeSkillGap } = require('../services/skillGapEngine');
    const result = await calculateCollegeSkillGap(uid);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to calculate skill gap.' });
  }
};

// ─── GET /api/colleges/dashboard-stats ───────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const uid = req.user.uid;
    const collegeDoc = await db.collection('colleges').doc(uid).get();
    if (!collegeDoc.exists) return res.status(404).json({ success: false, message: 'College not found.' });
    const collegeName = collegeDoc.data().name;

    const [studentsSnap, deptsSnap, pendingSnap] = await Promise.all([
      db.collection('students').where('college', '==', collegeName).where('verificationStatus', '==', 'approved').get(),
      db.collection('departments').where('collegeUid', '==', uid).get(),
      db.collection('students').where('college', '==', collegeName).where('verificationStatus', '==', 'pending').get(),
    ]);

    res.json({
      success: true,
      data: {
        student_count: studentsSnap.size,
        dept_count: deptsSnap.size,
        pending_verifications: pendingSnap.size,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};
