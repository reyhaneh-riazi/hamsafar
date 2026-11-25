import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";
import { Foliage } from "./Foliage";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  crumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
  children?: ReactNode;
}

/** Shared banner for inner pages — same forest palette and foliage language as the home page. */
export function PageHeader({
  title,
  subtitle,
  crumbs,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <div className="relative">
      <div className="relative overflow-hidden bg-forest-800 pb-20 pt-10 text-white sm:pt-12 dark:bg-forest-950">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1.5px)] [background-size:22px_22px]"
        />
        <div
          className="absolute -bottom-24 -left-20 size-72 rounded-full bg-coral-500/20 blur-3xl"
          aria-hidden="true"
        />
        <Foliage
          variant="corner-top"
          className="absolute -top-6 -left-6 w-[clamp(90px,12vw,200px)] opacity-90"
          motion="slow"
          eager
        />
        <div className="relative mx-auto max-w-page px-4 sm:px-6 lg:px-8">
          {crumbs && (
            <nav
              aria-label="مسیر صفحه"
              className="mb-4 flex flex-wrap items-center gap-1 text-xs text-white/65"
            >
              {crumbs.map((c, i) => (
                <span key={c.label} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronLeft className="size-3.5" aria-hidden="true" />
                  )}
                  {c.to ? (
                    <Link to={c.to} className="hover:text-white">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-white/90">
                      {c.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="animate-fade-up">
              <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
              {subtitle && (
                <p className="mt-2 max-w-2xl text-sm leading-7 text-white/75">
                  {subtitle}
                </p>
              )}
            </div>
            {actions}
          </div>
        </div>
      </div>
      {children && (
        <div className="relative mx-auto -mt-12 max-w-page px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      )}
    </div>
  );
}
