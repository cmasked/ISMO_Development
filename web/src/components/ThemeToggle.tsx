import { Moon, Sun } from './icons';
import { useEffect, useState } from 'react';
export function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#f5f0e8');
    try { localStorage.setItem('ismo.theme', theme); } catch { /* Theme still works without storage. */ }
  }, [theme]);
  return <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    aria-label={'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode'} title={'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode'}>
    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}<span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
  </button>;
}
