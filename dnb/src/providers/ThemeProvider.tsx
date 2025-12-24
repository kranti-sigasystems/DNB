'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Default to light theme
      setTheme('light');
      localStorage.setItem('theme', 'light');
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      const root = window.document.documentElement;
      
      // Apply theme change immediately without requestAnimationFrame
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      
      // Force style recalculation
      root.offsetHeight;
      
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    // Apply theme immediately for instant feedback
    if (mounted) {
      const root = window.document.documentElement;
      
      // Force immediate application without animation frame delay
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
      
      // Also force a style recalculation to ensure immediate application
      root.offsetHeight; // Trigger reflow
      
      localStorage.setItem('theme', newTheme);
    }
    
    setTheme(newTheme);
  }, [theme, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}