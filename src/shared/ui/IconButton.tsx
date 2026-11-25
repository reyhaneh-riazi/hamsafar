import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: "plain" | "glass" | "surface";
}

const TONES = {
  plain: "text-ink-muted hover:text-ink hover:bg-surface-muted",
  glass: "bg-black/30 text-white backdrop-blur-md hover:bg-black/45",
  surface:
    "bg-surface text-ink shadow-card border border-line hover:-translate-y-0.5",
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, tone = "plain", className, children, type, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 disabled:opacity-50",
          TONES[tone],
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
