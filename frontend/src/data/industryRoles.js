export const INDUSTRY_ROLES = [
  {
    id: 'frontend-developer',
    title: 'Frontend Developer',
    description: 'Builds the user-facing side of websites and web applications.',
    requirements: [
      { skill_name: 'React', required_proficiency: 'advanced', category: 'Frontend' },
      { skill_name: 'JavaScript (ES6+)', required_proficiency: 'expert', category: 'Frontend' },
      { skill_name: 'HTML5', required_proficiency: 'advanced', category: 'Frontend' },
      { skill_name: 'CSS3', required_proficiency: 'advanced', category: 'Frontend' },
      { skill_name: 'TypeScript', required_proficiency: 'intermediate', category: 'Frontend' },
      { skill_name: 'UI/UX Design', required_proficiency: 'beginner', category: 'Design' },
      { skill_name: 'Problem Solving', required_proficiency: 'intermediate', category: 'Soft Skill' },
    ]
  },
  {
    id: 'backend-developer',
    title: 'Backend Developer',
    description: 'Develops and maintains server-side logic and databases.',
    requirements: [
      { skill_name: 'Node.js', required_proficiency: 'advanced', category: 'Backend' },
      { skill_name: 'Python', required_proficiency: 'advanced', category: 'Backend' },
      { skill_name: 'MySQL', required_proficiency: 'intermediate', category: 'Database' },
      { skill_name: 'PostgreSQL', required_proficiency: 'intermediate', category: 'Database' },
      { skill_name: 'AWS', required_proficiency: 'intermediate', category: 'DevOps & Cloud' },
      { skill_name: 'Docker', required_proficiency: 'beginner', category: 'DevOps & Cloud' },
      { skill_name: 'Problem Solving', required_proficiency: 'advanced', category: 'Soft Skill' },
    ]
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    description: 'Analyzes large datasets to find patterns and insights.',
    requirements: [
      { skill_name: 'Python', required_proficiency: 'expert', category: 'Language' },
      { skill_name: 'Machine Learning', required_proficiency: 'advanced', category: 'AI & Data Science' },
      { skill_name: 'Pandas', required_proficiency: 'advanced', category: 'AI & Data Science' },
      { skill_name: 'NumPy', required_proficiency: 'advanced', category: 'AI & Data Science' },
      { skill_name: 'Data Visualization', required_proficiency: 'intermediate', category: 'AI & Data Science' },
      { skill_name: 'Critical Thinking', required_proficiency: 'advanced', category: 'Soft Skill' },
    ]
  },
  {
    id: 'full-stack-developer',
    title: 'Full Stack Developer',
    description: 'Handles both frontend and backend development.',
    requirements: [
      { skill_name: 'React', required_proficiency: 'intermediate', category: 'Frontend' },
      { skill_name: 'Node.js', required_proficiency: 'intermediate', category: 'Backend' },
      { skill_name: 'JavaScript (ES6+)', required_proficiency: 'advanced', category: 'Language' },
      { skill_name: 'MongoDB', required_proficiency: 'intermediate', category: 'Database' },
      { skill_name: 'Git', required_proficiency: 'intermediate', category: 'DevOps & Cloud' },
      { skill_name: 'Communication', required_proficiency: 'intermediate', category: 'Soft Skill' },
    ]
  },
  {
    id: 'ui-ux-designer',
    title: 'UI/UX Designer',
    description: 'Creates intuitive and visually appealing user interfaces.',
    requirements: [
      { skill_name: 'Figma', required_proficiency: 'advanced', category: 'Design & UI/UX' },
      { skill_name: 'UI/UX Design', required_proficiency: 'expert', category: 'Design & UI/UX' },
      { skill_name: 'Wireframing', required_proficiency: 'advanced', category: 'Design & UI/UX' },
      { skill_name: 'User Research', required_proficiency: 'intermediate', category: 'Design & UI/UX' },
      { skill_name: 'HTML5', required_proficiency: 'beginner', category: 'Frontend' },
      { skill_name: 'CSS3', required_proficiency: 'beginner', category: 'Frontend' },
    ]
  },
  {
    id: 'mobile-developer',
    title: 'Mobile App Developer',
    description: 'Develops applications for iOS and Android platforms.',
    requirements: [
      { skill_name: 'React Native', required_proficiency: 'intermediate', category: 'Mobile' },
      { skill_name: 'Flutter', required_proficiency: 'intermediate', category: 'Mobile' },
      { skill_name: 'Swift', required_proficiency: 'beginner', category: 'Mobile' },
      { skill_name: 'JavaScript (ES6+)', required_proficiency: 'advanced', category: 'Language' },
      { skill_name: 'REST APIs', required_proficiency: 'intermediate', category: 'Backend' },
    ]
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    description: 'Bridges the gap between development and operations.',
    requirements: [
      { skill_name: 'Docker', required_proficiency: 'advanced', category: 'DevOps' },
      { skill_name: 'Kubernetes', required_proficiency: 'advanced', category: 'DevOps' },
      { skill_name: 'AWS', required_proficiency: 'expert', category: 'Cloud' },
      { skill_name: 'CI/CD', required_proficiency: 'advanced', category: 'DevOps' },
      { skill_name: 'Linux', required_proficiency: 'intermediate', category: 'OS' },
      { skill_name: 'Python', required_proficiency: 'intermediate', category: 'Language' },
    ]
  },
  {
    id: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    description: 'Protects IT infrastructure and data from threats.',
    requirements: [
      { skill_name: 'Cybersecurity', required_proficiency: 'expert', category: 'Security' },
      { skill_name: 'Ethical Hacking', required_proficiency: 'advanced', category: 'Security' },
      { skill_name: 'Networking', required_proficiency: 'advanced', category: 'Networking' },
      { skill_name: 'Linux', required_proficiency: 'intermediate', category: 'OS' },
      { skill_name: 'Python', required_proficiency: 'beginner', category: 'Language' },
    ]
  },
  {
    id: 'cloud-architect',
    title: 'Cloud Architect',
    description: 'Designs and manages cloud computing strategies.',
    requirements: [
      { skill_name: 'AWS', required_proficiency: 'expert', category: 'Cloud' },
      { skill_name: 'Azure', required_proficiency: 'advanced', category: 'Cloud' },
      { skill_name: 'System Design', required_proficiency: 'expert', category: 'Architecture' },
      { skill_name: 'Kubernetes', required_proficiency: 'intermediate', category: 'DevOps' },
      { skill_name: 'Networking', required_proficiency: 'intermediate', category: 'Networking' },
    ]
  },
  {
    id: 'data-engineer',
    title: 'Data Engineer',
    description: 'Builds systems that collect, manage, and convert raw data.',
    requirements: [
      { skill_name: 'Python', required_proficiency: 'advanced', category: 'Language' },
      { skill_name: 'SQL', required_proficiency: 'expert', category: 'Database' },
      { skill_name: 'Data Engineering', required_proficiency: 'expert', category: 'Data' },
      { skill_name: 'AWS', required_proficiency: 'intermediate', category: 'Cloud' },
      { skill_name: 'Machine Learning', required_proficiency: 'beginner', category: 'Data' },
    ]
  }
];
