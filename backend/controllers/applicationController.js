const { db } = require('../config/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

const ts = () => FieldValue.serverTimestamp();

// ─── POST /api/applications — student applies ─────────────────────────────────
exports.apply = async (req, res) => {
  try {
    const studentUid = req.user.uid;
    const studentDoc = await db.collection('students').doc(studentUid).get();
    if (!studentDoc.exists) return res.status(404).json({ success: false, message: 'Student not found.' });

    const { jobId, internshipId, coverLetter } = req.body;
    if (!jobId && !internshipId) {
      return res.status(400).json({ success: false, message: 'Either jobId or internshipId is required.' });
    }

    // Check duplicate application
    const dupQuery = jobId
      ? db.collection('applications').where('studentUid', '==', studentUid).where('jobId', '==', jobId)
      : db.collection('applications').where('studentUid', '==', studentUid).where('internshipId', '==', internshipId);
    const dupSnap = await dupQuery.get();
    if (!dupSnap.empty) {
      return res.status(409).json({ success: false, message: 'You have already applied for this position.' });
    }

    // Get position details (for notification and provider info)
    const collection = jobId ? 'jobs' : 'internships';
    const positionDoc = await db.collection(collection).doc(jobId || internshipId).get();
    if (!positionDoc.exists) return res.status(404).json({ success: false, message: 'Position not found.' });
    const position = positionDoc.data();

    const student = studentDoc.data();
    const resumeUrl = req.file
      ? `/uploads/resumes/${req.file.filename}`
      : student.resumeUrl || '';

    // Create application
    const appRef = await db.collection('applications').add({
      studentUid,
      studentName: student.name || '',
      studentEmail: student.email || '',
      studentCollege: student.college || '',
      studentDepartment: student.department || '',
      studentCgpa: student.cgpa || null,
      jobId: jobId || null,
      internshipId: internshipId || null,
      companyUid: position.companyUid,
      companyName: position.companyName,
      positionTitle: position.title,
      positionType: jobId ? 'job' : 'internship',
      coverLetter: coverLetter || '',
      resumeUrl,
      status: 'applied',
      notes: '',
      appliedAt: ts(),
      updatedAt: ts(),
    });

    // Increment application count on position
    await db.collection(collection).doc(jobId || internshipId).set(
      { applicationCount: FieldValue.increment(1) },
      { merge: true }
    );

    // Notify company
    await db.collection('notifications').add({
      userId: position.companyUid,
      title: 'New Application Received',
      message: `${student.name || 'A student'} has applied for "${position.title}".`,
      type: 'application',
      referenceId: appRef.id,
      referenceType: 'application',
      read: false,
      createdAt: ts(),
    });

    res.status(201).json({ success: true, message: 'Application submitted successfully.', id: appRef.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to submit application.' });
  }
};

// ─── GET /api/applications/company — company sees all applications ─────────────
exports.getCompanyApplications = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { status, jobId, internshipId } = req.query;

    let query = db.collection('applications').where('companyUid', '==', uid);
    if (status) query = query.where('status', '==', status);
    if (jobId) query = query.where('jobId', '==', jobId);
    if (internshipId) query = query.where('internshipId', '==', internshipId);

    const snap = await query.orderBy('appliedAt', 'desc').get();
    const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: apps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
};

// ─── PATCH /api/applications/:id/status — company updates status ──────────────
exports.updateStatus = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { status, notes } = req.body;
    const validStatuses = ['applied', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const appRef = db.collection('applications').doc(req.params.id);
    const appDoc = await appRef.get();
    if (!appDoc.exists || appDoc.data().companyUid !== uid) {
      return res.status(404).json({ success: false, message: 'Application not found or access denied.' });
    }

    const app = appDoc.data();
    await appRef.set({ status, notes: notes || app.notes, updatedAt: ts() }, { merge: true });

    // Notify student
    const statusMessages = {
      under_review: `Your application for "${app.positionTitle}" is now under review.`,
      shortlisted: `Great news! You've been shortlisted for "${app.positionTitle}"! 🎉`,
      interview: `You've been invited for an interview for "${app.positionTitle}". Check your email for details.`,
      selected: `Congratulations! You've been selected for "${app.positionTitle}"! 🎊`,
      rejected: `Your application for "${app.positionTitle}" was reviewed. Unfortunately, you were not selected this time.`,
    };

    const statusTitles = {
      under_review: 'Application Under Review',
      shortlisted: 'Shortlisted! 🎉',
      interview: 'Interview Scheduled',
      selected: 'Selected! Congratulations! 🎊',
      rejected: 'Application Update',
    };

    if (statusMessages[status]) {
      await db.collection('notifications').add({
        userId: app.studentUid,
        title: statusTitles[status] || 'Application Update',
        message: statusMessages[status],
        type: 'application',
        referenceId: req.params.id,
        referenceType: 'application',
        read: false,
        createdAt: ts(),
      });
    }

    res.json({ success: true, message: 'Application status updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
};
