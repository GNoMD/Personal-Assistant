import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'task-planner-theme';

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'auto';
    return localStorage.getItem(STORAGE_KEY) || 'auto';
  });

  const applyTheme = useCallback((mode) => {
    const root = document.documentElement;
    if (mode === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', mode);
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    if (theme !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('auto');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  const cycleTheme = useCallback(() => {
    setThemeState((t) => (t === 'auto' ? 'light' : t === 'light' ? 'dark' : 'auto'));
  }, []);

  const label = theme === 'auto' ? '自动' : theme === 'light' ? '浅色' : '深色';

  return { theme, setTheme: setThemeState, cycleTheme, label };
}
