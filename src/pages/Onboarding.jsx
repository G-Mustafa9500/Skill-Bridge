import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/userService';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';

const ALL_SKILLS = [
  'Python', 'JavaScript', 'React', 'Node.js', 'CSS', 'Figma', 'SQL',
  'Machine Learning', 'DevOps', 'Flutter', 'Cybersecurity', 'Data Science',
  'UI/UX', 'WordPress', 'Photoshop', 'Excel', 'Writing', 'Video Editing', 'SEO', 'Blockchain',
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [skills, setSkills] = useState([]);
  const [saving, setSaving] = useState(false);
  const { firebaseUser, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  function toggleSkill(s) {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function goNext() {
    if (step === 1 && !name.trim()) {
      showToast('Please enter your display name', 'error');
      return;
    }
    setStep((s) => Math.min(2, s + 1));
  }

  async function finish() {
    if (skills.length === 0) {
      showToast('Select at least one skill', 'error');
      return;
    }
    setSaving(true);
    const { error } = await updateUserProfile(firebaseUser.uid, {
      fullName: name,
      bio,
      city,
      skills,
    });
    setSaving(false);
    if (error) {
      showToast(error, 'error');
      return;
    }
    await refreshProfile();
    showToast('Profile set up! Welcome aboard 🎉', 'success');
    navigate('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-start justify-center px-6 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex items-center gap-2 font-display text-lg font-extrabold">
          <Zap className="text-accent" size={20} /> SkillBridge
        </div>

        <div className="mb-9 flex items-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="relative h-1 flex-1 overflow-hidden rounded-full bg-surface">
              <div
                className={`absolute inset-0 origin-left rounded-full transition-transform duration-300 ${s <= step ? 'scale-x-100' : 'scale-x-0'} ${s < step ? 'bg-accent2' : 'bg-accent'}`}
              />
            </div>
          ))}
          <span className="whitespace-nowrap text-xs text-muted">Step {step} of 2</span>
        </div>

        {step === 1 && (
          <div className="animate-pageIn">
            <h2 className="mb-1.5 text-2xl">Set up your profile</h2>
            <p className="mb-6 text-sm text-muted">Help the community know who you are.</p>
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-muted">Display Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="How should we call you?" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-muted">Bio</label>
                <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell the community about yourself…" className="resize-y" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-muted">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City, Country" />
              </div>
              <button className="btn-primary mt-1 self-start" onClick={goNext}>
                Next <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-pageIn">
            <h2 className="mb-1.5 text-2xl">Your skills</h2>
            <p className="mb-6 text-sm text-muted">Click to select skills you have or want to work with.</p>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSkill(s)}
                  className={`select-none rounded-full border px-3 py-1.5 text-[13px] transition-all ${
                    skills.includes(s)
                      ? 'border-accent bg-accent/20 text-accent shadow-[0_0_8px_rgba(108,99,255,0.2)]'
                      : 'border-border bg-white/5 text-muted'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-2.5">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={15} /> Back
              </button>
              <button className="btn-primary" onClick={finish} disabled={saving}>
                {saving ? <Spinner size={16} /> : <>Looks good! <Check size={15} /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
