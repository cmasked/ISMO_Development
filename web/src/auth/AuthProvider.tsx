import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Session } from '../types';
import { api, errorMessage } from '../lib/api';
import { readSession, saveSession, SESSION_KEY } from '../lib/session';
import { ErrorState, Loading } from '../components/ui';
interface Auth {
  session: Session | null; checking: boolean; error: string; notice: string;
  login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; retry: () => void;
}
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [session, setSession] = useState<Session | null>(() => {
    const stored = readSession();
    if (stored && Date.parse(stored.expiresAt) <= Date.now()) { saveSession(null); return null; }
    return stored;
  });
  const [checking, setChecking] = useState(!!session);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const clear = useCallback((expired = false) => {
    saveSession(null); setSession(null); setChecking(false); setError('');
    setNotice(expired ? 'Your session has expired. Please sign in to continue.' : '');
    client.clear();
  }, [client]);
  useEffect(() => {
    const expire = () => clear(true);
    const storage = (event: StorageEvent) => {
      if (event.key !== SESSION_KEY && event.key !== null) return;
      const next = readSession();
      // Clear the in-memory fallback as well when another tab signs out.
      saveSession(next && Date.parse(next.expiresAt) > Date.now() && event.newValue ? next : null);
      client.clear(); setSession(readSession()); setError(''); setChecking(!!readSession());
    };
    window.addEventListener('ismo:session-expired', expire);
    window.addEventListener('storage', storage);
    return () => { window.removeEventListener('ismo:session-expired', expire); window.removeEventListener('storage', storage); };
  }, [clear, client]);
  const token = session?.accessToken;
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setChecking(true); setError('');
    api.me(controller.signal).then(user => {
      if (controller.signal.aborted || readSession()?.accessToken !== token) return;
      setSession(current => current && current.accessToken === token ? { ...current, user } : current);
      setChecking(false);
    }).catch(error => {
      if (controller.signal.aborted) return;
      setError(errorMessage(error)); setChecking(false);
    });
    return () => controller.abort();
  }, [token, attempt]);
  useEffect(() => {
    if (!session) return;
    const check = () => {
      if (Date.parse(session.expiresAt) <= Date.now()) clear(true);
    };
    const timer = setTimeout(check, Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    window.addEventListener('focus', check);
    return () => { clearTimeout(timer); window.removeEventListener('focus', check); };
  }, [session, clear]);
  const login = async (email: string, password: string) => {
    const next = await api.login(email.trim(), password);
    client.clear(); saveSession(next); setNotice(''); setError(''); setChecking(true); setSession(next);
  };
  const logout = async () => { await api.logout(); clear(); };
  return <AuthContext.Provider value={{ session, checking, error, notice, login, logout, retry: () => setAttempt(x => x + 1) }}>
    {children}
  </AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is required');
  return value;
}
export function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (auth.checking) return <div className="session-screen"><Loading label="Opening your workspace…" /></div>;
  if (auth.error) return <div className="session-screen"><ErrorState message={auth.error} retry={auth.retry} /></div>;
  return <Outlet />;
}
