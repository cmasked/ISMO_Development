import type { Dashboard, Project, ProjectInput, Session, Task, TaskInput, User } from '../types';
import { expireSession, readSession } from './session';
const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string) { super(message); }
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
function friendlyMessage(status: number, code: string, message: unknown): string {
  if (code === 'EMAIL_ALREADY_EXISTS') return 'An account with this email already exists. Try signing in.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 404) return 'This item is no longer available. It may have been deleted.';
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (status >= 500) return 'We couldn’t save or load your changes right now. Please try again.';
  if (code === 'VALIDATION_ERROR') {
    return typeof message === 'string' ? message.replace(/\bfullName\b/g, 'Full name')
      .replace(/\bstartDate\b/g, 'Start date').replace(/\bendDate\b/g, 'End date')
      .replace(/\bdueDate\b/g, 'Due date').replace(/\bprojectId\b/g, 'Project')
      .replace(/\bname\b/g, 'Name') : 'Please check the form and try again.';
  }
  return typeof message === 'string' ? message : 'We couldn’t complete that request. Please try again.';
}
export async function request<T>(path: string, options: {
  method?: string; body?: unknown; signal?: AbortSignal; public?: boolean;
} = {}): Promise<T> {
  const session = options.public ? null : readSession();
  if (session && Date.parse(session.expiresAt) <= Date.now()) {
    expireSession(session.accessToken);
    throw new ApiError('Your session has expired. Please sign in again.', 401, 'TOKEN_EXPIRED');
  }
  let response: Response;
  try {
    response = await fetch(base + path, {
      method: options.method || 'GET', signal: options.signal, credentials: 'omit',
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(session ? { Authorization: 'Bearer ' + session.accessToken } : {}),
      }, body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('We couldn’t connect. Check your connection and try again.', 0, 'NETWORK_ERROR');
  }
  const payload = await response.json().catch(() => null) as { success?: boolean; data?: T; message?: unknown; code?: string } | null;
  if (!response.ok || payload?.success !== true) {
    const code = payload?.code || 'REQUEST_FAILED';
    if (response.status === 401 && session) expireSession(session.accessToken);
    const message = options.public && response.status === 401
      ? 'The email or password doesn’t match. Please try again.'
      : friendlyMessage(response.status, code, payload?.message);
    throw new ApiError(message, response.status, code);
  }
  return payload.data as T;
}
export function queryString(filters: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  return query.size ? '?' + query.toString() : '';
}
export const api = {
  login: (email: string, password: string) => request<Session>('/auth/login', { method: 'POST', body: { email, password }, public: true }),
  register: (fullName: string, email: string, password: string) => request<User>('/auth/register', { method: 'POST', body: { fullName, email, password }, public: true }),
  me: (signal?: AbortSignal) => request<User>('/auth/me', { signal }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  dashboard: (signal?: AbortSignal) => request<Dashboard>('/dashboard', { signal }),
  projects: (filters: Record<string, string> = {}, signal?: AbortSignal) => request<Project[]>('/projects' + queryString(filters), { signal }),
  project: (id: string, signal?: AbortSignal) => request<Project>('/projects/' + encodeURIComponent(id), { signal }),
  saveProject: (input: ProjectInput, id?: string) => request<Project>('/projects' + (id ? '/' + encodeURIComponent(id) : ''), { method: id ? 'PUT' : 'POST', body: input }),
  deleteProject: (id: string) => request('/projects/' + encodeURIComponent(id), { method: 'DELETE' }),
  tasks: (filters: Record<string, string> = {}, signal?: AbortSignal) => request<Task[]>('/tasks' + queryString(filters), { signal }),
  saveTask: (input: TaskInput | Partial<TaskInput>, id?: string) => request<Task>('/tasks' + (id ? '/' + encodeURIComponent(id) : ''), { method: id ? 'PUT' : 'POST', body: input }),
  deleteTask: (id: string) => request('/tasks/' + encodeURIComponent(id), { method: 'DELETE' }),
};
