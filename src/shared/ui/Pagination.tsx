import { ChevronLeft, ChevronRight } from "lucide-react";
import { toFaDigits } from "@/shared/lib/digits";
import { cn } from "@/shared/lib/cn";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const list = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 1,
  );
  return (
    <nav
      aria-label="صفحه‌بندی نتایج"
      className="mt-10 flex items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="صفحه قبل"
        className="inline-flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-ink transition hover:bg-surface-muted disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
      {list.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - (list[i - 1] ?? p) > 1 && (
            <span className="px-1 text-ink-soft">…</span>
          )}
          <button
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-xl text-sm font-bold transition",
              p === page
                ? "bg-forest-800 text-white dark:bg-forest-500"
                : "border border-line bg-surface text-ink hover:bg-surface-muted",
            )}
          >
            {toFaDigits(p)}
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        aria-label="صفحه بعد"
        className="inline-flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-ink transition hover:bg-surface-muted disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>
    </nav>
  );
}
