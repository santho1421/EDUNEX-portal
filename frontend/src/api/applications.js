import { db, storage } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../config/firebase';

const getUid = () => auth.currentUser?.uid || JSON.parse(localStorage.getItem('sb_user') || '{}')?.id;

// ─── Apply to a Job (with resume upload) ─────────────────────────────────────
export const applyToJob = async ({ jobId, jobTitle, companyId, companyName, resumeFile, coverNote = '' }) => {
  const uid = getUid();
  // Get student profile
  const { getDocument } = await import('../services/firebaseDb');
  const profile = await getDocument('users', uid);

  let resumeUrl = '';
  if (resumeFile) {
    // Upload resume to Firebase Storage
    try {
      const { getStorage } = await import('firebase/storage');
      const storageRef = ref(storage, `resumes/${uid}/${jobId}_${Date.now()}.pdf`);
      const snapshot = await uploadBytes(storageRef, resumeFile);
      resumeUrl = await getDownloadURL(snapshot.ref);
    } catch (err) {
      console.warn('Resume upload failed, proceeding without it:', err.message);
    }
  }

  const application = {
    studentId: uid,
    studentName: profile?.name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
    studentEmail: profile?.email || '',
    studentDept: profile?.degree || profile?.department || '',
    studentCollege: profile?.college || '',
    studentPhone: profile?.phone || '',
    jobId,
    jobTitle,
    companyId,
    companyName,
    resumeUrl,
    coverNote,
    status: 'applied',
    appliedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    history: [{ status: 'applied', note: 'Application submitted', timestamp: new Date().toISOString() }]
  };

  const ref2 = collection(db, 'applications');
  const docRef = await addDoc(ref2, application);
  return { id: docRef.id, ...application };
};

// ─── Get Student's Own Applications ───────────────────────────────────────────
export const getStudentApplications = async () => {
  const uid = getUid();
  const q = query(collection(db, 'applications'), where('studentId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Subscribe to real-time updates of student's applications
export const subscribeStudentApplications = (callback) => {
  const uid = getUid();
  const q = query(collection(db, 'applications'), where('studentId', '==', uid));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// ─── Get Applications for a Company's Jobs ────────────────────────────────────
export const getCompanyApplications = async (companyId) => {
  const uid = companyId || getUid();
  const q = query(collection(db, 'applications'), where('companyId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Subscribe to real-time updates for a company
export const subscribeCompanyApplications = (companyId, callback) => {
  const uid = companyId || getUid();
  const q = query(collection(db, 'applications'), where('companyId', '==', uid));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// ─── Update Application Status (Company Action) ───────────────────────────────
export const updateApplicationStatus = async (applicationId, newStatus, note = '') => {
  const appRef = doc(db, 'applications', applicationId);
  
  // Get current history
  const { getDocument } = await import('../services/firebaseDb');
  const current = await getDocument('applications', applicationId);
  const history = current?.history || [];
  history.push({ status: newStatus, note: note || `Status updated to ${newStatus}`, timestamp: new Date().toISOString() });

  await updateDoc(appRef, {
    status: newStatus,
    history,
    updatedAt: serverTimestamp()
  });

  // Send notification to student
  try {
    const { sendNotification } = await import('./notifications');
    const statusLabels = {
      shortlisted: 'You have been shortlisted! 🎉',
      interview_scheduled: 'Your interview has been scheduled! 📅',
      offer_extended: 'Congratulations! You received an offer! 🏆',
      rejected: 'Your application status has been updated.'
    };
    const msg = statusLabels[newStatus] || `Application update for "${current?.jobTitle}"`;
    await sendNotification(current?.studentId, msg, newStatus, { jobTitle: current?.jobTitle, companyName: current?.companyName });
  } catch (err) {
    console.warn('Failed to send notification:', err.message);
  }
};

// ─── Check if Student Already Applied ────────────────────────────────────────
export const hasApplied = async (jobId) => {
  const uid = getUid();
  const q = query(collection(db, 'applications'), where('studentId', '==', uid), where('jobId', '==', jobId));
  const snap = await getDocs(q);
  return !snap.empty;
};
