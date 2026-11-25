import type { Config } from "tailwindcss";

/**
 * Hamsafar design tokens.
 *
 * Primary palette (rubric: at most 3–4 primary colours):
 *   1. forest — brand green (header, footer, headings, icons)
 *   2. coral  — call-to-action / prices / highlights
 *   3. sand   — warm page background
 * Semantic tokens (canvas, surface, ink, line…) point at CSS variables defined in
 * `src/styles/index.css`, so light and dark mode share one class vocabulary.
 * `tint-*` are pale category-tile backgrounds derived from the same hues.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Vazirmatn",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Tahoma",
          "sans-serif",
        ],
      },
      colors: {
        forest: {
          50: "#F1F7F3",
          100: "#E3EFE7",
          200: "#C5DECD",
          300: "#94C2A3",
          400: "#5E9F75",
          500: "#3B8158",
          600: "#2A6646",
          700: "#1D4E37",
          800: "#173D2C",
          900: "#123126",
          950: "#0B211A",
        },
        coral: {
          50: "#FFF3EF",
          100: "#FFE3DA",
          200: "#FFC6B6",
          300: "#FCA18A",
          400: "#F9846A",
          500: "#F26B4F",
          600: "#E0553A",
          700: "#BB422C",
        },
        sand: {
          50: "#FCFBF8",
          100: "#F7F4EE",
          200: "#EFEAE0",
          300: "#E2DACB",
        },
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--c-surface) / <alpha-value>)",
          muted: "rgb(var(--c-surface-muted) / <alpha-value>)",
          raised: "rgb(var(--c-surface-raised) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          muted: "rgb(var(--c-ink-muted) / <alpha-value>)",
          soft: "rgb(var(--c-ink-soft) / <alpha-value>)",
        },
        line: "rgb(var(--c-line) / <alpha-value>)",
        brand: "rgb(var(--c-brand) / <alpha-value>)",
        tint: {
          mint: "rgb(var(--c-tint-mint) / <alpha-value>)",
          lilac: "rgb(var(--c-tint-lilac) / <alpha-value>)",
          peach: "rgb(var(--c-tint-peach) / <alpha-value>)",
          butter: "rgb(var(--c-tint-butter) / <alpha-value>)",
          sky: "rgb(var(--c-tint-sky) / <alpha-value>)",
          sage: "rgb(var(--c-tint-sage) / <alpha-value>)",
        },
        /** Category accent for the 'family' tile only (documented in docs/design-system.md). */
        plum: "rgb(var(--c-plum) / <alpha-value>)",
        success: "rgb(var(--c-success) / <alpha-value>)",
        warning: "rgb(var(--c-warning) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
        info: "rgb(var(--c-info) / <alpha-value>)",
      },
      borderRadius: {
        card: "1.125rem",
        panel: "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(16 35 30 / 0.04), 0 10px 28px -14px rgb(16 35 30 / 0.22)",
        float: "0 26px 60px -26px rgb(8 32 26 / 0.45)",
        tile: "0 8px 22px -14px rgb(16 35 30 / 0.35)",
        cta: "0 10px 22px -10px rgb(242 107 79 / 0.65)",
      },
      maxWidth: {
        page: "80rem",
      },
      zIndex: {
        header: "40",
        drawer: "60",
        modal: "70",
        toast: "80",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        pop: {
          from: { opacity: "0", transform: "scale(0.96) translateY(-4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(2.4deg)" },
        },
        "sway-reverse": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(-2.2deg)" },
        },
        kenburns: {
          from: { transform: "scale(1.06)" },
          to: { transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        draw: {
          from: { strokeDashoffset: "1" },
          to: { strokeDashoffset: "0" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
        "plane-fly": {
          "0%": { transform: "translate(0, 0) rotate(0deg)" },
          "50%": { transform: "translate(-6px, -5px) rotate(-4deg)" },
          "100%": { transform: "translate(0, 0) rotate(0deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.5s ease both",
        pop: "pop 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
        sway: "sway 7s ease-in-out infinite",
        "sway-slow": "sway 10s ease-in-out infinite",
        "sway-reverse": "sway-reverse 8s ease-in-out infinite",
        kenburns: "kenburns 14s ease-out both",
        float: "float 5s ease-in-out infinite",
        draw: "draw 1.4s 0.5s cubic-bezier(0.65, 0, 0.35, 1) both",
        shimmer: "shimmer 1.6s linear infinite",
        shake: "shake 0.4s ease-in-out",
        "plane-fly": "plane-fly 4s ease-in-out infinite",
      },
    },
  },
} satisfies Config;
