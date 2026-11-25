import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type BadgeTone =
  "coral" | "green" | "amber" | "neutral" | "danger" | "info" | "brand";

const TONES: Record<BadgeTone, string> = {
  coral: "bg-coral-500 text-white",
  green: "bg-forest-500 text-white",
  amber: "bg-warning/15 text-warning",
  neutral: "bg-surface-muted text-ink-muted",
  danger: "bg-danger/12 text-danger",
  info: "bg-info/12 text-info",
  brand:
    "bg-forest-100 text-forest-800 dark:bg-forest-900 dark:text-forest-200",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold leading-none",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
