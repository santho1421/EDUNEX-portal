-- SkillBridge Seed Data
USE skillbridge;

-- ============================================================
-- MASTER SKILLS
-- ============================================================
INSERT IGNORE INTO skills (name, category) VALUES
-- Programming Languages
('Python', 'Programming'),
('JavaScript', 'Programming'),
('Java', 'Programming'),
('C++', 'Programming'),
('C', 'Programming'),
('TypeScript', 'Programming'),
('Go', 'Programming'),
('Rust', 'Programming'),
('PHP', 'Programming'),
('Swift', 'Programming'),
('Kotlin', 'Programming'),
('R', 'Data Science'),
-- Web Development
('React.js', 'Web Development'),
('Node.js', 'Web Development'),
('Express.js', 'Web Development'),
('HTML/CSS', 'Web Development'),
('Vue.js', 'Web Development'),
('Angular', 'Web Development'),
('Next.js', 'Web Development'),
('Django', 'Web Development'),
('Flask', 'Web Development'),
('FastAPI', 'Web Development'),
('Spring Boot', 'Web Development'),
-- Database
('MySQL', 'Database'),
('PostgreSQL', 'Database'),
('MongoDB', 'Database'),
('Redis', 'Database'),
('SQL', 'Database'),
('NoSQL', 'Database'),
('Firebase', 'Database'),
-- Cloud & DevOps
('AWS', 'Cloud'),
('Google Cloud', 'Cloud'),
('Azure', 'Cloud'),
('Docker', 'DevOps'),
('Kubernetes', 'DevOps'),
('CI/CD', 'DevOps'),
('Linux', 'DevOps'),
('Git', 'DevOps'),
('Cloud Computing', 'Cloud'),
-- Data Science & AI
('Machine Learning', 'AI/ML'),
('Deep Learning', 'AI/ML'),
('Data Analysis', 'Data Science'),
('TensorFlow', 'AI/ML'),
('PyTorch', 'AI/ML'),
('NLP', 'AI/ML'),
('Computer Vision', 'AI/ML'),
('Data Visualization', 'Data Science'),
('Statistics', 'Data Science'),
('Pandas', 'Data Science'),
('NumPy', 'Data Science'),
-- Mobile
('React Native', 'Mobile'),
('Flutter', 'Mobile'),
('Android Development', 'Mobile'),
('iOS Development', 'Mobile'),
-- Soft Skills
('Communication', 'Soft Skills'),
('Problem Solving', 'Soft Skills'),
('Leadership', 'Soft Skills'),
('Team Collaboration', 'Soft Skills'),
('Project Management', 'Soft Skills'),
-- Other
('Cybersecurity', 'Security'),
('Blockchain', 'Emerging Tech'),
('IoT', 'Emerging Tech'),
('Agile/Scrum', 'Methodology'),
('REST APIs', 'Web Development'),
('GraphQL', 'Web Development'),
('Figma', 'Design'),
('UI/UX Design', 'Design');

-- ============================================================
-- DEMO ACCOUNTS (password: Demo@1234)
-- bcrypt hash of "Demo@1234"
-- ============================================================

-- Demo Student
INSERT IGNORE INTO users (id, email, password_hash, role) VALUES
('u-student-demo-001', 'demo@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('u-student-demo-002', 'student@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('u-college-demo-001', 'college@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'college'),
('u-college-demo-002', 'college@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'college'),
('u-industry-demo-001', 'industry@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'industry'),
('u-industry-demo-002', 'industry@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'industry');

-- Note: The bcrypt hash above is for "password" - we'll handle real hashing in seed.js script
-- Demo College
INSERT IGNORE INTO colleges (id, user_id, name, short_name, type, affiliation, city, state, about) VALUES
('col-demo-001', 'u-college-demo-001', 'National Institute of Technology Demo', 'NIT Demo', 'engineering', 'AICTE', 'Bangalore', 'Karnataka', 'A premier engineering institution focused on producing industry-ready graduates through cutting-edge curriculum.');

-- Demo Department
INSERT IGNORE INTO departments (id, college_id, name, code, degree, total_students) VALUES
(1, 'col-demo-001', 'Computer Science Engineering', 'CSE', 'B.Tech', 240),
(2, 'col-demo-001', 'Electronics & Communication', 'ECE', 'B.Tech', 180),
(3, 'col-demo-001', 'Information Technology', 'IT', 'B.Tech', 200);

-- Demo Student Profile
INSERT IGNORE INTO students (id, user_id, first_name, last_name, college_id, department_id, degree, graduation_year, cgpa, bio, city, state) VALUES
('stu-demo-001', 'u-student-demo-001', 'Arjun', 'Sharma', 'col-demo-001', 1, 'B.Tech CSE', 2025, 8.4, 'Passionate developer interested in AI/ML and full-stack development. Looking for opportunities to apply my skills in real-world projects.', 'Bangalore', 'Karnataka');

-- Demo Company
INSERT IGNORE INTO companies (id, user_id, name, industry_sector, company_size, city, state, about) VALUES
('comp-demo-001', 'u-industry-demo-001', 'TechVision Solutions', 'Information Technology', '201-500', 'Bangalore', 'Karnataka', 'A leading IT company specializing in AI-driven enterprise solutions. We believe in investing in talent and building the next generation of engineers.');

-- Demo Student Skills
INSERT IGNORE INTO student_skills (student_id, skill_id, proficiency) VALUES
('stu-demo-001', (SELECT id FROM skills WHERE name='Python'), 'intermediate'),
('stu-demo-001', (SELECT id FROM skills WHERE name='JavaScript'), 'intermediate'),
('stu-demo-001', (SELECT id FROM skills WHERE name='React.js'), 'beginner'),
('stu-demo-001', (SELECT id FROM skills WHERE name='SQL'), 'beginner'),
('stu-demo-001', (SELECT id FROM skills WHERE name='HTML/CSS'), 'advanced'),
('stu-demo-001', (SELECT id FROM skills WHERE name='Git'), 'intermediate');

-- Demo Industry Required Skills
INSERT IGNORE INTO industry_skills (company_id, skill_id, required_proficiency, is_mandatory, demand_level) VALUES
('comp-demo-001', (SELECT id FROM skills WHERE name='Python'), 'advanced', TRUE, 'critical'),
('comp-demo-001', (SELECT id FROM skills WHERE name='Machine Learning'), 'intermediate', TRUE, 'critical'),
('comp-demo-001', (SELECT id FROM skills WHERE name='SQL'), 'intermediate', TRUE, 'high'),
('comp-demo-001', (SELECT id FROM skills WHERE name='React.js'), 'intermediate', FALSE, 'high'),
('comp-demo-001', (SELECT id FROM skills WHERE name='Docker'), 'beginner', FALSE, 'medium'),
('comp-demo-001', (SELECT id FROM skills WHERE name='AWS'), 'beginner', FALSE, 'medium'),
('comp-demo-001', (SELECT id FROM skills WHERE name='Data Analysis'), 'intermediate', TRUE, 'high');

-- Demo Curriculum
INSERT IGNORE INTO curriculum (id, department_id, name, semester, academic_year, is_active) VALUES
(1, 1, 'CSE Semester 5 Curriculum', 5, '2024-25', TRUE),
(2, 1, 'CSE Semester 6 Curriculum', 6, '2024-25', TRUE),
(3, 2, 'ECE Semester 5 Curriculum', 5, '2024-25', TRUE);

-- Demo Subjects
INSERT IGNORE INTO subjects (id, curriculum_id, name, code, credits, semester, is_core) VALUES
(1, 1, 'Database Management Systems', 'CS501', 4, 5, TRUE),
(2, 1, 'Artificial Intelligence', 'CS502', 4, 5, TRUE),
(3, 1, 'Web Technologies', 'CS503', 3, 5, TRUE),
(4, 1, 'Computer Networks', 'CS504', 4, 5, TRUE),
(5, 2, 'Machine Learning', 'CS601', 4, 6, TRUE),
(6, 2, 'Cloud Computing', 'CS602', 3, 6, FALSE),
(7, 2, 'Software Engineering', 'CS603', 4, 6, TRUE);

-- Demo Subject Skills
INSERT IGNORE INTO subject_skills (subject_id, skill_id, proficiency_level) VALUES
(1, (SELECT id FROM skills WHERE name='SQL'), 'intermediate'),
(1, (SELECT id FROM skills WHERE name='MySQL'), 'intermediate'),
(2, (SELECT id FROM skills WHERE name='Python'), 'intermediate'),
(2, (SELECT id FROM skills WHERE name='Machine Learning'), 'beginner'),
(3, (SELECT id FROM skills WHERE name='HTML/CSS'), 'intermediate'),
(3, (SELECT id FROM skills WHERE name='JavaScript'), 'intermediate'),
(3, (SELECT id FROM skills WHERE name='React.js'), 'beginner'),
(5, (SELECT id FROM skills WHERE name='Machine Learning'), 'intermediate'),
(5, (SELECT id FROM skills WHERE name='Python'), 'advanced'),
(5, (SELECT id FROM skills WHERE name='Data Analysis'), 'intermediate'),
(6, (SELECT id FROM skills WHERE name='Cloud Computing'), 'intermediate'),
(6, (SELECT id FROM skills WHERE name='Docker'), 'beginner'),
(6, (SELECT id FROM skills WHERE name='AWS'), 'beginner');

-- Demo Courses
INSERT IGNORE INTO courses (id, company_id, title, description, difficulty, duration_hours, duration_weeks, certification_provided, certification_name, is_free, price) VALUES
(1, 'comp-demo-001', 'Machine Learning Fundamentals', 'A comprehensive introduction to machine learning algorithms, model training, and evaluation using Python and scikit-learn.', 'intermediate', 40, 8, TRUE, 'TechVision ML Certified', FALSE, 2999),
(2, 'comp-demo-001', 'Advanced Python for Data Science', 'Deep dive into Python for data science including Pandas, NumPy, visualization, and real project work.', 'advanced', 30, 6, TRUE, 'TechVision Python Expert', FALSE, 1999),
(3, 'comp-demo-001', 'Cloud Computing with AWS', 'Learn AWS core services, deployment, and cloud architecture principles with hands-on labs.', 'beginner', 25, 5, TRUE, 'TechVision Cloud Certified', FALSE, 2499),
(4, 'comp-demo-001', 'Docker & Kubernetes Essentials', 'Containerization and orchestration for modern applications. Build, ship, and run anywhere.', 'intermediate', 20, 4, TRUE, 'TechVision DevOps Certified', FALSE, 1499);

-- Demo Course Skills
INSERT IGNORE INTO course_skills (course_id, skill_id, proficiency_covered) VALUES
(1, (SELECT id FROM skills WHERE name='Machine Learning'), 'intermediate'),
(1, (SELECT id FROM skills WHERE name='Python'), 'intermediate'),
(1, (SELECT id FROM skills WHERE name='Data Analysis'), 'intermediate'),
(2, (SELECT id FROM skills WHERE name='Python'), 'advanced'),
(2, (SELECT id FROM skills WHERE name='Data Analysis'), 'advanced'),
(2, (SELECT id FROM skills WHERE name='Pandas'), 'advanced'),
(3, (SELECT id FROM skills WHERE name='AWS'), 'intermediate'),
(3, (SELECT id FROM skills WHERE name='Cloud Computing'), 'intermediate'),
(4, (SELECT id FROM skills WHERE name='Docker'), 'intermediate'),
(4, (SELECT id FROM skills WHERE name='Kubernetes'), 'beginner');

-- Demo Jobs
INSERT IGNORE INTO jobs (id, company_id, title, description, job_type, location, is_remote, salary_min, salary_max, experience_min, department, eligibility, deadline, is_active) VALUES
(1, 'comp-demo-001', 'Python Backend Developer', 'Build scalable backend services using Python, FastAPI, and MySQL. Work with ML pipelines and data engineering workflows.', 'full_time', 'Bangalore', FALSE, 800000, 1400000, 0, 'Computer Science', 'B.Tech/M.Tech in CS/IT. Strong Python skills required.', '2025-03-31', TRUE),
(2, 'comp-demo-001', 'Data Scientist', 'Develop and deploy machine learning models for business intelligence. Strong statistics and Python required.', 'full_time', 'Bangalore', TRUE, 1000000, 1800000, 1, 'Data Science', 'B.Tech/M.Tech/MSc in CS, Statistics, or related. 1+ year experience or strong project portfolio.', '2025-03-15', TRUE),
(3, 'comp-demo-001', 'Full Stack Developer', 'Build end-to-end web applications using React and Node.js. Work on product features from design to deployment.', 'full_time', 'Hyderabad', FALSE, 700000, 1200000, 0, 'Computer Science', 'B.Tech in CS/IT. React and Node.js experience required.', '2025-04-01', TRUE);

-- Demo Job Skills
INSERT IGNORE INTO job_skills (job_id, skill_id, required_proficiency, is_mandatory) VALUES
(1, (SELECT id FROM skills WHERE name='Python'), 'advanced', TRUE),
(1, (SELECT id FROM skills WHERE name='SQL'), 'intermediate', TRUE),
(1, (SELECT id FROM skills WHERE name='Docker'), 'beginner', FALSE),
(2, (SELECT id FROM skills WHERE name='Machine Learning'), 'advanced', TRUE),
(2, (SELECT id FROM skills WHERE name='Python'), 'advanced', TRUE),
(2, (SELECT id FROM skills WHERE name='Data Analysis'), 'advanced', TRUE),
(2, (SELECT id FROM skills WHERE name='Statistics'), 'intermediate', TRUE),
(3, (SELECT id FROM skills WHERE name='React.js'), 'intermediate', TRUE),
(3, (SELECT id FROM skills WHERE name='Node.js'), 'intermediate', TRUE),
(3, (SELECT id FROM skills WHERE name='JavaScript'), 'advanced', TRUE),
(3, (SELECT id FROM skills WHERE name='MySQL'), 'intermediate', FALSE);

-- Demo Internships
INSERT IGNORE INTO internships (id, company_id, title, description, duration_months, location, is_remote, stipend_min, stipend_max, department, eligibility, deadline, is_active) VALUES
(1, 'comp-demo-001', 'ML Research Intern', 'Work alongside our AI research team on NLP and computer vision projects. Build real models for production.', 3, 'Bangalore', FALSE, 15000, 25000, 'Computer Science', '3rd or 4th year B.Tech CS/IT students with Python and ML basics.', '2025-02-28', TRUE),
(2, 'comp-demo-001', 'Cloud Engineering Intern', 'Learn and work on AWS infrastructure, deployment pipelines, and cloud architecture.', 2, 'Remote', TRUE, 10000, 20000, 'Computer Science', '2nd, 3rd or 4th year B.Tech students. Basic Linux and networking knowledge.', '2025-03-15', TRUE);

-- Demo Internship Skills
INSERT IGNORE INTO job_skills (internship_id, skill_id, required_proficiency, is_mandatory) VALUES
(1, (SELECT id FROM skills WHERE name='Machine Learning'), 'intermediate', TRUE),
(1, (SELECT id FROM skills WHERE name='Python'), 'intermediate', TRUE),
(1, (SELECT id FROM skills WHERE name='Data Analysis'), 'beginner', FALSE),
(2, (SELECT id FROM skills WHERE name='AWS'), 'beginner', FALSE),
(2, (SELECT id FROM skills WHERE name='Cloud Computing'), 'beginner', TRUE),
(2, (SELECT id FROM skills WHERE name='Linux'), 'beginner', FALSE);

-- Demo Notifications for student
INSERT IGNORE INTO notifications (user_id, title, message, type) VALUES
('u-student-demo-001', 'Welcome to SkillBridge!', 'Your account has been created. Complete your profile to start discovering opportunities.', 'system'),
('u-student-demo-001', 'New Job Posted', 'TechVision Solutions posted a Python Backend Developer position that matches your skills!', 'job'),
('u-student-demo-001', 'Skill Gap Detected', 'Your industry readiness score can improve! Add Machine Learning to your skill set.', 'skill');

SELECT 'Seed data inserted successfully!' AS status;
