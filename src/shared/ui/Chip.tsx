import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({
  selected,
  className,
  children,
  type,
  ...rest
}: ChipProps) {
  return (
    <button
      type={type ?? "button"}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-all",
        selected
          ? "border-forest-700 bg-forest-800 text-white dark:border-forest-400 dark:bg-forest-500"
          : "border-line bg-surface text-ink-muted hover:border-forest-400 hover:text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
