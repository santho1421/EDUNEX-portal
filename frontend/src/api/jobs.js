import { getCollectionData, addDocument, setDocument, deleteDocument, getDocument } from '../services/firebaseDb';
import { db, auth } from '../config/firebase';
import { collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const getUid = () => auth.currentUser?.uid || JSON.parse(localStorage.getItem('sb_user') || '{}')?.id;

// ─── JOBS ─────────────────────────────────────────────────────────────────────
/** All active jobs — for students browsing */
export const getJobs = async () => {
  try {
    const all = await getCollectionData('jobs');
    return { data: { data: (all || []).filter(j => j.is_active !== false) } };
  } catch { return { data: { data: [] } }; }
};

/** Only THIS company's jobs */
export const getMyJobs = async () => {
  const uid = getUid();
  try {
    const q = query(collection(db, 'jobs'), where('companyId', '==', uid));
    const snap = await getDocs(q);
    return { data: { data: snap.docs.map(d => ({ id: d.id, ...d.data() })) } };
  } catch { return { data: { data: [] } }; }
};

export const getJob = async (id) => ({ data: { data: await getDocument('jobs', id) } });

export const createJob = async (data) => {
  const uid = getUid();
  const profile = await getDocument('users', uid);
  const result = await addDocument('jobs', {
    ...data,
    companyId: uid,
    company_name: profile?.name || 'Unknown Company',
    company_email: profile?.hr_email || profile?.email || '',
    company_phone: profile?.phone || '',
    is_active: true,
    type: 'job',
  });
  return { data: { data: result } };
};

export const updateJob = async (id, data) => {
  await setDocument('jobs', id, { ...data, updatedAt: new Date().toISOString() });
  return { data: { data: { id } } };
};

export const deleteJob = async (id) => {
  await deleteDocument('jobs', id);
  return { data: { data: { success: true } } };
};

// ─── INTERNSHIPS ──────────────────────────────────────────────────────────────
/** All active internships — for students browsing */
export const getInternships = async () => {
  try {
    const all = await getCollectionData('internships');
    return { data: { data: (all || []).filter(j => j.is_active !== false) } };
  } catch { return { data: { data: [] } }; }
};

/** Only THIS company's internships */
export const getMyInternships = async () => {
  const uid = getUid();
  try {
    const q = query(collection(db, 'internships'), where('companyId', '==', uid));
    const snap = await getDocs(q);
    return { data: { data: snap.docs.map(d => ({ id: d.id, ...d.data() })) } };
  } catch { return { data: { data: [] } }; }
};

export const getInternship = async (id) => ({ data: { data: await getDocument('internships', id) } });

export const createInternship = async (data) => {
  const uid = getUid();
  const profile = await getDocument('users', uid);
  const result = await addDocument('internships', {
    ...data,
    companyId: uid,
    company_name: profile?.name || 'Unknown Company',
    company_email: profile?.hr_email || profile?.email || '',
    company_phone: profile?.phone || '',
    is_active: true,
    type: 'internship',
  });
  return { data: { data: result } };
};

export const updateInternship = async (id, data) => {
  await setDocument('internships', id, { ...data, updatedAt: new Date().toISOString() });
  return { data: { data: { id } } };
};

export const deleteInternship = async (id) => {
  await deleteDocument('internships', id);
  return { data: { data: { success: true } } };
};

// ─── COURSES (Company-offered) ────────────────────────────────────────────────
/** All courses — for students browsing */
export const getCourses = async () => {
  try {
    const all = await getCollectionData('master_courses');
    return { data: { data: all || [] } };
  } catch { return { data: { data: [] } }; }
};

/** Only THIS company's courses */
export const getMyCourses = async () => {
  const uid = getUid();
  try {
    const q = query(collection(db, 'master_courses'), where('companyId', '==', uid));
    const snap = await getDocs(q);
    return { data: { data: snap.docs.map(d => ({ id: d.id, ...d.data() })) } };
  } catch { return { data: { data: [] } }; }
};

export const getCourse = async (id) => ({ data: { data: await getDocument('master_courses', id) } });

export const createCourse = async (data) => {
  const uid = getUid();
  const profile = await getDocument('users', uid);
  const result = await addDocument('master_courses', {
    ...data,
    companyId: uid,
    company_name: profile?.name || 'Unknown Company',
  });
  return { data: { data: result } };
};

export const updateCourse = async (id, data) => {
  await setDocument('master_courses', id, { ...data, updatedAt: new Date().toISOString() });
  return { data: { data: { id } } };
};

export const deleteCourse = async (id) => {
  await deleteDocument('master_courses', id);
  return { data: { data: { success: true } } };
};

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
export const applyToJob = async (data) => ({ data: { data: await addDocument('applications', data) } });
export const getCompanyApplications = async () => ({ data: { data: await getCollectionData('applications') } });
export const updateApplicationStatus = async (id, data) => ({ data: { data: await setDocument('applications', id, data) } });

// ─── RECOMMENDATIONS ────────────────────────────────────────────────────────
const calculateMatchScore = (itemSkillsStr, userSkillsList) => {
  if (!itemSkillsStr) return 0;
  const itemSkills = Array.isArray(itemSkillsStr) ? itemSkillsStr : itemSkillsStr.split(',').map(s => s.trim());
  if (itemSkills.length === 0) return 0;
  
  let matches = 0;
  const userLower = userSkillsList.map(s => s.toLowerCase());
  
  itemSkills.forEach(req => {
    const reqLower = req.toLowerCase();
    // Check if the required skill matches any of the user's skills
    if (userLower.some(u => reqLower.includes(u) || u.includes(reqLower))) {
      matches++;
    }
  });
  
  return Math.round((matches / itemSkills.length) * 100);
};

export const getRecommendedJobs = async () => {
  try {
    const uid = getUid();
    const [allJobs, userSkills] = await Promise.all([
      getCollectionData('jobs'),
      getCollectionData(`users/${uid}/skills`)
    ]);
    
    const userSkillsList = userSkills.map(s => s.skill_name || s.name || '');
    const activeJobs = (allJobs || []).filter(j => j.is_active !== false);
    
    const scoredJobs = activeJobs.map(j => ({
      ...j,
      matchScore: calculateMatchScore(j.required_skills, userSkillsList)
    }));

    const recommended = scoredJobs.filter(j => j.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);
    return { data: { data: recommended } };
  } catch (err) {
    console.error(err);
    return { data: { data: [] } };
  }
};

export const getRecommendedInternships = async () => {
  try {
    const uid = getUid();
    const [allInternships, userSkills] = await Promise.all([
      getCollectionData('internships'),
      getCollectionData(`users/${uid}/skills`)
    ]);
    
    const userSkillsList = userSkills.map(s => s.skill_name || s.name || '');
    const activeInternships = (allInternships || []).filter(j => j.is_active !== false);
    
    const scoredInternships = activeInternships.map(j => ({
      ...j,
      matchScore: calculateMatchScore(j.required_skills, userSkillsList)
    }));

    const recommended = scoredInternships.filter(j => j.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);
    return { data: { data: recommended } };
  } catch (err) {
    console.error(err);
    return { data: { data: [] } };
  }
};
