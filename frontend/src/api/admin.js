import { getCollectionData, addDocument, setDocument, deleteDocument, getDocument } from '../services/firebaseDb';
import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export const getMasterCourses = async () => {
  return await getCollectionData('master_courses');
};

export const addMasterCourse = async (courseData) => {
  return await addDocument('master_courses', courseData);
};

export const updateMasterCourse = async (id, courseData) => {
  return await setDocument('master_courses', id, courseData);
};

export const deleteMasterCourse = async (id) => {
  return await deleteDocument('master_courses', id);
};

export const getMasterCertifications = async () => {
  return await getCollectionData('master_certifications');
};

export const addMasterCertification = async (certData) => {
  return await addDocument('master_certifications', certData);
};

export const updateMasterCertification = async (id, certData) => {
  return await setDocument('master_certifications', id, certData);
};

export const deleteMasterCertification = async (id) => {
  return await deleteDocument('master_certifications', id);
};

export const getAllUsers = async (role) => {
  try {
    const usersRef = collection(db, 'users');
    let q = usersRef;
    if (role) {
      q = query(usersRef, where('role', '==', role));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    if (error.code !== 'permission-denied') {
      console.error("Error fetching users:", error);
    }
    return [];
  }
};

export const deleteUserAccount = async (id) => {
  return await deleteDocument('users', id);
};
