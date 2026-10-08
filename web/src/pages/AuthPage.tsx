import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { Field, Geometry, InlineError } from '../components/ui';
import { ThemeToggle } from '../components/ThemeToggle';
export function AuthPage({ register = false }: { register?: boolean }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => { setError(null); setShowPassword(false); document.title = (register ? 'Create an account' : 'Sign in') + ' — ISMO'; }, [register]);
  if (auth.session) return <Navigate to="/dashboard" replace />;
  const state = location.state as { from?: string; registered?: boolean; email?: string } | null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email')).trim();
    const password = String(data.get('password'));
    setError(null);
    if (register) {
      if (password !== data.get('confirmPassword')) { setError(new Error('Your passwords don’t match. Please enter them again.')); return; }
      if (password.length < 8 || !password.trim()) {
        setError(new Error('Choose a password with at least 8 characters.')); return;
      }
      if (new TextEncoder().encode(password).length > 72) {
        setError(new Error('This password is too long. Please choose a shorter one.')); return;
      }
      if (!String(data.get('fullName')).trim()) { setError(new Error('Please enter your full name.')); return; }
    }
    setBusy(true);
    try {
      if (register) {
        await api.register(String(data.get('fullName')).trim(), email, password);
        navigate('/login', { replace: true, state: { registered: true, email } });
      } else {
        await auth.login(email, password);
        const from = state?.from;
        navigate(from && from.startsWith('/') && !from.startsWith('//') && !/^\/(login|register)/.test(from) ? from : '/dashboard', { replace: true });
      }
    } catch (error) { setError(error); } finally { setBusy(false); }
  }
  return <div className="auth-page"><header className="auth-header"><Link className="brand" to="/login"><Geometry /><span>ISMO <b>/</b> PM</span></Link><ThemeToggle /></header>
    <main className="auth-layout"><section className="auth-story"><span className="eyebrow">A little structure. A lot of possibility.</span><h1>Good work.<br />Taking shape.</h1><p>Bring your projects and tasks together. Know what’s next, and keep things moving.</p><div className="auth-art" aria-hidden="true"><i /><i /><i /><div /></div><span className="auth-caption">Your ideas, with a plan.</span></section>
    <section className="auth-card"><Geometry /><h2>{register ? 'Create your account' : 'Welcome back'}</h2><p>{register ? 'Start organizing your projects in one place.' : 'Sign in to pick up where you left off.'}</p>
      {state?.registered && !register && <p className="success-notice" role="status">Your account is ready. Sign in to get started.</p>}
      {auth.notice && !register && <p className="session-notice" role="status">{auth.notice}</p>}
      <form key={register ? 'register' : 'login'} onSubmit={event => void submit(event)} aria-label={register ? 'Create account' : 'Sign in'}>
        <fieldset disabled={busy}>
          {register && <Field label="Full name"><input name="fullName" autoComplete="name" required maxLength={150} autoFocus /></Field>}
          <Field label="Email"><input name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={state?.email || ''} autoFocus={!register} /></Field>
          <Field label="Password" hint={register ? 'Use at least 8 characters.' : undefined}><div className="password-input"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : undefined} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></Field>
          {register && <Field label="Confirm password"><input name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} /></Field>}
        </fieldset>
        {!!error && <InlineError error={error} />}
        <button className="button primary auth-submit" disabled={busy} type="submit">{busy ? (register ? 'Creating your account…' : 'Signing in…') : (register ? 'Create account' : 'Sign in')}<ArrowRight size={18} /></button>
      </form>
      <p className="auth-switch">{register ? 'Already have an account?' : 'New to ISMO?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>
    </section></main></div>;
}
