import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const ThemeContext = createContext({ dark: false, toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    try { setDark(localStorage.getItem("lg-dark") === "1"); } catch { /* Storage may be disabled. */ }
    const sync = (event: StorageEvent) => {
      if (event.key === "lg-dark") setDark(event.newValue === "1");
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    try { localStorage.setItem("lg-dark", next ? "1" : "0"); } catch { /* Keep the in-memory preference. */ }
  };
  return <ThemeContext.Provider value={{ dark, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);