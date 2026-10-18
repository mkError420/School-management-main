import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

const readStoredTheme = (): Theme => {
  try {
    return localStorage.getItem("school_theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

export const isDashboardPath = (path: string = typeof window !== "undefined" ? window.location.pathname : ""): boolean => {
  const publicPaths = [
    "/",
    "/about",
    "/administration",
    "/teachers-list",
    "/notices",
    "/academics",
    "/admission",
    "/study-corner",
    "/gallery",
    "/co-curricular",
    "/contact",
    "/sign-in",
  ];
  if (publicPaths.includes(path)) return false;
  return true;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const initialTheme = readStoredTheme();
    if (typeof document !== "undefined") {
      if (isDashboardPath()) {
        document.documentElement.classList.toggle("dark", initialTheme === "dark");
        document.documentElement.style.colorScheme = initialTheme;
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }
    }
    return initialTheme;
  });

  useEffect(() => {
    try {
      localStorage.setItem("school_theme", theme);
    } catch {
      // Theme still works for this session if storage is unavailable.
    }

    if (typeof window !== "undefined" && isDashboardPath(window.location.pathname)) {
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;
    }
  }, [theme]);

  const toggleTheme = () => setTheme((current) => current === "light" ? "dark" : "light");

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);