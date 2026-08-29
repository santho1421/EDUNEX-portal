// Skills are served from a static fallback list + any admin-added skills in Firestore
const { db } = require('../config/firebaseAdmin');

const FALLBACK_SKILLS = [
  // Programming Languages
  { id: 'python', name: 'Python', category: 'Programming' },
  { id: 'javascript', name: 'JavaScript', category: 'Programming' },
  { id: 'typescript', name: 'TypeScript', category: 'Programming' },
  { id: 'java', name: 'Java', category: 'Programming' },
  { id: 'cpp', name: 'C++', category: 'Programming' },
  { id: 'c', name: 'C', category: 'Programming' },
  { id: 'rust', name: 'Rust', category: 'Programming' },
  { id: 'go', name: 'Go', category: 'Programming' },
  { id: 'kotlin', name: 'Kotlin', category: 'Programming' },
  { id: 'swift', name: 'Swift', category: 'Programming' },
  { id: 'ruby', name: 'Ruby', category: 'Programming' },
  { id: 'php', name: 'PHP', category: 'Programming' },
  // Web
  { id: 'react', name: 'React', category: 'Web Development' },
  { id: 'nextjs', name: 'Next.js', category: 'Web Development' },
  { id: 'vuejs', name: 'Vue.js', category: 'Web Development' },
  { id: 'angular', name: 'Angular', category: 'Web Development' },
  { id: 'nodejs', name: 'Node.js', category: 'Web Development' },
  { id: 'express', name: 'Express.js', category: 'Web Development' },
  { id: 'html', name: 'HTML', category: 'Web Development' },
  { id: 'css', name: 'CSS', category: 'Web Development' },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'Web Development' },
  // Data Science & AI
  { id: 'ml', name: 'Machine Learning', category: 'Data Science & AI' },
  { id: 'dl', name: 'Deep Learning', category: 'Data Science & AI' },
  { id: 'nlp', name: 'Natural Language Processing', category: 'Data Science & AI' },
  { id: 'tensorflow', name: 'TensorFlow', category: 'Data Science & AI' },
  { id: 'pytorch', name: 'PyTorch', category: 'Data Science & AI' },
  { id: 'pandas', name: 'Pandas', category: 'Data Science & AI' },
  { id: 'numpy', name: 'NumPy', category: 'Data Science & AI' },
  { id: 'data_viz', name: 'Data Visualization', category: 'Data Science & AI' },
  // Databases
  { id: 'mysql', name: 'MySQL', category: 'Databases' },
  { id: 'postgresql', name: 'PostgreSQL', category: 'Databases' },
  { id: 'mongodb', name: 'MongoDB', category: 'Databases' },
  { id: 'firebase', name: 'Firebase', category: 'Databases' },
  { id: 'redis', name: 'Redis', category: 'Databases' },
  // Cloud & DevOps
  { id: 'aws', name: 'AWS', category: 'Cloud & DevOps' },
  { id: 'gcp', name: 'Google Cloud', category: 'Cloud & DevOps' },
  { id: 'azure', name: 'Microsoft Azure', category: 'Cloud & DevOps' },
  { id: 'docker', name: 'Docker', category: 'Cloud & DevOps' },
  { id: 'kubernetes', name: 'Kubernetes', category: 'Cloud & DevOps' },
  { id: 'git', name: 'Git', category: 'Cloud & DevOps' },
  { id: 'cicd', name: 'CI/CD', category: 'Cloud & DevOps' },
  // Mobile
  { id: 'react_native', name: 'React Native', category: 'Mobile' },
  { id: 'flutter', name: 'Flutter', category: 'Mobile' },
  { id: 'android', name: 'Android Development', category: 'Mobile' },
  { id: 'ios', name: 'iOS Development', category: 'Mobile' },
  // Soft Skills
  { id: 'communication', name: 'Communication', category: 'Soft Skills' },
  { id: 'teamwork', name: 'Teamwork', category: 'Soft Skills' },
  { id: 'problem_solving', name: 'Problem Solving', category: 'Soft Skills' },
  { id: 'leadership', name: 'Leadership', category: 'Soft Skills' },
  { id: 'project_mgmt', name: 'Project Management', category: 'Soft Skills' },
  // Design
  { id: 'ui_ux', name: 'UI/UX Design', category: 'Design' },
  { id: 'figma', name: 'Figma', category: 'Design' },
  { id: 'adobe_xd', name: 'Adobe XD', category: 'Design' },
];

// ─── GET /api/skills ──────────────────────────────────────────────────────────
exports.getAllSkills = async (req, res) => {
  try {
    const { category, search } = req.query;

    // Try to get admin-added skills from Firestore
    let dbSkills = [];
    try {
      const snap = await db.collection('skills').get();
      dbSkills = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      // Firestore not available, use fallback only
    }

    // Merge fallback + DB skills (DB skills override by id)
    const skillMap = new Map();
    FALLBACK_SKILLS.forEach(s => skillMap.set(s.id, s));
    dbSkills.forEach(s => skillMap.set(s.id, s));
    let skills = Array.from(skillMap.values());

    if (category) skills = skills.filter(s => s.category === category);
    if (search) skills = skills.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

    skills.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    res.json({ success: true, data: skills });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch skills.' });
  }
};

// ─── GET /api/skills/categories ──────────────────────────────────────────────
exports.getCategories = async (req, res) => {
  try {
    const cats = [...new Set(FALLBACK_SKILLS.map(s => s.category))].sort();
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
};

// ─── GET /api/skills/industry-demand ─────────────────────────────────────────
exports.getIndustryDemand = async (req, res) => {
  try {
    // Aggregate requiredSkills from all companies
    const snap = await db.collection('industries').get();
    const demandMap = {};

    snap.forEach(doc => {
      const skills = doc.data().requiredSkills || [];
      skills.forEach(s => {
        if (!demandMap[s.id || s.skillName]) {
          demandMap[s.id || s.skillName] = { skillName: s.skillName, category: s.category || 'General', count: 0, demandScore: 0 };
        }
        demandMap[s.id || s.skillName].count += 1;
        const levelScore = { critical: 4, high: 3, medium: 2, low: 1 };
        demandMap[s.id || s.skillName].demandScore += levelScore[s.demandLevel] || 1;
      });
    });

    const result = Object.entries(demandMap)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.demandScore - a.demandScore)
      .slice(0, 30);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch industry demand.' });
  }
};

// ─── POST /api/skills — admin adds a skill ────────────────────────────────────
exports.addSkill = async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Skill name is required.' });
    const id = name.toLowerCase().replace(/\s+/g, '_');
    await db.collection('skills').doc(id).set({ id, name, category: category || 'General' });
    res.status(201).json({ success: true, message: 'Skill added.', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add skill.' });
  }
};

// ─── DELETE /api/skills/:id — admin deletes ───────────────────────────────────
exports.deleteSkill = async (req, res) => {
  try {
    await db.collection('skills').doc(req.params.id).delete();
    res.json({ success: true, message: 'Skill deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete skill.' });
  }
};
