-- SkillBridge Database Schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS skillbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skillbridge;

-- ============================================================
-- USERS (shared auth table)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','college','industry') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- MASTER SKILLS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- COLLEGES
-- ============================================================
CREATE TABLE IF NOT EXISTS colleges (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),
  type ENUM('engineering','arts','science','management','medical','other') DEFAULT 'engineering',
  affiliation VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  website VARCHAR(255),
  phone VARCHAR(20),
  logo_url VARCHAR(500),
  established_year INT,
  about TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20),
  degree ENUM('B.Tech','M.Tech','BCA','MCA','BSc','MSc','MBA','BBA','PhD','Other') DEFAULT 'B.Tech',
  total_students INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender ENUM('male','female','other','prefer_not_to_say'),
  college_id VARCHAR(36),
  department_id INT,
  degree VARCHAR(100),
  graduation_year INT,
  cgpa DECIMAL(4,2),
  resume_url VARCHAR(500),
  profile_photo_url VARCHAR(500),
  linkedin_url VARCHAR(500),
  github_url VARCHAR(500),
  portfolio_url VARCHAR(500),
  bio TEXT,
  is_open_to_work BOOLEAN DEFAULT TRUE,
  city VARCHAR(100),
  state VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ============================================================
-- COMPANIES (Industry)
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  industry_sector VARCHAR(100),
  company_size ENUM('1-50','51-200','201-500','501-1000','1000+') DEFAULT '51-200',
  founded_year INT,
  website VARCHAR(255),
  phone VARCHAR(20),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  logo_url VARCHAR(500),
  about TEXT,
  linkedin_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- STUDENT SKILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS student_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  skill_id INT NOT NULL,
  proficiency ENUM('beginner','intermediate','advanced','expert') DEFAULT 'beginner',
  years_of_experience DECIMAL(3,1) DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_skill (student_id, skill_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- ============================================================
-- INDUSTRY SKILLS (skills a company requires)
-- ============================================================
CREATE TABLE IF NOT EXISTS industry_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  skill_id INT NOT NULL,
  required_proficiency ENUM('beginner','intermediate','advanced','expert') DEFAULT 'intermediate',
  is_mandatory BOOLEAN DEFAULT TRUE,
  demand_level ENUM('low','medium','high','critical') DEFAULT 'high',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_company_skill (company_id, skill_id),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- ============================================================
-- CURRICULUM
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  semester INT,
  academic_year VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- ============================================================
-- SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  curriculum_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  credits INT DEFAULT 3,
  semester INT,
  is_core BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE CASCADE
);

-- ============================================================
-- SUBJECT SKILLS (skills taught by a subject)
-- ============================================================
CREATE TABLE IF NOT EXISTS subject_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  skill_id INT NOT NULL,
  proficiency_level ENUM('beginner','intermediate','advanced') DEFAULT 'intermediate',
  UNIQUE KEY unique_subject_skill (subject_id, skill_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- ============================================================
-- COURSES (Industry-published)
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty ENUM('beginner','intermediate','advanced') DEFAULT 'intermediate',
  duration_hours INT,
  duration_weeks INT,
  eligibility TEXT,
  certification_provided BOOLEAN DEFAULT TRUE,
  certification_name VARCHAR(255),
  course_url VARCHAR(500),
  is_free BOOLEAN DEFAULT FALSE,
  price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  thumbnail_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- ============================================================
-- COURSE SKILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS course_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  skill_id INT NOT NULL,
  proficiency_covered ENUM('beginner','intermediate','advanced') DEFAULT 'intermediate',
  UNIQUE KEY unique_course_skill (course_id, skill_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- ============================================================
-- JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  job_type ENUM('full_time','part_time','contract','freelance') DEFAULT 'full_time',
  location VARCHAR(255),
  is_remote BOOLEAN DEFAULT FALSE,
  salary_min INT,
  salary_max INT,
  experience_min INT DEFAULT 0,
  experience_max INT,
  department VARCHAR(100),
  eligibility TEXT,
  deadline DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- ============================================================
-- INTERNSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS internships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_months INT,
  location VARCHAR(255),
  is_remote BOOLEAN DEFAULT FALSE,
  stipend_min INT DEFAULT 0,
  stipend_max INT DEFAULT 0,
  department VARCHAR(100),
  eligibility TEXT,
  start_date DATE,
  deadline DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- ============================================================
-- JOB SKILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS job_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT,
  internship_id INT,
  skill_id INT NOT NULL,
  required_proficiency ENUM('beginner','intermediate','advanced','expert') DEFAULT 'intermediate',
  is_mandatory BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  job_id INT,
  internship_id INT,
  status ENUM('applied','under_review','shortlisted','interview','selected','rejected') DEFAULT 'applied',
  cover_letter TEXT,
  resume_url VARCHAR(500),
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE KEY unique_application_job (student_id, job_id),
  UNIQUE KEY unique_application_intern (student_id, internship_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE
);

-- ============================================================
-- CERTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS certifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  issuer VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  credential_id VARCHAR(255),
  credential_url VARCHAR(500),
  skill_ids JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  tech_stack JSON,
  github_url VARCHAR(500),
  live_url VARCHAR(500),
  start_date DATE,
  end_date DATE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('application','job','course','skill','system','connection') DEFAULT 'system',
  reference_id VARCHAR(100),
  reference_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- COLLEGE-COMPANY CONNECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS college_company_connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id VARCHAR(36) NOT NULL,
  company_id VARCHAR(36) NOT NULL,
  status ENUM('pending','accepted','rejected') DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_connection (college_id, company_id),
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_student_skills_student ON student_skills(student_id);
CREATE INDEX idx_industry_skills_company ON industry_skills(company_id);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_active ON jobs(is_active);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
