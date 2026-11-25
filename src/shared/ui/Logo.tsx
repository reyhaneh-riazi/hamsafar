import { Link } from "react-router";
import { cn } from "@/shared/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden="true">
      <path d="M2 38 22 9l9 12 7-9 24 26Z" fill="#F4A259" />
      <path d="M22 9l9 12-5 3-4-6-3 4-3-3Z" fill="#FBE3C4" />
      <path d="M14 38 34 13l28 25Z" fill="#3B8158" />
      <path d="M34 13l7 9-4-1-3 4-3-3-3 2Z" fill="#DDEFE3" />
      <path d="M30 38 44 22l16 16Z" fill="#1D4E37" />
    </svg>
  );
}

interface LogoProps {
  to?: string;
  tone?: "light" | "dark";
  tagline?: string;
  className?: string;
}

export function Logo({
  to = "/",
  tone = "light",
  tagline,
  className,
}: LogoProps) {
  return (
    <Link
      to={to}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="همسفر — صفحه اصلی"
    >
      <LogoMark className="h-8 w-12 transition-transform duration-300 group-hover:-translate-y-0.5 sm:h-9 sm:w-14" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-xl font-black sm:text-2xl",
            tone === "light" ? "text-white" : "text-forest-800 dark:text-white",
          )}
        >
          همسفر
        </span>
        {tagline && (
          <span
            className={cn(
              "mt-1.5 text-[11px] font-medium",
              tone === "light" ? "text-white/70" : "text-ink-muted",
            )}
          >
            {tagline}
          </span>
        )}
      </span>
    </Link>
  );
}

/** Figma header logo: dark-green rounded square with a globe, name and tagline. */
export function BrandLogo({
  to = "/",
  tagline = "سفرهای واقعی، آدم‌های واقعی",
  inverse = false,
  className,
}: {
  to?: string;
  tagline?: string | null;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn("group inline-flex items-center gap-3", className)}
      aria-label="همسفر — صفحه اصلی"
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5",
          inverse ? "bg-white/10" : "bg-[#1c3c34] dark:bg-forest-700",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-lg font-black",
            inverse ? "text-white" : "text-slate-900 dark:text-white",
          )}
        >
          همسفر
        </span>
        {tagline && (
          <span
            className={cn(
              "mt-1.5 text-[11px] font-medium",
              inverse ? "text-white/70" : "text-slate-500 dark:text-ink-muted",
            )}
          >
            {tagline}
          </span>
        )}
      </span>
    </Link>
  );
}
