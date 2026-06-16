import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'isDarkThemeEnabled';
const MATCH_DARK = '(prefers-color-scheme: dark)';

const applyTheme = (isDark: boolean) => {
  // Modern: data-theme attribute on <html>
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  // Legacy: classes on <body>
  document.body.classList.toggle('dark-theme', isDark);
  document.body.classList.toggle('light-theme', !isDark);
};

const getInitialTheme = (): boolean => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const isDark = stored !== null ? stored !== 'false' : window.matchMedia(MATCH_DARK).matches;
  applyTheme(isDark);
  return isDark;
};

export const useThemeToggle = () => {
  const [isDarkThemeEnabled, setIsDarkThemeEnabled] = useState(getInitialTheme);

  const onThemeToggle = useCallback(() => {
    setIsDarkThemeEnabled((enabled) => {
      const next = !enabled;
      localStorage.setItem(STORAGE_KEY, String(next));
      applyTheme(next);
      return next;
    });
  }, []);

  const osThemeToggle = useCallback((event: MediaQueryListEvent) => {
    if (localStorage.getItem(STORAGE_KEY) !== null) return;
    const isDark = event.matches;
    setIsDarkThemeEnabled(() => {
      applyTheme(isDark);
      return isDark;
    });
  }, []);

  useEffect(() => {
    const matcher = window.matchMedia(MATCH_DARK);
    matcher.addEventListener('change', osThemeToggle);
    return () => matcher.removeEventListener('change', osThemeToggle);
  }, [osThemeToggle]);

  return {
    isDarkThemeEnabled,
    setIsDarkThemeEnabled,
    onThemeToggle,
    isLightMode: !isDarkThemeEnabled,
  };
};

export default useThemeToggle;
