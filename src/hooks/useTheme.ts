import { useState, useEffect, useCallback } from 'react';
import type { Theme } from '../types';

const THEME_STORAGE_KEY = 'clarity-theme';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check localStorage first
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
            if (stored === 'light' || stored === 'dark') {
                return stored;
            }
        }
        // Default to light mode
        return 'light';
    });

    useEffect(() => {
        const root = document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    }, []);

    const setThemeValue = useCallback((newTheme: Theme) => {
        setTheme(newTheme);
    }, []);

    return {
        theme,
        toggleTheme,
        setTheme: setThemeValue,
        isDark: theme === 'dark',
    };
}
