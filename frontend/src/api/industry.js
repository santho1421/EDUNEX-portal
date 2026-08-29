import { auth } from '../config/firebase';
import { getDocument, setDocument, getCollectionData, addDocument, deleteDocument } from '../services/firebaseDb';

const getUid = () => {
  const uid = auth.currentUser?.uid || JSON.parse(localStorage.getItem('sb_user'))?.id;
  if (!uid) throw new Error("User not authenticated");
  return uid;
};

export const getProfile = async () => {
  const data = await getDocument('users', getUid());
  return { data: { data: data || {} } };
};

export const updateProfile = async (formData) => {
  const updateData = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData;
  const data = await setDocument('users', getUid(), updateData);
  return { data: { data } };
};

export const getRequiredSkills = async () => {
  const data = await getCollectionData(`users/${getUid()}/required_skills`);
  return { data: { data } };
};

export const addRequiredSkill = async (data) => {
  const result = await addDocument(`users/${getUid()}/required_skills`, data);
  return { data: { data: result } };
};

export const removeRequiredSkill = async (skillId) => {
  await deleteDocument(`users/${getUid()}/required_skills`, skillId);
  return { data: { data: { success: true } } };
};

export const talentSearch = async (params) => {
  return { data: { data: [] } }; // Needs proper Firestore querying based on skills
};

export const getColleges = async () => {
  return { data: { data: [] } }; // Fetch users with role 'college'
};

export const getDashboardStats = async () => {
  const stats = await getDocument('stats', getUid());
  return { data: { data: stats || { activeJobs: 0, totalApplications: 0, interviewsScheduled: 0, hired: 0 } } };
};
