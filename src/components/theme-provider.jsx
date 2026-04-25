import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeProviderContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

function resolveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
}) {
  const [theme, setTheme] = useState(() => localStorage.getItem(storageKey) || defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(localStorage.getItem(storageKey) || defaultTheme));

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (nextTheme) => {
      const nextResolvedTheme = nextTheme === 'system'
        ? (media.matches ? 'dark' : 'light')
        : nextTheme;
      root.classList.remove('light', 'dark');
      root.classList.add(nextResolvedTheme);
      setResolvedTheme(nextResolvedTheme);
    };

    applyTheme(theme);

    if (theme !== 'system') {
      return undefined;
    }

    const handleChange = () => applyTheme('system');
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme: (nextTheme) => {
      localStorage.setItem(storageKey, nextTheme);
      setTheme(nextTheme);
    },
    toggleTheme: () => {
      const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(storageKey, nextTheme);
      setTheme(nextTheme);
    },
  }), [theme, resolvedTheme, storageKey]);

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
