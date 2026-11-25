import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/cn";
import { LeafGlyph } from "./Doodles";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: { label: string; to: string };
  className?: string;
  as?: "h1" | "h2";
  extra?: ReactNode;
  id?: string;
}

export function SectionHeading({
  title,
  subtitle,
  action,
  className,
  as: Tag = "h2",
  extra,
  id,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3",
        className,
      )}
    >
      <div>
        <Tag
          id={id}
          className="flex items-center gap-2 text-xl font-black text-forest-800 sm:text-2xl dark:text-white"
        >
          <LeafGlyph className="size-6" />
          {title}
        </Tag>
        {subtitle && <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {extra}
      {action && (
        <Link
          to={action.to}
          className="group inline-flex items-center gap-1.5 text-sm font-extrabold text-coral-500 hover:text-coral-600"
        >
          {action.label}
          <ArrowLeft
            className="size-4 transition-transform group-hover:-translate-x-1"
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  );
}
