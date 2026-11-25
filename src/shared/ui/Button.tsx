import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { cn } from "@/shared/lib/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "danger" | "light";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-coral-500 text-white shadow-cta hover:bg-coral-600 active:bg-coral-700 disabled:bg-coral-300 disabled:shadow-none",
  secondary:
    "bg-forest-800 text-white hover:bg-forest-700 active:bg-forest-900 disabled:bg-forest-300 dark:bg-forest-600 dark:hover:bg-forest-500",
  outline:
    "border border-forest-800/70 text-forest-800 hover:bg-forest-800 hover:text-white disabled:border-line disabled:text-ink-soft disabled:hover:bg-transparent dark:border-forest-300/60 dark:text-forest-200 dark:hover:bg-forest-300 dark:hover:text-forest-950",
  ghost: "text-ink hover:bg-surface-muted disabled:text-ink-soft",
  danger: "bg-danger text-white hover:brightness-110 disabled:opacity-50",
  light:
    "border border-white/50 text-white backdrop-blur-sm hover:bg-white/15 disabled:opacity-60",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-13 px-7 text-base gap-2.5 rounded-xl",
};

const BASE =
  "inline-flex items-center justify-center font-bold whitespace-nowrap transition-all duration-200 select-none active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100";

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconEnd?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconEnd,
      fullWidth,
      className,
      children,
      disabled,
      type,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonClasses(
          variant,
          size,
          cn(fullWidth && "w-full", className),
        )}
        {...rest}
      >
        {loading ? <Spinner className="size-4" /> : icon}
        {children}
        {!loading && iconEnd}
      </button>
    );
  },
);

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconEnd?: ReactNode;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  icon,
  iconEnd,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClasses(
        variant,
        size,
        typeof className === "string" ? className : undefined,
      )}
      {...rest}
    >
      {icon}
      {children}
      {iconEnd}
    </Link>
  );
}
