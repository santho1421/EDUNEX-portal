import { getCollectionData } from '../services/firebaseDb';

export const getAllSkills = async () => {
  try {
    const skills = await getCollectionData('master_skills');
    return { data: { data: skills || [] } };
  } catch (err) {
    console.error("Error fetching skills:", err);
    return { data: { data: [] } };
  }
};

export const getCategories = async () => {
  return { data: { data: ['Frontend', 'Backend', 'Language', 'Design', 'Soft Skill'] } };
};

export const getIndustryDemand = async () => {
  return { data: { data: [] } };
};
