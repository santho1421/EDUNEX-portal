import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getStudents } from '../../api/college';
import { getAllSkills } from '../../api/skills';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { getCollectionData } from '../../services/firebaseDb';

// Mock industry demand data to match against (since backend is missing)
const MOCK_INDUSTRY_DEMAND = [
  { name: 'React', demand: 95 },
  { name: 'Node.js', demand: 88 },
  { name: 'Python', demand: 92 },
  { name: 'Java', demand: 85 },
  { name: 'Machine Learning', demand: 80 },
  { name: 'AWS', demand: 75 },
  { name: 'Docker', demand: 70 },
  { name: 'SQL', demand: 82 },
  { name: 'Communication', demand: 90 },
  { name: 'Problem Solving', demand: 95 }
];

export default function CollegeSkillGap() {
  const [students, setStudents] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [studentSkillsCache, setStudentSkillsCache] = useState({}); // studentId -> skills array
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('student_analysis'); // overview, missing, covered, student_analysis
  
  // Filtering state for student analysis
  const [filterMode, setFilterMode] = useState('all'); // all, dept, individual
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  useEffect(() => {
    Promise.all([
      getStudents(),
      getAllSkills()
    ]).then(async ([stuRes, skillRes]) => {
      const studs = (stuRes.data.data || []).filter(s => s.verified);
      setStudents(studs);
      setAllSkills(skillRes.data.data || []);
      
      // Fetch skills for all verified students
      const cache = {};
      for (const s of studs) {
        try {
          const sData = await getCollectionData(`users/${s.id}/skills`);
          cache[s.id] = sData || [];
        } catch (e) {
          cache[s.id] = [];
        }
      }
      setStudentSkillsCache(cache);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Skill Gap Analysis"><div style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 48, height: 48, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />Loading skill datasets...</div></DashboardLayout>;

  // Compute selected students based on filters
  let filteredStudents = students;
  if (filterMode === 'dept' && selectedDept) {
    filteredStudents = students.filter(s => s.department === selectedDept);
  } else if (filterMode === 'individual' && selectedStudentIds.length > 0) {
    filteredStudents = students.filter(s => selectedStudentIds.includes(s.id));
  }

  // Aggregate skills for selected students
  const aggregatedSkills = {}; // skillName -> count
  filteredStudents.forEach(s => {
    const sSkills = studentSkillsCache[s.id] || [];
    sSkills.forEach(sk => {
      const name = sk.skill_name || sk.name;
      if (name) {
        aggregatedSkills[name] = (aggregatedSkills[name] || 0) + 1;
      }
    });
  });

  // Calculate gaps against mock industry demand
  const totalStudents = filteredStudents.length;
  const analysisResult = MOCK_INDUSTRY_DEMAND.map(ind => {
    const studentCount = aggregatedSkills[ind.name] || 0;
    const coveragePercent = totalStudents === 0 ? 0 : Math.round((studentCount / totalStudents) * 100);
    return {
      skill: ind.name,
      industryDemand: ind.demand,
      studentCoverage: coveragePercent,
      gap: Math.max(0, ind.demand - coveragePercent)
    };
  }).sort((a, b) => b.gap - a.gap); // Sort by biggest gap

  const topMissing = analysisResult.filter(a => a.gap > 20);
  const topCovered = analysisResult.filter(a => a.studentCoverage >= a.industryDemand - 10);

  const radarData = analysisResult.slice(0, 6).map(r => ({
    subject: r.skill,
    "Industry Demand": r.industryDemand,
    "Student Coverage": r.studentCoverage,
    fullMark: 100
  }));

  const departments = Array.from(new Set(students.map(s => s.department).filter(Boolean)));

  const handleStudentSelect = (id) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(i => i !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  return (
    <DashboardLayout title="Advanced Skill Gap Analysis" subtitle="Analyze student skills against real-time industry demands">
      
      {/* Filters Section */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', background: 'var(--bg-surface)' }}>
        <h4 style={{ marginBottom: 'var(--space-4)' }}>Analysis Scope</h4>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Filter Mode</label>
            <select className="form-select" value={filterMode} onChange={e => setFilterMode(e.target.value)}>
              <option value="all">All Verified Students ({students.length})</option>
              <option value="dept">By Department</option>
              <option value="individual">Specific Student(s)</option>
            </select>
          </div>
          
          {filterMode === 'dept' && (
            <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label">Select Department</label>
              <select className="form-select" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                <option value="">Choose...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
        </div>

        {filterMode === 'individual' && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label">Select Students</label>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)' }}>
              {students.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', background: selectedStudentIds.includes(s.id) ? 'var(--bg-glass)' : 'transparent' }}>
                  <input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={() => handleStudentSelect(s.id)} style={{ width: 16, height: 16 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.name || s.first_name + ' ' + s.last_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.department || 'No Dept'} • {s.degree}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <h3 style={{ margin: 0 }}>Results for {filteredStudents.length} selected student(s)</h3>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {[['student_analysis', '📊 Radar Analysis'], ['missing', '🔴 Missing Skills'], ['covered', '🟢 Covered Skills']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: '1px solid', borderColor: activeTab === tab ? 'transparent' : 'var(--border-default)', background: activeTab === tab ? 'var(--gradient-primary)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--text-secondary)', transition: 'all 0.2s' }}>{label}</button>
          ))}
        </div>
      </div>

      {activeTab === 'student_analysis' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          <div className="card">
            <h4 style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>Skill Coverage vs Industry Demand</h4>
            {filteredStudents.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Select students to view analysis</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="var(--border-subtle)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <Radar name="Industry Demand" dataKey="Industry Demand" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                  <Radar name="Student Coverage" dataKey="Student Coverage" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                  <Legend />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h4 style={{ margin: 0 }}>Analysis Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div style={{ background: 'rgba(244,63,94,0.1)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-danger)' }}>{topMissing.length}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Critical Skill Gaps</div>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.1)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>{topCovered.length}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Well-Covered Skills</div>
              </div>
            </div>
            
            <h5 style={{ margin: 'var(--space-4) 0 0' }}>Highest Priority Gaps</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {topMissing.slice(0, 3).map(m => (
                <div key={m.skill} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontWeight: 600 }}>{m.skill}</span>
                  <span style={{ color: 'var(--color-danger)' }}>{m.gap}% Gap</span>
                </div>
              ))}
              {topMissing.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No critical gaps found!</span>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'missing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {analysisResult.filter(a => a.gap > 0).map((s, i) => (
            <div key={i} className="card" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', borderColor: 'rgba(244,63,94,0.2)' }}>
              <div style={{ width: 44, height: 44, background: 'rgba(244,63,94,0.12)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>✗</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.skill}</span>
                  <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>{s.gap}% Gap</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Industry demands {s.industryDemand}% • Students have {s.studentCoverage}%</span>
              </div>
              <div style={{ width: '200px', height: '6px', background: 'var(--bg-base)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${s.studentCoverage}%`, height: '100%', background: 'var(--color-success)' }} />
              </div>
            </div>
          ))}
          {analysisResult.filter(a => a.gap > 0).length === 0 && <p style={{ color: 'var(--text-muted)' }}>No gaps found!</p>}
        </div>
      )}

      {activeTab === 'covered' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {topCovered.map((s, i) => (
            <div key={i} className="card" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', borderColor: 'rgba(16,185,129,0.2)' }}>
              <div style={{ width: 44, height: 44, background: 'rgba(16,185,129,0.12)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>✓</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.skill}</span>
                  <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Well Covered</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Students possess {s.studentCoverage}% coverage • Industry demands {s.industryDemand}%</span>
              </div>
              <span className="skill-tag skill-matched">Strong Match</span>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
