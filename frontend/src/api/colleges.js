import { getCollectionData, addDocument, setDocument, deleteDocument } from '../services/firebaseDb';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// ─── Master Colleges ──────────────────────────────────────────────────────────
export const getMasterColleges = async () => {
  return await getCollectionData('master_colleges');
};

export const addMasterCollege = async (data) => {
  return await addDocument('master_colleges', data);
};

export const updateMasterCollege = async (id, data) => {
  return await setDocument('master_colleges', id, data);
};

export const deleteMasterCollege = async (id) => {
  return await deleteDocument('master_colleges', id);
};

// ─── Verification Requests ────────────────────────────────────────────────────
export const sendVerificationRequest = async (studentData) => {
  // studentData: { studentId, studentName, email, collegeId, collegeName, degree, graduation_year }
  const ref = collection(db, 'verification_requests');
  const docRef = await addDoc(ref, {
    ...studentData,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: docRef.id, ...studentData, status: 'pending' };
};

export const getVerificationRequests = async (collegeId) => {
  const q = query(collection(db, 'verification_requests'), where('collegeId', '==', collegeId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllVerificationRequests = async () => {
  return await getCollectionData('verification_requests');
};

export const updateVerificationStatus = async (requestId, status, studentId) => {
  // Update the request document
  await setDocument('verification_requests', requestId, { status });
  // If approved, update the student's user document
  if (status === 'approved' && studentId) {
    await setDocument('users', studentId, { verified: true, verification_status: 'approved' });
  } else if (status === 'rejected' && studentId) {
    await setDocument('users', studentId, { verified: false, verification_status: 'rejected' });
  }
};

// ─── Connection Requests ──────────────────────────────────────────────────────
export const sendConnectionRequest = async ({ senderId, senderName, senderRole, receiverId, receiverName, receiverRole, message = '' }) => {
  // Check if request already exists
  const q = query(collection(db, 'connection_requests'),
    where('senderId', '==', senderId),
    where('receiverId', '==', receiverId)
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error('Connection request already sent to this organization.');
  }
  const ref = collection(db, 'connection_requests');
  const docRef = await addDoc(ref, {
    senderId, senderName, senderRole,
    receiverId, receiverName, receiverRole,
    message, status: 'pending',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  return { id: docRef.id };
};

export const getConnectionRequests = async (userId) => {
  // Requests sent TO this user
  const receivedQ = query(collection(db, 'connection_requests'), where('receiverId', '==', userId));
  // Requests sent BY this user
  const sentQ = query(collection(db, 'connection_requests'), where('senderId', '==', userId));
  const [received, sent] = await Promise.all([getDocs(receivedQ), getDocs(sentQ)]);
  return {
    received: received.docs.map(d => ({ id: d.id, ...d.data() })),
    sent: sent.docs.map(d => ({ id: d.id, ...d.data() }))
  };
};

export const updateConnectionStatus = async (requestId, status, senderId) => {
  await setDocument('connection_requests', requestId, { status });
};
