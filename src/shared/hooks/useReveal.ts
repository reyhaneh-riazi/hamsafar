import { useEffect, useRef } from "react";

/**
 * Adds `.is-visible` to the element (and to children marked `.reveal`) when it scrolls into view.
 * Pair with the `.reveal` utility in styles/index.css. Respects reduced motion via CSS.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = [
      root,
      ...Array.from(root.querySelectorAll<HTMLElement>(".reveal")),
    ].filter((el) => el.classList.contains("reveal"));
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return ref;
}
