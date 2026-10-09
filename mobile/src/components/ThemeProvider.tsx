import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
export const light = { bg: '#f5f0e8', panel: '#ffffff', soft: '#f2ede5', raised: '#eee9e0', text: '#1a1a1a', muted: '#55514b', border: '#1a1a1a', subtle: '#d0cbc3', yellow: '#ffcc00', red: '#e63b2e', blue: '#0055ff', link: '#0048db', blueSoft: '#d6e3ff', redSoft: '#ffdad6', error: '#93000a', solid: '#1a1a1a', onSolid: '#ffffff' };
export const dark = { ...light, bg: '#1a1a1a', panel: '#242321', soft: '#292724', raised: '#34312b', text: '#f5f0e8', muted: '#c9c3b9', border: '#bcb5a9', subtle: '#5a554e', link: '#a8c6ff', blueSoft: '#233457', redSoft: '#4a2723', error: '#ffb3ab', solid: '#f5f0e8', onSolid: '#1a1a1a' };
interface Theme { colors: typeof light; isDark: boolean; ready: boolean; toggle: () => void }
const Context = createContext<Theme | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreference] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { let active = true; AsyncStorage.getItem('ismo.theme').then(value => { if (active && ['light', 'dark'].includes(value || '')) setPreference(value === 'dark'); }).catch(() => {}).finally(() => { if (active) setReady(true); }); return () => { active = false; }; }, []);
  const isDark = preference ?? system === 'dark';
  const toggle = () => { const value = !isDark; setPreference(value); void AsyncStorage.setItem('ismo.theme', value ? 'dark' : 'light').catch(() => {}); };
  return <Context.Provider value={{ colors: isDark ? dark : light, isDark, ready, toggle }}>{children}</Context.Provider>;
}
export function useTheme() { const value = useContext(Context); if (!value) throw new Error('Theme provider missing'); return value; }
