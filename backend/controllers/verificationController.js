const { db } = require('../config/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

const ts = () => FieldValue.serverTimestamp();

// ─── GET /api/verification/pending — Admin: all pending requests ──────────────
exports.getPendingRequests = async (req, res) => {
  try {
    const snap = await db.collection('verificationRequests')
      .where('status', '==', 'pending')
      .get();
      
    let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Sort in memory by createdAt descending to avoid Firestore composite index requirement
    results.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });

    res.json({ success: true, data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch pending requests.' });
  }
};

// ─── POST /api/verification/approve/:requestId — Admin approves college/company ─
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    const reqRef = db.collection('verificationRequests').doc(requestId);
    const reqDoc = await reqRef.get();
    if (!reqDoc.exists) return res.status(404).json({ success: false, message: 'Request not found.' });

    const reqData = reqDoc.data();
    const uid = reqData.applicantUid;
    const type = reqData.type; // 'college_to_admin' | 'company_to_admin'

    const batch = db.batch();

    // Mark request as approved
    batch.update(reqRef, { status: 'approved', reviewedAt: ts(), reviewedBy: req.user.uid, notes: notes || '' });

    // Update user doc
    batch.set(db.collection('users').doc(uid), { verified: true, verificationStatus: 'approved' }, { merge: true });

    // Update profile doc
    const profileCollection = type === 'college_to_admin' ? 'colleges' : 'industries';
    batch.set(db.collection(profileCollection).doc(uid), { verified: true, verificationStatus: 'approved', updatedAt: ts() }, { merge: true });

    await batch.commit();

    // Notify the applicant
    const entityName = reqData.institutionName || reqData.companyName || 'Your organization';
    await db.collection('notifications').add({
      userId: uid,
      title: '✅ Registration Approved!',
      message: `${entityName} has been approved by the EduNex admin. You now have full access to the platform.`,
      type: 'verification',
      referenceId: requestId,
      referenceType: 'admin_approval',
      read: false,
      createdAt: ts(),
    });

    res.json({ success: true, message: 'Request approved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to approve request.' });
  }
};

// ─── POST /api/verification/reject/:requestId — Admin rejects ────────────────
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const reqRef = db.collection('verificationRequests').doc(requestId);
    const reqDoc = await reqRef.get();
    if (!reqDoc.exists) return res.status(404).json({ success: false, message: 'Request not found.' });

    const reqData = reqDoc.data();
    const uid = reqData.applicantUid || reqData.studentUid;

    await reqRef.set({ status: 'rejected', reviewedAt: ts(), reviewedBy: req.user.uid, reason: reason || '' }, { merge: true });

    // Update user doc
    await db.collection('users').doc(uid).set({ verificationStatus: 'rejected' }, { merge: true });

    // Notify
    const entityName = reqData.institutionName || reqData.companyName || reqData.studentName || 'Your account';
    await db.collection('notifications').add({
      userId: uid,
      title: '❌ Registration Rejected',
      message: `${entityName} registration was rejected by EduNex admin. ${reason ? 'Reason: ' + reason : 'Please contact support for more details.'}`,
      type: 'verification',
      read: false,
      createdAt: ts(),
    });

    res.json({ success: true, message: 'Request rejected.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to reject request.' });
  }
};

// ─── GET /api/verification/college-students — College: pending student requests ─
exports.getCollegeStudentRequests = async (req, res) => {
  try {
    const collegeUid = req.user.uid;
    const collegeDoc = await db.collection('colleges').doc(collegeUid).get();
    if (!collegeDoc.exists) return res.status(404).json({ success: false, message: 'College not found.' });
    const collegeName = collegeDoc.data().name;

    const snap = await db.collection('verificationRequests')
      .where('type', '==', 'student_to_college')
      .where('college', '==', collegeName)
      .where('status', '==', 'pending')
      .get();

    let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Sort in memory by createdAt descending to avoid Firestore composite index requirement
    results.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });

    res.json({ success: true, data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch student requests.' });
  }
};

// ─── POST /api/verification/approve-student/:studentId — College approves student ─
exports.approveStudent = async (req, res) => {
  try {
    const collegeUid = req.user.uid;
    const { studentId } = req.params;
    const { action, reason } = req.body;

    const collegeDoc = await db.collection('colleges').doc(collegeUid).get();
    if (!collegeDoc.exists) return res.status(404).json({ success: false, message: 'College not found.' });

    const studentDoc = await db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) return res.status(404).json({ success: false, message: 'Student not found.' });

    const isApproved = action === 'approve';
    const newStatus = isApproved ? 'approved' : 'rejected';
    const collegeName = collegeDoc.data().name;

    if (studentDoc.data().college !== collegeName) {
      return res.status(403).json({ success: false, message: 'This student does not belong to your college.' });
    }

    const batch = db.batch();
    batch.set(db.collection('students').doc(studentId), { verified: isApproved, verificationStatus: newStatus, updatedAt: ts() }, { merge: true });
    batch.set(db.collection('users').doc(studentId), { verified: isApproved, verificationStatus: newStatus }, { merge: true });

    // Update verification request
    const reqSnap = await db.collection('verificationRequests')
      .where('studentUid', '==', studentId).where('status', '==', 'pending').limit(1).get();
    reqSnap.forEach(d => batch.update(d.ref, { status: newStatus, reviewedAt: ts(), reviewedBy: collegeUid }));

    await batch.commit();

    // Notify student
    await db.collection('notifications').add({
      userId: studentId,
      title: isApproved ? '✅ Account Verified!' : '❌ Verification Rejected',
      message: isApproved
        ? `Your account has been verified by ${collegeName}. You now have full access to EduNex!`
        : `Your verification was rejected by ${collegeName}. ${reason ? 'Reason: ' + reason : ''}`,
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

// ─── GET /api/verification/status — any user checks their own status ──────────
exports.getMyStatus = async (req, res) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found.' });
    const data = userDoc.data();
    res.json({
      success: true,
      data: {
        verified: data.verified || false,
        verificationStatus: data.verificationStatus || 'pending',
        role: data.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch status.' });
  }
};
