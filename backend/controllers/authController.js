const { db, auth } = require('../config/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

// ─── Helper ──────────────────────────────────────────────────────────────────
const serverTimestamp = () => FieldValue.serverTimestamp();

// POST /api/auth/login
// Frontend sends Firebase ID token → backend verifies → returns user state
exports.login = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }
    const token = authHeader.split(' ')[1];

    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      let userData = userDoc.data();

      // Ensure the hardcoded admin is always fully verified and onboarded
      if (email === 'admin@skillbridge.com') {
        userData = {
          ...userData,
          role: 'admin',
          onboardingCompleted: true,
          verified: true
        };
        // Fix the database record in the background
        userRef.set(userData, { merge: true }).catch(console.error);
        auth.setCustomUserClaims(uid, { role: 'admin' }).catch(console.error);
      }

      if (!userData.role || !userData.onboardingCompleted) {
        return res.status(200).json({
          success: true,
          action: 'ONBOARDING_REQUIRED',
          user: { uid, email },
        });
      }

      return res.status(200).json({
        success: true,
        action: 'LOGIN_SUCCESS',
        user: {
          id: uid,
          uid,
          email,
          role: userData.role,
          name: userData.name,
          verified: userData.verified,
          verificationStatus: userData.verificationStatus,
          college: userData.college,
          collegeId: userData.collegeId,
          profileId: uid,
        },
      });
    } else {
      // Check if this is the hardcoded system admin
      const isAdmin = email === 'admin@skillbridge.com';

      const newUserDoc = {
        email,
        createdAt: serverTimestamp(),
        onboardingCompleted: isAdmin,
        role: isAdmin ? 'admin' : null,
        verified: isAdmin,
        name: isAdmin ? 'System Admin' : '',
      };

      await userRef.set(newUserDoc);

      if (isAdmin) {
        await auth.setCustomUserClaims(uid, { role: 'admin' });
        return res.status(200).json({
          success: true,
          action: 'LOGIN_SUCCESS',
          user: { id: uid, uid, email, role: 'admin', name: 'System Admin', verified: true },
        });
      }

      return res.status(200).json({
        success: true,
        action: 'ONBOARDING_REQUIRED',
        user: { id: uid, uid, email },
      });
    }
  } catch (err) {
    console.error('🔥 Login error caught in try/catch:', err.message);
    console.error(err.stack);
    res.status(401).json({ success: false, message: 'Invalid or expired token.', stack: err.stack });
  }
};

// POST /api/auth/register/student
// Student completes profile after first login — selects college, sends notification to college
exports.registerStudent = async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email;
    const { firstName, lastName, college, collegeId, degree, department, currentYear, currentSemester, graduationYear } = req.body;

    if (!firstName || !college) {
      return res.status(400).json({ success: false, message: 'First name and college are required.' });
    }

    const name = `${firstName} ${lastName || ''}`.trim();
    const batch = db.batch();

    // Update the user doc
    batch.set(db.collection('users').doc(uid), {
      role: 'student',
      name,
      email,
      onboardingCompleted: true,
      college,
      collegeId: collegeId || null,
      verified: false,
      verificationStatus: 'pending',
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Create student profile doc
    batch.set(db.collection('students').doc(uid), {
      uid,
      firstName,
      lastName: lastName || '',
      name,
      email,
      college,
      collegeId: collegeId || null,
      degree: degree || '',
      department: department || '',
      currentYear: Number(currentYear) || 1,
      currentSemester: Number(currentSemester) || 1,
      graduationYear: Number(graduationYear) || new Date().getFullYear() + 3,
      skills: [],
      projects: [],
      certifications: [],
      isOpenToWork: false,
      verificationStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    // Set Firebase custom claims
    await auth.setCustomUserClaims(uid, { role: 'student' });

    // ── Send notification to college admin ──────────────────────────────────
    // Find the college's admin user
    let collegeAdminUid = null;
    if (collegeId) {
      const collegeDoc = await db.collection('colleges').doc(collegeId).get();
      if (collegeDoc.exists) collegeAdminUid = collegeDoc.data().adminUid || null;
    }

    // Also search by college name if no ID match
    if (!collegeAdminUid) {
      const collegeSnap = await db.collection('colleges')
        .where('name', '==', college).limit(1).get();
      if (!collegeSnap.empty) {
        const cData = collegeSnap.docs[0].data();
        collegeAdminUid = cData.adminUid || null;
      }
    }

    // Create a verification request doc (college can see this)
    const verificationRef = db.collection('verificationRequests').doc();
    await verificationRef.set({
      type: 'student_to_college',
      studentUid: uid,
      studentName: name,
      studentEmail: email,
      college,
      collegeId: collegeId || null,
      degree,
      department,
      currentYear: Number(currentYear) || 1,
      graduationYear: Number(graduationYear) || null,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    // Notify the college admin (if found)
    if (collegeAdminUid) {
      await db.collection('notifications').add({
        userId: collegeAdminUid,
        title: 'New Student Verification Request',
        message: `${name} from ${college} has requested to join your institution on EduNex.`,
        type: 'verification',
        referenceId: verificationRef.id,
        referenceType: 'student_verification',
        read: false,
        createdAt: serverTimestamp(),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile saved! Awaiting college verification.',
      user: { id: uid, uid, email, role: 'student', name, college, verified: false, verificationStatus: 'pending' },
    });
  } catch (err) {
    console.error('🔥 Register student error caught:', err.message);
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Failed to complete student registration.', stack: err.stack });
  }
};

// POST /api/auth/register/college
// College submits registration → goes to platform admin for approval
exports.registerCollege = async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email;
    const {
      institutionName, managementName, contactPhone, contactEmail,
      website, city, state, type, affiliation,
    } = req.body;

    if (!institutionName || !managementName || !contactPhone) {
      return res.status(400).json({ success: false, message: 'Institution name, management name, and phone are required.' });
    }

    const batch = db.batch();

    // Update user doc — not yet approved
    batch.set(db.collection('users').doc(uid), {
      role: 'college',
      name: institutionName,
      email,
      onboardingCompleted: true,
      verified: false,
      verificationStatus: 'pending_admin',
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Create college profile (inactive until admin approves)
    batch.set(db.collection('colleges').doc(uid), {
      uid,
      adminUid: uid,
      name: institutionName,
      managementName,
      contactPhone,
      contactEmail: contactEmail || email,
      website: website || '',
      city: city || '',
      state: state || '',
      type: type || 'private',
      affiliation: affiliation || '',
      verified: false,
      verificationStatus: 'pending_admin',
      departments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    await auth.setCustomUserClaims(uid, { role: 'college' });

    // Create admin verification request
    const reqRef = db.collection('verificationRequests').doc();
    await reqRef.set({
      type: 'college_to_admin',
      applicantUid: uid,
      applicantEmail: email,
      institutionName,
      managementName,
      contactPhone,
      contactEmail: contactEmail || email,
      website: website || '',
      city: city || '',
      state: state || '',
      type: type || 'private',
      affiliation: affiliation || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    // Notify all admins
    const adminSnap = await db.collection('users').where('role', '==', 'admin').get();
    const notifBatch = db.batch();
    adminSnap.forEach(adminDoc => {
      const notifRef = db.collection('notifications').doc();
      notifBatch.set(notifRef, {
        userId: adminDoc.id,
        title: 'New College Registration Request',
        message: `${institutionName} has submitted a registration request. Contact: ${managementName} (${contactPhone}).`,
        type: 'verification',
        referenceId: reqRef.id,
        referenceType: 'college_verification',
        read: false,
        createdAt: serverTimestamp(),
      });
    });
    await notifBatch.commit();

    return res.status(200).json({
      success: true,
      message: 'Registration request submitted! Admin will review and approve your account.',
      user: { id: uid, uid, email, role: 'college', name: institutionName, verified: false, verificationStatus: 'pending_admin' },
    });
  } catch (err) {
    console.error('Register college error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit college registration.' });
  }
};

// POST /api/auth/register/company
// Company submits registration → goes to platform admin for approval
exports.registerCompany = async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email;
    const {
      companyName, industrySector, companySize, website,
      managementName, contactPhone, contactEmail, city, state,
    } = req.body;

    if (!companyName || !managementName || !contactPhone) {
      return res.status(400).json({ success: false, message: 'Company name, management name, and phone are required.' });
    }

    const batch = db.batch();

    batch.set(db.collection('users').doc(uid), {
      role: 'industry',
      name: companyName,
      email,
      onboardingCompleted: true,
      verified: false,
      verificationStatus: 'pending_admin',
      updatedAt: serverTimestamp(),
    }, { merge: true });

    batch.set(db.collection('industries').doc(uid), {
      uid,
      name: companyName,
      industrySector: industrySector || '',
      companySize: companySize || '',
      website: website || '',
      managementName,
      contactPhone,
      contactEmail: contactEmail || email,
      city: city || '',
      state: state || '',
      verified: false,
      verificationStatus: 'pending_admin',
      activeJobs: 0,
      activeInternships: 0,
      activeCourses: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    await auth.setCustomUserClaims(uid, { role: 'industry' });

    const reqRef = db.collection('verificationRequests').doc();
    await reqRef.set({
      type: 'company_to_admin',
      applicantUid: uid,
      applicantEmail: email,
      companyName,
      industrySector: industrySector || '',
      companySize: companySize || '',
      managementName,
      contactPhone,
      contactEmail: contactEmail || email,
      website: website || '',
      city: city || '',
      state: state || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    // Notify all admins
    const adminSnap = await db.collection('users').where('role', '==', 'admin').get();
    const notifBatch = db.batch();
    adminSnap.forEach(adminDoc => {
      const notifRef = db.collection('notifications').doc();
      notifBatch.set(notifRef, {
        userId: adminDoc.id,
        title: 'New Company Registration Request',
        message: `${companyName} (${industrySector || 'Industry'}) has submitted a registration request. Contact: ${managementName} (${contactPhone}).`,
        type: 'verification',
        referenceId: reqRef.id,
        referenceType: 'company_verification',
        read: false,
        createdAt: serverTimestamp(),
      });
    });
    await notifBatch.commit();

    return res.status(200).json({
      success: true,
      message: 'Registration request submitted! Admin will review and approve your account.',
      user: { id: uid, uid, email, role: 'industry', name: companyName, verified: false, verificationStatus: 'pending_admin' },
    });
  } catch (err) {
    console.error('Register company error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit company registration.' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userData = userDoc.data();
    let profileData = {};

    if (userData.role) {
      const collectionName = userData.role === 'industry' ? 'industries' : userData.role + 's';
      const profileDoc = await db.collection(collectionName).doc(uid).get();
      if (profileDoc.exists) profileData = profileDoc.data();
    }

    res.json({
      success: true,
      user: {
        uid,
        id: uid,
        email: req.user.email,
        ...userData,
        ...profileData,
      },
    });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch user data.' });
  }
};

// POST /api/auth/refresh — force token refresh check (for client-side use)
exports.refreshCheck = async (req, res) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found.' });
    const userData = userDoc.data();
    res.json({
      success: true,
      user: {
        uid, id: uid, email: req.user.email, ...userData,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Refresh check failed.' });
  }
};
