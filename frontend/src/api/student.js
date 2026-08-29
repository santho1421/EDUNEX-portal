import { auth } from '../config/firebase';
import { getDocument, setDocument, getCollectionData, addDocument, deleteDocument } from '../services/firebaseDb';
import { INDUSTRY_ROLES } from '../data/industryRoles';
import { getMasterCertifications } from './admin';

const PROF_LEVELS = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

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
  // If formData is FormData object (from old API), convert it. We assume it's a plain object in the new UI or we just save the plain fields.
  const updateData = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData;
  const data = await setDocument('users', getUid(), updateData);
  return { data: { data } };
};

export const getSkills = async () => {
  const data = await getCollectionData(`users/${getUid()}/skills`);
  return { data: { data: data.map(s => ({ ...s, skill_id: s.id })) } };
};

export const addSkill = async (data) => {
  const result = await addDocument(`users/${getUid()}/skills`, data);
  return { data: { data: result } };
};

export const removeSkill = async (skillId) => {
  await deleteDocument(`users/${getUid()}/skills`, skillId);
  return { data: { data: { success: true } } };
};

export const getSkillGap = async (targetRoleId) => {
  const [userSkills, userCerts, profile, masterCerts, allCourses] = await Promise.all([
    getCollectionData(`users/${getUid()}/skills`),
    getCollectionData(`users/${getUid()}/certifications`),
    getDocument('users', getUid()),
    getMasterCertifications(),
    getCollectionData('master_courses')
  ]);

  // 1. Merge explicitly added skills with skills inferred from certifications
  const mergedSkills = [...userSkills];

  userCerts.forEach(cert => {
    // Find the certification in our global database
    const certDef = (masterCerts || []).find(c => c.name.toLowerCase() === cert.name.toLowerCase());
    if (certDef) {
      const existingSkillIndex = mergedSkills.findIndex(s => s.skill_name?.toLowerCase() === certDef.mapped_skill.toLowerCase());
      
      if (existingSkillIndex > -1) {
        // Upgrade proficiency if the certification implies a higher level than what the user manually selected
        const existingProf = PROF_LEVELS[mergedSkills[existingSkillIndex].proficiency] || 1;
        const certProf = PROF_LEVELS[certDef.proficiency] || 1;
        if (certProf > existingProf) {
          mergedSkills[existingSkillIndex].proficiency = certDef.proficiency;
          mergedSkills[existingSkillIndex]._inferred_from = cert.name;
        }
      } else {
        // Add the skill purely based on the certification
        mergedSkills.push({
          skill_name: certDef.mapped_skill,
          proficiency: certDef.proficiency,
          _inferred_from: cert.name
        });
      }
    }
  });
  
  
  // Use passed role, or profile's saved role, or default to first
  const activeRoleId = targetRoleId || profile?.target_role || INDUSTRY_ROLES[0].id;
  const role = INDUSTRY_ROLES.find(r => r.id === activeRoleId) || INDUSTRY_ROLES[0];
  const requiredSkills = role.requirements;

  const matched = [];
  const partial = [];
  const missing = [];
  
  let scorePoints = 0;
  let maxPoints = requiredSkills.length * 4;

  requiredSkills.forEach(req => {
    const userSkill = mergedSkills.find(s => s.skill_name?.toLowerCase() === req.skill_name.toLowerCase());
    const reqLevel = PROF_LEVELS[req.required_proficiency] || 1;

    if (userSkill) {
      const userLevel = PROF_LEVELS[userSkill.proficiency] || 1;
      scorePoints += userLevel;

      if (userLevel >= reqLevel) {
        matched.push({ ...req, student_proficiency: userSkill.proficiency, inferred_from: userSkill._inferred_from });
      } else {
        partial.push({ ...req, student_proficiency: userSkill.proficiency, gap_levels: reqLevel - userLevel, inferred_from: userSkill._inferred_from });
      }
    } else {
      missing.push({ ...req, company_count: Math.floor(Math.random() * 50) + 10 });
    }
  });

  const readiness_score = maxPoints > 0 ? Math.round((scorePoints / maxPoints) * 100) : 0;

  // Find real recommended courses that cover the missing/partial skills
  const skillsToImprove = [...missing, ...partial].map(s => s.skill_name.toLowerCase());
  const recommended_courses = (allCourses || []).filter(course => {
    if (!course.skills_covered) return false;
    const courseSkills = Array.isArray(course.skills_covered) ? course.skills_covered : course.skills_covered.split(',').map(s => s.trim().toLowerCase());
    return courseSkills.some(cs => skillsToImprove.some(st => cs.includes(st) || st.includes(cs)));
  });

  const mockData = {
    readiness_score: Math.min(100, readiness_score), // Cap at 100%
    target_role: role,
    matched_count: matched.length,
    partial_count: partial.length,
    missing_count: missing.length,
    skills: { matched, partial, missing },
    recommended_courses
  };

  return { data: { data: mockData } };
};

export const getProjects = async () => {
  const data = await getCollectionData(`users/${getUid()}/projects`);
  return { data: { data } };
};

export const addProject = async (data) => {
  const result = await addDocument(`users/${getUid()}/projects`, data);
  return { data: { data: result } };
};

export const deleteProject = async (id) => {
  await deleteDocument(`users/${getUid()}/projects`, id);
  return { data: { data: { success: true } } };
};

export const getCertifications = async () => {
  const data = await getCollectionData(`users/${getUid()}/certifications`);
  return { data: { data } };
};

export const addCertification = async (data) => {
  const result = await addDocument(`users/${getUid()}/certifications`, data);
  return { data: { data: result } };
};

export const deleteCertification = async (id) => {
  await deleteDocument(`users/${getUid()}/certifications`, id);
  return { data: { data: { success: true } } };
};

export const getApplications = async () => {
  const data = await getCollectionData(`users/${getUid()}/applications`);
  return { data: { data } };
};

export const getDashboardStats = async () => {
  try {
    const uid = getUid();
    const [skills, projects, certs, apps] = await Promise.all([
      getCollectionData(`users/${uid}/skills`),
      getCollectionData(`users/${uid}/projects`),
      getCollectionData(`users/${uid}/certifications`),
      getCollectionData(`users/${uid}/applications`)
    ]);

    return { 
      data: { 
        data: {
          skill_count: skills.length,
          project_count: projects.length,
          certification_count: certs.length,
          application_count: apps.length
        } 
      } 
    };
  } catch (err) {
    return { data: { data: { skill_count: 0, project_count: 0, certification_count: 0, application_count: 0 } } };
  }
};
