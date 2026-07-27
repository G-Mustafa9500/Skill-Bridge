import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Chrome } from 'lucide-react';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  requestPasswordReset,
} from '../services/authService';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';

const MODES = { LOGIN: 'login', SIGNUP: 'signup', FORGOT: 'forgot' };

export default function AuthPage() {
  const [mode, setMode] = useState(MODES.LOGIN);
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
      <div className="mesh-bg">
        <div className="mesh3" />
      </div>
      <div className="relative z-10 w-full max-w-[420px] rounded-2xl border border-border bg-surface p-9 shadow-card">
        <div
          className="mb-6 flex cursor-pointer items-center justify-center gap-2 font-display text-lg font-extrabold"
          onClick={() => navigate('/')}
        >
          <Zap className="text-accent" size={20} /> SkillBridge
        </div>

        {mode !== MODES.FORGOT && (
          <div className="mb-7 flex gap-1 rounded-[10px] bg-bg p-1">
            <button
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === MODES.LOGIN ? 'bg-surface2 text-text' : 'text-muted'}`}
              onClick={() => setMode(MODES.LOGIN)}
            >
              Login
            </button>
            <button
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === MODES.SIGNUP ? 'bg-surface2 text-text' : 'text-muted'}`}
              onClick={() => setMode(MODES.SIGNUP)}
            >
              Sign Up
            </button>
          </div>
        )}

        {mode === MODES.LOGIN && <LoginForm onForgot={() => setMode(MODES.FORGOT)} />}
        {mode === MODES.SIGNUP && <SignupForm onSuccess={() => navigate('/onboarding')} />}
        {mode === MODES.FORGOT && <ForgotForm onBack={() => setMode(MODES.LOGIN)} />}
      </div>
    </div>
  );
}

function GoogleButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function handleGoogle() {
    setLoading(true);
    const { user, error, isNewUser } = await loginWithGoogle();
    setLoading(false);
    if (error) {
      showToast(error, 'error');
      return;
    }
    showToast(`Welcome, ${user.displayName || 'there'}! 👋`, 'success');
    onSuccess(isNewUser);
  }

  return (
    <button className="btn-secondary w-full" onClick={handleGoogle} disabled={loading}>
      {loading ? <Spinner size={16} /> : <Chrome size={16} />} Continue with Google
    </button>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <div className="mt-0.5 text-xs text-danger">{message}</div>;
}

function LoginForm({ onForgot }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = 'Email required';
    if (!password) nextErrors.password = 'Password required';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    const { user, error } = await loginWithEmail({ email, password });
    setLoading(false);
    if (error) {
      setFormError(error);
      return;
    }
    showToast(`Welcome back, ${user.displayName || 'there'}! 👋`, 'success');
    navigate('/dashboard');
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-muted">Email</label>
        <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <FieldError message={errors.email} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-muted">Password</label>
        <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        <FieldError message={errors.password} />
      </div>
      {formError && <div className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">{formError}</div>}
      <button type="button" onClick={onForgot} className="self-end text-xs text-accent hover:underline">
        Forgot password?
      </button>
      <button className="btn-primary mt-1 w-full" type="submit" disabled={loading}>
        {loading ? <Spinner size={16} /> : 'Sign In'}
      </button>
      <hr className="my-1 border-border" />
      <GoogleButton onSuccess={() => navigate('/dashboard')} />
    </form>
  );
}

function SignupForm({ onSuccess }) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = 'Name required';
    if (!email.includes('@')) nextErrors.email = 'Valid email required';
    if (password.length < 6) nextErrors.password = 'Min 6 characters';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    const { user, error } = await registerWithEmail({ name, email, password });
    setLoading(false);
    if (error) {
      setFormError(error);
      return;
    }
    showToast('Account created! Check your email to verify. 🎉', 'success');
    onSuccess(user);
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-muted">Full Name</label>
        <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <FieldError message={errors.name} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-muted">Email</label>
        <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <FieldError message={errors.email} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-muted">Password</label>
        <input type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        <FieldError message={errors.password} />
      </div>
      {formError && <div className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">{formError}</div>}
      <button className="btn-primary mt-1 w-full" type="submit" disabled={loading}>
        {loading ? <Spinner size={16} /> : 'Create Account'}
      </button>
      <hr className="my-1 border-border" />
      <GoogleButton onSuccess={() => onSuccess()} />
    </form>
  );
}

function ForgotForm({ onBack }) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setFormError('Email required');
      return;
    }
    setLoading(true);
    const { error } = await requestPasswordReset(email);
    setLoading(false);
    if (error) {
      setFormError(error);
      return;
    }
    setSent(true);
    showToast('Reset link sent — check your inbox.', 'success');
  }

  return (
    <div className="flex flex-col gap-3.5">
      <h2 className="text-lg font-semibold">Reset your password</h2>
      <p className="text-sm text-muted">Enter your email and we'll send you a reset link.</p>
      {!sent ? (
        <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          {formError && <div className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">{formError}</div>}
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? <Spinner size={16} /> : 'Send Reset Link'}
          </button>
        </form>
      ) : (
        <div className="rounded-md bg-accent2/10 px-3 py-2 text-sm text-accent2">
          Check your inbox for the reset link.
        </div>
      )}
      <button type="button" onClick={onBack} className="self-center text-xs text-muted hover:text-text">
        ← Back to login
      </button>
    </div>
  );
}
