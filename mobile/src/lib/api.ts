import type { Dashboard, Project, ProjectInput, Session, Task, TaskInput, User } from '../types';
export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string) { super(message); }
}
export function message(error: unknown): string { return error instanceof Error ? error.message : 'Something went wrong. Please try again.'; }
export function queryString(filters: Record<string, string | undefined>) {
  const result = Object.entries(filters).filter(([, value]) => !!value).map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(value!)).join('&');
  return result ? '?' + result : '';
}
export function createApi(options: { baseUrl: string; session: () => Session | null; unauthorized: (token: string) => void; timeoutMs?: number }) {
  const base = options.baseUrl.replace(/\/$/, '');
  async function request<T>(path: string, config: { method?: string; body?: unknown; public?: boolean; signal?: AbortSignal } = {}): Promise<T> {
    const session = config.public ? null : options.session();
    if (session && Date.parse(session.expiresAt) <= Date.now()) {
      options.unauthorized(session.accessToken);
      throw new ApiError('Your session has expired. Please sign in again.', 401, 'TOKEN_EXPIRED');
    }
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (config.signal?.aborted) controller.abort();
    config.signal?.addEventListener('abort', abort);
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs ?? 30000);
    try {
      const response = await fetch(base + path, {
        method: config.method || 'GET', signal: controller.signal,
        headers: { ...(config.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(session ? { Authorization: 'Bearer ' + session.accessToken } : {}) },
        body: config.body !== undefined ? JSON.stringify(config.body) : undefined
      });
      const payload = await response.json().catch(() => null) as { success?: boolean; data?: T; code?: string; message?: unknown } | null;
      if (!response.ok || payload?.success !== true) {
        if (response.status === 401 && session) options.unauthorized(session.accessToken);
        const code = payload?.code || 'REQUEST_FAILED';
        let text = 'We couldn’t complete that request. Please try again.';
        if (response.status === 401) text = config.public ? 'The email or password doesn’t match. Please try again.' : 'Your session has expired. Please sign in again.';
        else if (response.status === 404) text = 'This item is no longer available. It may have been deleted.';
        else if (response.status === 429) text = 'Too many attempts. Please wait a minute and try again.';
        else if (response.status >= 500) text = 'We’re having trouble right now. Please try again.';
        else if (code === 'EMAIL_ALREADY_EXISTS') text = 'An account with this email already exists. Try signing in.';
        else if (typeof payload?.message === 'string') text = payload.message.replace(/fullName/g, 'Full name').replace(/projectId/g, 'Project').replace(/startDate/g, 'Start date').replace(/endDate/g, 'End date').replace(/dueDate/g, 'Due date');
        throw new ApiError(text, response.status, code);
      }
      return payload.data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (config.signal?.aborted) throw error;
      throw new ApiError(timedOut ? 'This is taking longer than usual. Please try again.' : 'We couldn’t connect. Check your connection and try again.', 0, timedOut ? 'TIMEOUT' : 'NETWORK_ERROR');
    } finally { clearTimeout(timer); config.signal?.removeEventListener('abort', abort); }
  }
  return {
    login: (email: string, password: string) => request<Session>('/auth/login', { method: 'POST', public: true, body: { email: email.trim(), password } }),
    register: (fullName: string, email: string, password: string) => request<User>('/auth/register', { method: 'POST', public: true, body: { fullName: fullName.trim(), email: email.trim(), password } }),
    me: (signal?: AbortSignal) => request<User>('/auth/me', { signal }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    dashboard: (signal?: AbortSignal) => request<Dashboard>('/dashboard', { signal }),
    projects: (filters: Record<string, string> = {}, signal?: AbortSignal) => request<Project[]>('/projects' + queryString(filters), { signal }),
    project: (id: string, signal?: AbortSignal) => request<Project>('/projects/' + encodeURIComponent(id), { signal }),
    tasks: (filters: Record<string, string> = {}, signal?: AbortSignal) => request<Task[]>('/tasks' + queryString(filters), { signal }),
    task: (id: string, signal?: AbortSignal) => request<Task>('/tasks/' + encodeURIComponent(id), { signal }),
    saveProject: (data: ProjectInput, id?: string) => request<Project>('/projects' + (id ? '/' + encodeURIComponent(id) : ''), { method: id ? 'PUT' : 'POST', body: data }),
    saveTask: (data: TaskInput | Partial<TaskInput>, id?: string) => request<Task>('/tasks' + (id ? '/' + encodeURIComponent(id) : ''), { method: id ? 'PUT' : 'POST', body: data }),
    deleteProject: (id: string) => request('/projects/' + encodeURIComponent(id), { method: 'DELETE' }),
    deleteTask: (id: string) => request('/tasks/' + encodeURIComponent(id), { method: 'DELETE' })
  };
}
export type Api = ReturnType<typeof createApi>;
