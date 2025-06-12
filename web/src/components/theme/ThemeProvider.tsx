"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper function to get resolved theme
function getResolvedTheme(theme: Theme): "dark" | "light" {
  if (typeof window === "undefined") return "dark";

  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with system theme to avoid hydration mismatch
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage after mount
  useEffect(() => {
    setMounted(true);

    try {
      const savedTheme = localStorage.getItem("grosonix-theme") as Theme;
      if (savedTheme && ["dark", "light", "system"].includes(savedTheme)) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.warn("Failed to read theme from localStorage:", error);
    }
  }, []);

  // Apply theme to DOM and save to localStorage
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    const effectiveTheme = getResolvedTheme(theme);

    // Remove existing theme classes
    root.classList.remove("light", "dark");
    // Apply theme class
    root.classList.add(effectiveTheme);

    setResolvedTheme(effectiveTheme);

    // Save to localStorage
    try {
      localStorage.setItem("grosonix-theme", theme);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        const newTheme = mediaQuery.matches ? "dark" : "light";
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(newTheme);
        setResolvedTheme(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const value = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
