import { useEffect, useState } from "react";

/** The `md` breakpoint (768px): the home and login pages switch between their desktop and mobile designs here. */
export const DESKTOP_QUERY = "(min-width: 768px)";

function matches(query: string, fallback: boolean): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return fallback;
  return window.matchMedia(query).matches;
}

/** Live `matchMedia` result. Environments without `matchMedia` (jsdom) get `fallback`. */
export function useMediaQuery(query: string, fallback = true): boolean {
  const [value, setValue] = useState(() => matches(query, fallback));

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const list = window.matchMedia(query);
    const onChange = () => setValue(list.matches);
    onChange();
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return value;
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY);
}
