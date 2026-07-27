import { useNavigate } from 'react-router-dom';
import { Zap, FileEdit, Target, CheckCircle2 } from 'lucide-react';

const STATS = [
  { num: '2,847', label: 'Problems Solved' },
  { num: '1,203', label: 'Helpers Active' },
  { num: '94%', label: 'Success Rate' },
  { num: '48', label: 'Skills Covered' },
];

const HOW_IT_WORKS = [
  { step: 1, icon: FileEdit, title: 'Post a Request', desc: 'Describe your problem, set urgency, and let our AI help you craft the perfect post.' },
  { step: 2, icon: Target, title: 'Get Matched', desc: 'Our system connects you with skilled community members who can help.' },
  { step: 3, icon: CheckCircle2, title: 'Solve Together', desc: 'Collaborate, comment, and mark the request solved when done. Build trust.' },
];

const MARQUEE_SKILLS = ['Python', 'UI/UX', 'React', 'Data Science', 'DevOps', 'Figma', 'SQL', 'Machine Learning', 'Node.js', 'Flutter', 'Cybersecurity', 'Blockchain'];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden">
      <div className="mesh-bg">
        <div className="mesh3" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-16 pt-20 text-center">
        <span className="mb-5 inline-block rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
          🚀 Community-Powered Learning
        </span>
        <h1 className="mb-5 bg-gradient-to-br from-text via-text to-accent bg-clip-text text-[clamp(42px,8vw,80px)] font-extrabold leading-[1.05] text-transparent">
          Where Skills
          <br />
          Meet Purpose
        </h1>
        <p className="mx-auto mb-9 max-w-lg text-[clamp(16px,3vw,20px)] text-muted">
          Post a problem. Find your people. Solve together.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button className="btn-primary text-base px-7 py-3.5" onClick={() => navigate('/auth')}>
            Get Started Free
          </button>
          <button className="btn-secondary text-base px-7 py-3.5" onClick={() => navigate('/auth')}>
            Explore Requests
          </button>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-4 flex max-w-4xl flex-wrap justify-center gap-5 px-6">
        {STATS.map((s) => (
          <div key={s.label} className="min-w-[160px] flex-1 rounded border border-border bg-surface p-5 text-center shadow-[0_0_0_1px_rgba(108,99,255,0.1)]">
            <span className="block font-display text-2xl font-extrabold text-accent">{s.num}</span>
            <span className="mt-1 block text-xs text-muted">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="mb-12 text-4xl">How It Works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="relative rounded border border-border bg-surface p-8 px-6">
              <div className="absolute -left-2.5 -top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-accent font-display text-xs font-bold text-white">
                {step}
              </div>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/15">
                <Icon size={24} className="text-accent" />
              </div>
              <h3 className="mb-2 text-lg">{title}</h3>
              <p className="text-sm text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 overflow-hidden py-10">
        <div className="flex w-max animate-[marquee_20s_linear_infinite] gap-3">
          {[...MARQUEE_SKILLS, ...MARQUEE_SKILLS].map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-4 py-2 text-[13px] text-muted">
              <Zap size={11} className="text-accent" /> {s}
            </span>
          ))}
        </div>
      </div>

      <footer className="relative z-10 border-t border-border px-6 py-6 text-center text-[13px] text-muted">
        <p>© {new Date().getFullYear()} SkillBridge · Built for the community, by the community</p>
      </footer>
    </div>
  );
}
