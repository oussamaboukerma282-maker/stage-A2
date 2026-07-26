// Contexte de thème (clair / sombre) avec persistance en localStorage.
// Applique la classe `dark` sur <html> — Tailwind fait le reste via darkMode: 'class'.

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const racine = document.documentElement;
    if (theme === 'dark') racine.classList.add('dark');
    else racine.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const basculer = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, basculer }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  return ctx;
}
