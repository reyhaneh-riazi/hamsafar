import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

/** Scrollable pill tabs (RTL). Content panels are rendered by the caller. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5 shadow-card"
    >
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={t.id === value}
          aria-controls={`panel-${t.id}`}
          onClick={() => onChange(t.id)}
          className={cn(
            "relative inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition",
            t.id === value
              ? "bg-forest-800 text-white shadow-sm dark:bg-forest-500"
              : "text-ink-muted hover:bg-surface-muted hover:text-ink",
          )}
        >
          {t.icon}
          {t.label}
          {t.badge ? (
            <span className="rounded-full bg-coral-500 px-1.5 text-[10px] font-black leading-5 text-white">
              {toFaDigits(t.badge > 99 ? "99+" : t.badge)}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
