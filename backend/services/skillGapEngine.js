const db = require('../config/firebaseAdmin');

// Proficiency levels mapped to numeric values
const PROFICIENCY_LEVELS = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
const PROFICIENCY_NAMES = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced', 4: 'Expert' };

/**
 * Calculate industry readiness score for a student
 * Returns score (0-100), matched, partial, missing skills, recommended courses, matching jobs
 */
exports.calculateStudentSkillGap = async (studentId) => {
  // Fetch student's skills
  const [studentSkills] = await db.execute(`
    SELECT ss.skill_id, ss.proficiency, s.name as skill_name, s.category
    FROM student_skills ss
    JOIN skills s ON s.id = ss.skill_id
    WHERE ss.student_id = ?
  `, [studentId]);

  // Fetch all industry required skills (aggregate across all companies)
  const [industrySkills] = await db.execute(`
    SELECT is2.skill_id, MAX(is2.required_proficiency) as max_proficiency,
           s.name as skill_name, s.category,
           SUM(CASE WHEN is2.demand_level = 'critical' THEN 4
                    WHEN is2.demand_level = 'high' THEN 3
                    WHEN is2.demand_level = 'medium' THEN 2 ELSE 1 END) as demand_score,
           SUM(CASE WHEN is2.is_mandatory = 1 THEN 1 ELSE 0 END) as mandatory_count,
           COUNT(DISTINCT is2.company_id) as company_count
    FROM industry_skills is2
    JOIN skills s ON s.id = is2.skill_id
    GROUP BY is2.skill_id, s.name, s.category
    ORDER BY demand_score DESC
  `);

  const studentSkillMap = {};
  studentSkills.forEach(s => {
    studentSkillMap[s.skill_id] = { ...s, level: PROFICIENCY_LEVELS[s.proficiency] || 0 };
  });

  const matched = [];
  const partial = [];
  const missing = [];
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const isk of industrySkills) {
    const required = PROFICIENCY_LEVELS[isk.max_proficiency] || 2;
    const weight = isk.demand_score + (isk.mandatory_count * 2);
    totalWeight += weight;

    const studentSkill = studentSkillMap[isk.skill_id];
    if (!studentSkill) {
      missing.push({
        skill_id: isk.skill_id,
        skill_name: isk.skill_name,
        category: isk.category,
        required_proficiency: isk.max_proficiency,
        demand_score: isk.demand_score,
        company_count: isk.company_count
      });
    } else if (studentSkill.level >= required) {
      earnedWeight += weight;
      matched.push({
        skill_id: isk.skill_id,
        skill_name: isk.skill_name,
        category: isk.category,
        student_proficiency: studentSkill.proficiency,
        required_proficiency: isk.max_proficiency,
        demand_score: isk.demand_score
      });
    } else {
      // Partial credit proportional to level achieved
      const partialScore = (studentSkill.level / required) * weight;
      earnedWeight += partialScore;
      partial.push({
        skill_id: isk.skill_id,
        skill_name: isk.skill_name,
        category: isk.category,
        student_proficiency: studentSkill.proficiency,
        required_proficiency: isk.max_proficiency,
        gap_levels: required - studentSkill.level,
        demand_score: isk.demand_score
      });
    }
  }

  const readinessScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  // Get recommended courses for missing/partial skills
  const gapSkillIds = [
    ...missing.map(s => s.skill_id),
    ...partial.map(s => s.skill_id)
  ];

  let recommendedCourses = [];
  if (gapSkillIds.length > 0) {
    const placeholders = gapSkillIds.map(() => '?').join(',');
    const [courses] = await db.execute(`
      SELECT DISTINCT c.id, c.title, c.description, c.difficulty, c.duration_weeks,
             c.certification_provided, c.certification_name, c.is_free, c.price,
             comp.name as company_name, comp.logo_url as company_logo,
             GROUP_CONCAT(s.name SEPARATOR ', ') as covered_skills
      FROM courses c
      JOIN companies comp ON comp.id = c.company_id
      JOIN course_skills cs ON cs.course_id = c.id
      JOIN skills s ON s.id = cs.skill_id
      WHERE cs.skill_id IN (${placeholders}) AND c.is_active = 1
      GROUP BY c.id
      ORDER BY c.difficulty ASC
      LIMIT 6
    `, gapSkillIds);
    recommendedCourses = courses;
  }

  // Get matching jobs
  const [matchingJobs] = await db.execute(`
    SELECT j.id, j.title, j.location, j.salary_min, j.salary_max, j.is_remote, j.deadline,
           comp.name as company_name, comp.logo_url as company_logo,
           'job' as type
    FROM jobs j
    JOIN companies comp ON comp.id = j.company_id
    WHERE j.is_active = 1 AND j.deadline >= CURDATE()
    LIMIT 5
  `);

  return {
    readiness_score: readinessScore,
    total_industry_skills: industrySkills.length,
    matched_count: matched.length,
    partial_count: partial.length,
    missing_count: missing.length,
    skills: { matched, partial, missing },
    recommended_courses: recommendedCourses,
    matching_jobs: matchingJobs
  };
};

/**
 * Calculate college curriculum vs industry gap
 */
exports.calculateCollegeSkillGap = async (collegeId) => {
  // Skills taught in college curriculum (aggregated across all depts)
  const [collegeSkills] = await db.execute(`
    SELECT ss.skill_id, s.name as skill_name, s.category,
           MAX(ss.proficiency_level) as max_proficiency,
           COUNT(DISTINCT sub.id) as subject_count,
           COUNT(DISTINCT d.id) as dept_count,
           d.name as dept_name, d.id as dept_id
    FROM colleges col
    JOIN departments d ON d.college_id = col.id
    JOIN curriculum cur ON cur.department_id = d.id
    JOIN subjects sub ON sub.curriculum_id = cur.id
    JOIN subject_skills ss ON ss.subject_id = sub.id
    JOIN skills s ON s.id = ss.skill_id
    WHERE col.id = ?
    GROUP BY ss.skill_id, s.name, s.category, d.id, d.name
  `, [collegeId]);

  // Industry required skills (all companies, aggregated)
  const [industrySkills] = await db.execute(`
    SELECT is2.skill_id, s.name as skill_name, s.category,
           MAX(is2.required_proficiency) as max_proficiency,
           COUNT(DISTINCT is2.company_id) as company_count,
           SUM(CASE WHEN is2.demand_level='critical' THEN 4 WHEN is2.demand_level='high' THEN 3
                    WHEN is2.demand_level='medium' THEN 2 ELSE 1 END) as demand_score
    FROM industry_skills is2
    JOIN skills s ON s.id = is2.skill_id
    GROUP BY is2.skill_id, s.name, s.category
    ORDER BY demand_score DESC
  `);

  const collegeSkillIds = new Set(collegeSkills.map(s => s.skill_id));

  const covered = industrySkills.filter(s => collegeSkillIds.has(s.skill_id));
  const missing = industrySkills.filter(s => !collegeSkillIds.has(s.skill_id));
  const coverageRate = industrySkills.length > 0
    ? Math.round((covered.length / industrySkills.length) * 100) : 0;

  // Department-wise skill breakdown
  const deptMap = {};
  for (const cs of collegeSkills) {
    if (!deptMap[cs.dept_id]) deptMap[cs.dept_id] = { name: cs.dept_name, skills: [] };
    deptMap[cs.dept_id].skills.push(cs);
  }

  // Emerging/high-demand missing skills
  const emergingGaps = missing.filter(s => s.demand_score >= 6).slice(0, 10);

  return {
    coverage_rate: coverageRate,
    total_industry_skills: industrySkills.length,
    covered_skills: covered.length,
    missing_skills: missing.length,
    covered: covered,
    missing: missing,
    emerging_gaps: emergingGaps,
    departments: Object.values(deptMap)
  };
};

/**
 * Calculate match score between a student and a specific job/internship
 */
exports.calculateJobMatch = async (studentId, jobId, type = 'job') => {
  const table = type === 'job' ? 'jobs' : 'internships';
  const idCol = type === 'job' ? 'job_id' : 'internship_id';

  const [jobSkills] = await db.execute(`
    SELECT js.skill_id, js.required_proficiency, js.is_mandatory, s.name as skill_name
    FROM job_skills js
    JOIN skills s ON s.id = js.skill_id
    WHERE js.${idCol} = ?
  `, [jobId]);

  if (!jobSkills.length) return 100;

  const [studentSkills] = await db.execute(`
    SELECT skill_id, proficiency FROM student_skills WHERE student_id = ?
  `, [studentId]);

  const studentMap = {};
  studentSkills.forEach(s => { studentMap[s.skill_id] = PROFICIENCY_LEVELS[s.proficiency] || 0; });

  let earned = 0, total = 0;
  for (const js of jobSkills) {
    const weight = js.is_mandatory ? 3 : 1;
    const required = PROFICIENCY_LEVELS[js.required_proficiency] || 2;
    total += weight;
    const have = studentMap[js.skill_id] || 0;
    if (have >= required) earned += weight;
    else if (have > 0) earned += (have / required) * weight * 0.5;
  }

  return total > 0 ? Math.round((earned / total) * 100) : 0;
};
