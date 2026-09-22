"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme | null;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function getDomTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  root.style.backgroundColor = theme === "dark" ? "#120d10" : "#fffafc";
}

function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem("theme");
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children, locale }: { children: ReactNode; locale: string }) {
  const [theme, setThemeState] = useState<Theme | null>(null);
  const explicitTheme = useRef<Theme | null>(null);

  useLayoutEffect(() => {
    explicitTheme.current = explicitTheme.current ?? getStoredTheme();
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const nextTheme = explicitTheme.current ?? (colorScheme.matches ? "dark" : "light");

    // Locale navigation updates the root document without rerunning its startup script.
    // Restore the theme before paint, including an in-memory choice if storage is blocked.
    applyTheme(nextTheme);
    setThemeState(nextTheme);

    const onSystemThemeChange = (event: MediaQueryListEvent) => {
      if (explicitTheme.current === null) {
        const nextTheme: Theme = event.matches ? "dark" : "light";

        applyTheme(nextTheme);
        setThemeState(nextTheme);
      }
    };

    colorScheme.addEventListener("change", onSystemThemeChange);

    return () => {
      colorScheme.removeEventListener("change", onSystemThemeChange);
    };
  }, [locale]);

  const setTheme = (nextTheme: Theme) => {
    explicitTheme.current = nextTheme;

    try {
      localStorage.setItem("theme", nextTheme);
    } catch {
      // Theme still works for this session.
    }

    applyTheme(nextTheme);
    setThemeState(nextTheme);
  };

  const toggleTheme = () => {
    const currentTheme = theme ?? getDomTheme();

    setTheme(currentTheme === "dark" ? "light" : "dark");
  };

  return <ThemeContext value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
