import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { safeStorage } from "@/shared/lib/storage";

type Theme = "light" | "dark";
const KEY = "hamsafar.theme";

interface ThemeApi {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeApi | null>(null);

function initialTheme(): Theme {
  const saved = safeStorage.get(KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Token-based light/dark mode: saved preference wins, otherwise the system preference. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      safeStorage.set(KEY, next);
      return next;
    });
  }, []);

  const api = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeApi {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
