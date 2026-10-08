import { CheckSquare, Folder, LayoutGrid, LogOut, Menu, X } from './icons';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { errorMessage } from '../lib/api';
import { Geometry } from './ui';
import { ThemeToggle } from './ThemeToggle';
const links = [{ to: '/dashboard', label: 'Dashboard', icon: LayoutGrid }, { to: '/projects', label: 'Projects', icon: Folder }, { to: '/tasks', label: 'Tasks', icon: CheckSquare }];
export function Shell() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setOpen(false); setError('');
    document.title = (location.pathname.startsWith('/projects') ? 'Projects' : location.pathname.startsWith('/tasks') ? 'Tasks' : 'Dashboard') + ' — Workframe';
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  async function signOut() {
    setBusy(true); setError('');
    try { await logout(); } catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }
  const user = session!.user;
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a>
    {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <aside id="sidebar" className={'sidebar ' + (open ? 'is-open' : '')} aria-label="Workspace navigation">
      <NavLink to="/dashboard" className="brand"><Geometry /><span>Workframe</span></NavLink>
      <nav>{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setOpen(false)}><Icon size={20} /><span>{label}</span></NavLink>)}</nav>
      <div className="account"><div className="account-person"><span className="avatar" aria-hidden="true">{user.fullName.split(/\s+/).map(x => x[0]).slice(0, 2).join('')}</span><div><strong title={user.fullName}>{user.fullName}</strong><small title={user.email}>{user.email}</small></div></div>
        <button className="button signout" onClick={() => void signOut()} disabled={busy}><LogOut size={17} />{busy ? 'Signing out…' : 'Sign out'}</button>{error && <p role="alert" className="logout-error">{error}</p>}</div>
    </aside>
    <header className="topbar"><div className="topbar-context"><button className="icon-button menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="sidebar" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button><span className="topbar-title">Projects &amp; tasks</span><span className="topbar-note">Make room for good work.</span></div><ThemeToggle /></header>
    <main id="main-content" tabIndex={-1} className="main-content"><Outlet /></main>
  </div>;
}
