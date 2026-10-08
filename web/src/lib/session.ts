import type { Session } from '../types';
export const SESSION_KEY = 'ismo.session';
let memory: Session | null = null;
export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return memory;
    const value = JSON.parse(raw) as Session;
    if (typeof value.accessToken !== 'string' || !value.accessToken ||
        !Number.isFinite(Date.parse(value.expiresAt)) || typeof value.user?.fullName !== 'string' ||
        typeof value.user?.email !== 'string') return null;
    return value;
  } catch { return memory; }
}
export function saveSession(value: Session | null) {
  memory = value;
  try {
    if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value));
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* Sessions still work in memory when browser storage is unavailable. */ }
}
export function expireSession(token: string) {
  if (readSession()?.accessToken !== token) return;
  saveSession(null);
  window.dispatchEvent(new Event('ismo:session-expired'));
}
