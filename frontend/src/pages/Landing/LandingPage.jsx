import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.jpeg';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#for-students', label: 'Students' },
  { href: '#for-colleges', label: 'Colleges' },
  { href: '#for-industry', label: 'Industry' },
];

const FEATURES = [
  { icon: '⚡', title: 'Skill Gap Engine', desc: 'Real-time calculation of your industry readiness score based on live database data.', color: 'var(--color-primary)' },
  { icon: '🎓', title: 'Course Recommendations', desc: 'Automatically matched courses for your exact missing skills from top companies.', color: 'var(--cyan-500)' },
  { icon: '💼', title: 'Smart Job Matching', desc: 'Jobs and internships ranked by your personal skill match percentage.', color: 'var(--color-success)' },
  { icon: '📊', title: 'Curriculum Analytics', desc: 'Colleges discover which skills are missing from their departments in real-time.', color: 'var(--color-warning)' },
  { icon: '🔍', title: 'Talent Discovery', desc: 'Companies search and find students by skill, department, CGPA and readiness.', color: 'var(--color-danger)' },
  { icon: '🔔', title: 'Live Notifications', desc: 'Real-time updates on applications, opportunities, and skill alerts.', color: '#a78bfa' },
];

const STEPS = [
  { step: '01', role: 'Industry', action: 'Defines required skills and posts jobs', icon: '🏢', color: '#10b981' },
  { step: '02', role: 'Platform', action: 'Calculates skill gaps and generates recommendations', icon: '⬡', color: '#8b5cf6' },
  { step: '03', role: 'Student', action: 'Views gaps, takes recommended courses, applies to jobs', icon: '👤', color: '#06b6d4' },
  { step: '04', role: 'College', action: 'Improves curriculum based on industry demand data', icon: '🏛️', color: '#f59e0b' },
];

export default function LandingPage() {
  const [stats, setStats] = useState({ students: 12450, colleges: 450, companies: 850, active_jobs: 3200 });
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    // Timeout ensures DOM elements are rendered before observing
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('.scroll-reveal');
      elements.forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ── Navbar ── */}
      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400, 
        height: 64, display: 'flex', alignItems: 'center',
        background: scrolled ? 'var(--bg-nav)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? 'var(--border-subtle)' : 'rgba(255, 255, 255, 0.05)'}`,
        transition: 'background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.35rem' }}>
            <img src={logo} alt="Logo" style={{ width: 36, height: 36, background: '#fff', borderRadius: 'var(--radius-md)', padding: '2px', objectFit: 'contain' }} />
            <span className="text-gradient">EduNex</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} style={{ padding: '0.45rem 0.875rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.target.style.color = 'var(--text-primary)'; e.target.style.background = 'var(--bg-glass)'; }}
                onMouseLeave={e => { e.target.style.color = 'var(--text-secondary)'; e.target.style.background = 'transparent'; }}>
                {l.label}
              </a>
            ))}
            <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginLeft: 8 }}>
                <Link to={`/${user.role}/dashboard`} className="btn btn-primary btn-sm">Dashboard</Link>
                <button onClick={logout} className="btn btn-outline btn-sm">Sign Out</button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm" style={{ marginLeft: 8 }}>Sign In</Link>
                <Link to="/signup/student" className="btn btn-primary btn-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', background: 'var(--gradient-hero)', paddingTop: 80, overflow: 'hidden' }}>
        {/* Glows */}
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="animate-slide-up">


            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 'var(--space-6)', letterSpacing: '-0.02em' }}>
              Bridge the Gap Between
              <br />
              <span className="text-gradient">Talent, Education</span>
              <br />
              <span style={{ color: 'var(--text-primary)' }}>& Industry.</span>
            </h1>

            <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'var(--text-secondary)', maxWidth: 620, margin: '0 auto var(--space-10)', lineHeight: 1.7 }}>
              Discover the skills industries need, identify skill gaps, improve curriculum, and connect talent with real opportunities.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-16)' }}>
              {user ? (
                <>
                  <Link to={`/${user.role}/dashboard`} className="btn btn-primary btn-xl">
                    Go to Dashboard
                  </Link>
                  <button onClick={logout} className="btn btn-secondary btn-xl">
                    Sign Out to Switch Accounts
                  </button>
                </>
              ) : (
                <>
                  <Link to="/signup/student" className="btn btn-primary btn-xl">
                    🎓 I'm a Student
                  </Link>
                  <Link to="/signup/college" className="btn btn-secondary btn-xl">
                    🏛️ I'm a College
                  </Link>
                  <Link to="/signup/industry" className="btn btn-outline btn-xl">
                    🏢 I'm a Company
                  </Link>
                </>
              )}
            </div>

            {/* Ecosystem Visual */}
            <div className="scroll-reveal delay-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-12)' }}>
              {[
                { label: 'STUDENT', icon: '👤', color: '#06b6d4' },
                { label: '↔', icon: null, color: 'var(--text-faint)', isArrow: true },
                { label: 'PLATFORM', icon: '⬡', color: '#8b5cf6' },
                { label: '↔', icon: null, color: 'var(--text-faint)', isArrow: true },
                { label: 'COLLEGE', icon: '🏛️', color: '#f59e0b' },
                { label: '↔', icon: null, color: 'var(--text-faint)', isArrow: true },
                { label: 'INDUSTRY', icon: '🏢', color: '#10b981' },
              ].map((item, i) => item.isArrow ? (
                <span key={i} style={{ color: 'var(--text-faint)', fontSize: '1.5rem', fontWeight: 300 }}>↔</span>
              ) : (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 64, height: 64, background: `${item.color}18`, border: `2px solid ${item.color}40`, borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', boxShadow: `0 0 24px ${item.color}20` }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: item.color }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Platform Stats */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
              {[
                { value: stats.students || '0', label: 'Students' },
                { value: stats.colleges || '0', label: 'Colleges' },
                { value: stats.companies || '0', label: 'Companies' },
                { value: stats.active_jobs || '0', label: 'Active Jobs' },
              ].map((s, i) => (
                <div key={i} className={`scroll-reveal delay-${i + 2}`} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-display)' }} className="text-gradient">{s.value}+</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Skill Gap Problem Section ── */}
      <section style={{ padding: 'var(--space-24) 0', background: 'var(--bg-base)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto', padding: '0 var(--space-6)' }}>
          <div className="scroll-reveal">
            <div className="badge badge-danger" style={{ marginBottom: 'var(--space-5)' }}>The Problem</div>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>The <span className="text-gradient">Skill Gap Crisis</span> in India</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.8, marginBottom: 'var(--space-10)' }}>
              Over 50% of engineering graduates in India are not directly employable due to misalignment between college curricula and industry requirements. Companies struggle to find talent, while qualified students miss opportunities — because neither side has the right data.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-5)' }}>
            {[
              { value: '51%', label: 'Graduates not industry-ready', color: 'var(--color-danger)' },
              { value: '3.7M', label: 'Annual engineering graduates', color: 'var(--color-warning)' },
              { value: '40%', label: 'Curriculum-industry skill mismatch', color: 'var(--color-primary)' },
            ].map((s, i) => (
              <div key={i} className={`card scroll-reveal delay-${i + 1}`} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: s.color, marginBottom: 8 }}>{s.value}</div>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ padding: 'var(--space-24) 0', background: 'var(--bg-elevated)' }}>
        <div className="container">
          <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <div className="badge badge-violet" style={{ marginBottom: 'var(--space-4)' }}>Process</div>
            <h2>How <span className="text-gradient">EduNex</span> Works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
            {STEPS.map((s, i) => (
              <div key={i} className={`card scroll-reveal delay-${i + 1}`} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: s.color, marginBottom: 12 }}>STEP {s.step}</div>
                <div style={{ width: 64, height: 64, background: `${s.color}15`, border: `2px solid ${s.color}30`, borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto var(--space-5)' }}>{s.icon}</div>
                <h4 style={{ color: s.color, marginBottom: 8 }}>{s.role}</h4>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>{s.action}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section style={{ padding: 'var(--space-24) 0', background: 'var(--bg-base)' }}>
        <div className="container">
          <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <div className="badge badge-cyan" style={{ marginBottom: 'var(--space-4)' }}>Platform Features</div>
            <h2>Powered by <span className="text-gradient">Skill Intelligence</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
            {FEATURES.map((f, i) => (
              <div key={i} className={`card scroll-reveal delay-${(i % 3) + 1}`}>
                <div style={{ width: 52, height: 52, background: `${f.color}15`, border: `1px solid ${f.color}30`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 'var(--space-5)' }}>{f.icon}</div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>{f.title}</h4>
                <p style={{ fontSize: '0.875rem', margin: 0, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Students ── */}
      <section id="for-students" style={{ padding: 'var(--space-24) 0', background: 'var(--bg-elevated)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)', alignItems: 'center' }}>
            <div className="scroll-reveal">
              <div className="badge badge-cyan" style={{ marginBottom: 'var(--space-5)' }}>For Students</div>
              <h2 style={{ marginBottom: 'var(--space-5)' }}>Know Exactly <span className="text-gradient">Where You Stand</span></h2>
              <p style={{ marginBottom: 'var(--space-8)', lineHeight: 1.8 }}>Get your personal Industry Readiness Score, discover which skills you're missing, and receive course recommendations tailored to your exact gaps.</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {['📊 Real-time Industry Readiness Score', '⚡ Personalized skill gap analysis', '🎓 Recommended courses for missing skills', '💼 Jobs matched to your skill level', '📋 Track all your applications in one place'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--color-success)' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link to="/signup/student" className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-8)' }}>Start as Student →</Link>
            </div>
            {/* Skill gap demo card */}
            <div className="card scroll-reveal delay-2" style={{ background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
                <h4>Industry Readiness</h4>
                <span style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-display)' }} className="text-gradient">65%</span>
              </div>
              <div className="progress-wrapper" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="progress-track"><div className="progress-fill" style={{ width: '65%' }} /></div>
              </div>
              {[{ name: 'Python', status: 'partial', label: 'Intermediate → Advanced' }, { name: 'Machine Learning', status: 'missing', label: 'Missing' }, { name: 'SQL', status: 'partial', label: 'Beginner → Intermediate' }, { name: 'HTML/CSS', status: 'matched', label: 'Matched ✓' }].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < 3 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</span>
                  <span className={`skill-tag skill-${s.status}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── For Colleges ── */}
      <section id="for-colleges" style={{ padding: 'var(--space-24) 0', background: 'var(--bg-base)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)', alignItems: 'center' }}>
            <div className="card scroll-reveal delay-1">
              <h4 style={{ marginBottom: 'var(--space-5)' }}>Curriculum vs Industry Demand</h4>
              {[{ skill: 'Machine Learning', curriculum: 40, industry: 95 }, { skill: 'Cloud Computing', curriculum: 30, industry: 88 }, { skill: 'React.js', curriculum: 55, industry: 82 }, { skill: 'Docker', curriculum: 20, industry: 75 }].map((item, i) => (
                <div key={i} style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.skill}</span>
                    <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>Gap: {item.industry - item.curriculum}%</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', width: 70 }}>Curriculum</span>
                      <div className="progress-track" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${item.curriculum}%`, background: 'var(--gradient-cyan)' }} /></div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--cyan-400)', width: 30, textAlign: 'right' }}>{item.curriculum}%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', width: 70 }}>Industry</span>
                      <div className="progress-track" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${item.industry}%` }} /></div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--violet-400)', width: 30, textAlign: 'right' }}>{item.industry}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="scroll-reveal delay-2">
              <div className="badge badge-violet" style={{ marginBottom: 'var(--space-5)' }}>For Colleges</div>
              <h2 style={{ marginBottom: 'var(--space-5)' }}>Data-Driven <span className="text-gradient">Curriculum Planning</span></h2>
              <p style={{ marginBottom: 'var(--space-8)', lineHeight: 1.8 }}>See exactly which skills industries demand vs. what you're teaching. Identify curriculum gaps at the department level and make evidence-based curriculum improvements.</p>
              <Link to="/signup/college" className="btn btn-primary btn-lg">Start as College →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── For Industry ── */}
      <section id="for-industry" style={{ padding: 'var(--space-24) 0', background: 'var(--bg-elevated)' }}>
        <div className="container">
          <div className="scroll-reveal" style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <div className="badge badge-success" style={{ marginBottom: 'var(--space-4)' }}>For Industry</div>
            <h2>Find Talent That <span className="text-gradient">Matches Your Stack</span></h2>
            <p style={{ maxWidth: 560, margin: '0 auto' }}>Define your required skills, post jobs, publish courses, and discover students ready for your team — all from one dashboard.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-5)' }}>
            {['Post jobs with required skills', 'Search talent by skill & readiness score', 'Publish courses to bridge skill gaps', 'View college skill analytics', 'Shortlist and track applicants', 'Connect with institutions directly'].map((f, i) => (
              <div key={i} className={`scroll-reveal delay-${(i % 3) + 1}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
                <span style={{ color: 'var(--color-success)', fontSize: '1.2rem' }}>✓</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{f}</span>
              </div>
            ))}
          </div>
          <div className="scroll-reveal delay-3" style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
            <Link to="/signup/industry" className="btn btn-primary btn-xl">Start as Company →</Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: 'var(--space-24) 0', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, background: 'rgba(124,58,237,0.12)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
        <div className="container scroll-reveal" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ marginBottom: 'var(--space-5)' }}>Ready to <span className="text-gradient">Bridge the Gap?</span></h2>
          <p style={{ fontSize: '1.05rem', marginBottom: 'var(--space-10)', maxWidth: 480, margin: '0 auto var(--space-10)' }}>Join thousands of students, colleges, and companies already using EduNex to close the skill gap.</p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <>
                <Link to={`/${user.role}/dashboard`} className="btn btn-primary btn-xl">Go to Dashboard</Link>
                <button onClick={logout} className="btn btn-secondary btn-xl">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/signup/student" className="btn btn-primary btn-xl">Join as Student</Link>
                <Link to="/login" className="btn btn-secondary btn-xl">Sign In</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)', padding: 'var(--space-8) 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontWeight: 700 }}>
            <img src={logo} alt="Logo" style={{ width: 28, height: 28, background: '#fff', borderRadius: 'var(--radius-md)', padding: '2px', objectFit: 'contain' }} />
            <span className="text-gradient">EduNex</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-faint)', margin: 0 }}>EduNex · Skill Gap Intelligence Platform</p>
          <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
            <Link to="/signup/student" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Students</Link>
            <Link to="/signup/college" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Colleges</Link>
            <Link to="/signup/industry" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Industry</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
