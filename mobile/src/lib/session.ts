import type { Session } from '../types';
import type { Api } from './api';
export interface Storage { get: () => Promise<string | null>; set: (value: string) => Promise<void>; remove: () => Promise<void> }
export interface AuthState { status: 'loading' | 'signedOut' | 'signedIn' | 'error'; session: Session | null; notice: string }
export function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Session;
    return value && typeof value.accessToken === 'string' && value.accessToken.length > 0 &&
      Number.isFinite(Date.parse(value.expiresAt)) && typeof value.user?.id === 'string' &&
      typeof value.user?.fullName === 'string' && typeof value.user?.email === 'string' ? value : null;
  } catch { return null; }
}
export class SessionController {
  private session: Session | null = null;
  private epoch = 0;
  private queue: Promise<void> = Promise.resolve();
  private write(operation: () => Promise<void>) { const result = this.queue.then(operation); this.queue = result.catch(() => {}); return result; }
  private listeners = new Set<(state: AuthState) => void>();
  private state: AuthState = { status: 'loading', session: null, notice: '' };
  constructor(private api: Pick<Api, 'login' | 'logout' | 'me'>, private storage: Storage) {}
  current() { return this.session; }
  snapshot() { return this.state; }
  subscribe(listener: (state: AuthState) => void) { this.listeners.add(listener); listener(this.state); return () => { this.listeners.delete(listener); }; }
  private publish(state: AuthState) { this.state = state; this.listeners.forEach(fn => fn(state)); }
  async restore() {
    const epoch = ++this.epoch;
    this.publish({ status: 'loading', session: null, notice: '' });
    try {
      await this.queue;
      const raw = await this.storage.get();
      if (epoch !== this.epoch) return;
      const saved = parseSession(raw);
      if (!saved || Date.parse(saved.expiresAt) <= Date.now()) {
        if (raw) await this.write(() => this.storage.remove());
        if (epoch !== this.epoch) return;
        this.session = null;
        this.publish({ status: 'signedOut', session: null, notice: saved ? 'Your session has expired. Please sign in to continue.' : '' });
        return;
      }
      this.session = saved;
      const user = await this.api.me();
      if (epoch !== this.epoch) return;
      this.session = { ...saved, user };
      this.publish({ status: 'signedIn', session: this.session, notice: '' });
    } catch {
      if (epoch !== this.epoch) return;
      this.publish({ status: 'error', session: null, notice: 'We couldn’t open your workspace. Check your connection and try again.' });
    }
  }
  async login(email: string, password: string) {
    const epoch = ++this.epoch;
    const next = await this.api.login(email, password);
    if (epoch !== this.epoch) return;
    if (!parseSession(JSON.stringify(next)) || Date.parse(next.expiresAt) <= Date.now()) throw new Error('We couldn’t sign you in. Please try again.');
    try { await this.write(() => this.storage.set(JSON.stringify(next))); }
    catch { throw new Error('We couldn’t save your sign-in securely. Please try again.'); }
    if (epoch !== this.epoch) return;
    this.session = next;
    this.publish({ status: 'signedIn', session: next, notice: '' });
  }
  async logout() {
    const token = this.session?.accessToken;
    await this.api.logout();
    if (this.session?.accessToken === token) await this.clear(false);
  }
  async expire(token: string) {
    if (this.session?.accessToken !== token) return;
    await this.clear(true);
  }
  private async clear(expired: boolean) {
    ++this.epoch;
    this.session = null;
    this.publish({ status: 'signedOut', session: null, notice: expired ? 'Your session has expired. Please sign in to continue.' : '' });
    try { await this.storage.remove(); }
    catch { this.publish({ status: 'signedOut', session: null, notice: 'You’re signed out, but we couldn’t clear saved sign-in on this device.' }); }
  }
}
