export const FALLBACK_SKILLS = [
  // Frontend
  'React', 'Angular', 'Vue.js', 'Next.js', 'HTML5', 'CSS3', 'SASS', 'Tailwind CSS', 'JavaScript (ES6+)', 'TypeScript',
  // Backend
  'Node.js', 'Express.js', 'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'C#', '.NET', 'Ruby on Rails', 'PHP', 'Laravel', 'Go', 'Rust',
  // Database
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase', 'Oracle', 'SQL Server', 'Cassandra', 'Elasticsearch',
  // DevOps & Cloud
  'AWS', 'Google Cloud (GCP)', 'Microsoft Azure', 'Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions', 'Terraform', 'Linux', 'CI/CD',
  // AI & Data Science
  'Machine Learning', 'Deep Learning', 'Data Analysis', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Computer Vision', 'NLP', 'Data Visualization',
  // Mobile
  'Flutter', 'React Native', 'Swift', 'Kotlin', 'Android Development', 'iOS Development',
  // Design & UI/UX
  'Figma', 'Adobe XD', 'Sketch', 'UI/UX Design', 'Wireframing', 'Prototyping', 'User Research',
  // Cybersecurity & Networking
  'Cybersecurity', 'Ethical Hacking', 'Network Security', 'Cryptography', 'Penetration Testing',
  // Other Tech
  'Blockchain', 'Solidity', 'IoT', 'C++', 'C', 'MATLAB', 'AutoCAD', 'SolidWorks',
  // Business & Management
  'Project Management', 'Agile/Scrum', 'Product Management', 'Digital Marketing', 'SEO', 'Content Writing', 'Business Analysis',
  // Soft Skills
  'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Critical Thinking', 'Time Management', 'Public Speaking', 'Adaptability'
].map((name, index) => ({ id: index + 1, name, category: 'Skill' }));
