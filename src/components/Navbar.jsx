import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Bell, User, Settings, LogOut, LayoutGrid, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { logout } from '../services/authService';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
];

export default function Navbar() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  async function handleLogout() {
    const { error } = await logout();
    if (error) {
      showToast(error, 'error');
      return;
    }
    showToast('Logged out', 'info');
    navigate('/');
  }

  return (
    <nav className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b border-border bg-bg/85 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <div className="flex cursor-pointer items-center gap-2 font-display text-lg font-extrabold" onClick={() => navigate('/dashboard')}>
          <Zap className="text-accent" size={18} /> SkillBridge
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          {LINKS.map((l) => (
            <button
              key={l.to}
              onClick={() => navigate(l.to)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                location.pathname.startsWith(l.to) ? 'bg-white/[0.06] text-text' : 'text-muted hover:bg-white/[0.06] hover:text-text'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-text">
          <Bell size={16} />
        </button>
        <div className="relative" ref={ref}>
          <div
            className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-border font-display text-[13px] font-bold text-white transition-colors hover:border-accent"
            style={{ background: '#6c63ff' }}
            onClick={() => setOpen((o) => !o)}
          >
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} alt="" className="h-full w-full object-cover" />
            ) : (
              getInitials(profile?.fullName)
            )}
          </div>
          {open && (
            <div className="absolute right-0 top-[calc(100%+8px)] min-w-[180px] overflow-hidden rounded-xl border border-border bg-surface shadow-card">
              <button
                onClick={() => {
                  navigate('/profile');
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text hover:bg-white/5"
              >
                <User size={15} /> Profile
              </button>
              <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text hover:bg-white/5">
                <Settings size={15} /> Settings
              </button>
              <hr className="border-border" />
              <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger hover:bg-white/5">
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
