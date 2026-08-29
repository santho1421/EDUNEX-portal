import { auth, db } from '../config/firebase';
import { getDocument, setDocument, getCollectionData, addDocument, deleteDocument } from '../services/firebaseDb';
import { collection, query, where, getDocs } from 'firebase/firestore';

const getUid = () => {
  const uid = auth.currentUser?.uid || JSON.parse(localStorage.getItem('sb_user'))?.id;
  if (!uid) throw new Error("User not authenticated");
  return uid;
};

// We wrap the return values in { data: { data: result } } to match the old Axios response format expected by UI components.

export const getProfile = async () => {
  const data = await getDocument('users', getUid());
  return { data: { data: data || {} } };
};

export const updateProfile = async (formData) => {
  const updateData = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData;
  const data = await setDocument('users', getUid(), updateData);
  return { data: { data } };
};

export const getDepartments = async () => {
  const data = await getCollectionData(`users/${getUid()}/departments`);
  return { data: { data } };
};

export const addDepartment = async (data) => {
  const result = await addDocument(`users/${getUid()}/departments`, data);
  return { data: { data: result } };
};

export const deleteDepartment = async (id) => {
  await deleteDocument(`users/${getUid()}/departments`, id);
  return { data: { data: { success: true } } };
};

export const getCurriculum = async () => {
  const data = await getCollectionData(`users/${getUid()}/curriculum`);
  return { data: { data } };
};

export const addCurriculum = async (data) => {
  const result = await addDocument(`users/${getUid()}/curriculum`, data);
  return { data: { data: result } };
};

export const getSubjects = async (curriculumId) => {
  const data = await getCollectionData(`users/${getUid()}/curriculum/${curriculumId}/subjects`);
  return { data: { data } };
};

export const addSubject = async (data) => {
  const { curriculumId, ...subjectData } = data;
  const result = await addDocument(`users/${getUid()}/curriculum/${curriculumId}/subjects`, subjectData);
  return { data: { data: result } };
};

export const deleteSubject = async (id, curriculumId) => {
  await deleteDocument(`users/${getUid()}/curriculum/${curriculumId}/subjects`, id);
  return { data: { data: { success: true } } };
};

export const getSkillGap = async () => {
  return { data: { data: [] } };
};

export const getStudents = async () => {
  const uid = getUid();
  const profile = await getDocument('users', uid);
  const collegeName = profile?.name;
  
  if (!collegeName) return { data: { data: [] } };

  const q = query(
    collection(db, 'users'), 
    where('role', '==', 'student'),
    where('college', '==', collegeName)
  );
  
  const snap = await getDocs(q);
  const students = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return { data: { data: students } };
};

export const unlinkStudent = async (studentId) => {
  // Sets verified to false and verification_status to rejected
  await setDocument('users', studentId, { verified: false, verification_status: 'rejected', college: '' });
  return { data: { data: { success: true } } };
};

export const getConnectedCompanies = async () => {
  const uid = getUid();
  // Connection requests where this college is involved and accepted
  const sentQ = query(collection(db, 'connection_requests'), where('senderId', '==', uid), where('status', '==', 'accepted'));
  const recvQ = query(collection(db, 'connection_requests'), where('receiverId', '==', uid), where('status', '==', 'accepted'));
  
  const [sentSnap, recvSnap] = await Promise.all([getDocs(sentQ), getDocs(recvQ)]);
  const allConnections = [
    ...sentSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    ...recvSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  ];
  return { data: { data: allConnections } };
};

export const getDashboardStats = async () => {
  const uid = getUid();
  
  // 1. Get Students Count
  const { data: { data: students } } = await getStudents();
  
  // 2. Get Pending Verifications
  const verificationQ = query(collection(db, 'verification_requests'), where('collegeId', '==', uid), where('status', '==', 'pending'));
  const verifySnap = await getDocs(verificationQ);
  
  // 3. Get Connections
  const { data: { data: connections } } = await getConnectedCompanies();

  return { 
    data: { 
      data: { 
        totalStudents: students.length, 
        verifiedStudents: students.filter(s => s.verified).length,
        pendingVerifications: verifySnap.size,
        connectedCompanies: connections.length,
        avgSkillScore: Math.floor(Math.random() * 30) + 60 // placeholder
      } 
    } 
  };
};
