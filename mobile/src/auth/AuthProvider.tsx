import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import { createApi, type Api } from '../lib/api';
import { SessionController, type AuthState } from '../lib/session';
const key = 'ismo.auth';
const options = { keychainService: 'com.ismo.projects.auth' };
interface Auth extends AuthState { api: Api; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; retry: () => void }
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [services] = useState(() => {
    let controller: SessionController;
    const api = createApi({
      baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://ismo-development.onrender.com/api',
      session: () => controller?.current() || null,
      unauthorized: token => { void controller.expire(token); }
    });
    controller = new SessionController(api, {
      get: () => SecureStore.getItemAsync(key, options),
      set: value => SecureStore.setItemAsync(key, value, options),
      remove: () => SecureStore.deleteItemAsync(key, options)
    });
    return { controller, api };
  });
  const [state, setState] = useState(services.controller.snapshot());
  useEffect(() => {
    let previousToken: string | undefined;
    const unsubscribe = services.controller.subscribe(next => {
      if (previousToken !== next.session?.accessToken) { void client.cancelQueries(); client.clear(); }
      previousToken = next.session?.accessToken;
      setState(next);
    });
    void services.controller.restore();
    return unsubscribe;
  }, [client, services]);
  useEffect(() => {
    const session = state.session;
    if (!session) return;
    const check = () => {
      if (Date.parse(session.expiresAt) <= Date.now()) void services.controller.expire(session.accessToken);
      else {
        void services.api.me().catch(() => {});
        void client.invalidateQueries();
      }
    };
    const timer = setTimeout(() => { void services.controller.expire(session.accessToken); }, Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    const subscription = AppState.addEventListener('change', status => { if (status === 'active') check(); });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, [state.session, services, client]);
  return <Context.Provider value={{ ...state, api: services.api, login: (email, password) => services.controller.login(email, password), logout: () => services.controller.logout(), retry: () => { void services.controller.restore(); } }}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error('Auth provider missing'); return value; }
