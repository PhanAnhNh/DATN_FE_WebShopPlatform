// src/context/ThemeContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyTheme, initTheme } from '../utils/theme';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(initTheme());

  const changeTheme = (newTheme) => {
    applyTheme(newTheme);
    setTheme(newTheme);
  };

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('admin_theme');
      if (saved && saved !== theme) {
        setTheme(saved);
        applyTheme(saved);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};