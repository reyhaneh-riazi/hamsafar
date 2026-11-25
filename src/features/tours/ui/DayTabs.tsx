import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { dayState, todayIso, type DayState } from "@/shared/lib/dates";
import { toFaDigits } from "@/shared/lib/digits";
import { formatDate, formatWeekday } from "@/shared/lib/format";

export interface DayTabItem {
  /** Stable key (day ID, or the day number in an unsaved draft). */
  key: string;
  dayNumber: number;
  /** Date-only value; null while the start date is still unknown. */
  date: string | null;
  /** Number of activities planned for the day. */
  count: number;
  /** Marks a day that contains validation errors (planner). */
  invalid?: boolean;
}

interface DayTabsProps {
  days: readonly DayTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  label: string;
  /** Prefix for tab/panel IDs so two instances never clash. */
  idPrefix: string;
  /** Show past/today/upcoming hints (real trips). Drafts only show the date. */
  showDateState?: boolean;
}

const STATE_META: Record<DayState, { label: string; dot: string }> = {
  past: { label: "گذشته", dot: "bg-ink-soft" },
  today: { label: "امروز", dot: "bg-coral-500" },
  upcoming: { label: "پیش رو", dot: "bg-forest-500" },
};

export function dayTabId(prefix: string, key: string) {
  return `${prefix}-tab-${key}`;
}
export function dayPanelId(prefix: string, key: string) {
  return `${prefix}-panel-${key}`;
}

/**
 * Horizontal day selector for a day-by-day plan. Each tab shows the day number, weekday + date,
 * the number of activities and (optionally) whether the day is past, today or upcoming.
 * Keyboard: arrow keys move between days (RTL aware), Home/End jump to the ends.
 */
export function DayTabs({
  days,
  activeKey,
  onChange,
  label,
  idPrefix,
  showDateState = false,
}: DayTabsProps) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const today = todayIso();

  const focusAt = (index: number) => {
    const target = days[(index + days.length) % days.length];
    if (!target) return;
    onChange(target.key);
    refs.current.get(target.key)?.focus();
  };

  const onKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    // The list runs right-to-left, so ArrowLeft is "next".
    const moves: Record<string, number> = {
      ArrowLeft: index + 1,
      ArrowRight: index - 1,
      Home: 0,
      End: days.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    focusAt(next);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className="no-scrollbar -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1"
    >
      {days.map((d, index) => {
        const active = d.key === activeKey;
        const state = showDateState && d.date ? dayState(d.date, today) : null;
        const meta = state ? STATE_META[state] : null;
        return (
          <button
            key={d.key}
            ref={(el) => {
              if (el) refs.current.set(d.key, el);
              else refs.current.delete(d.key);
            }}
            type="button"
            role="tab"
            id={dayTabId(idPrefix, d.key)}
            aria-controls={dayPanelId(idPrefix, d.key)}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(d.key)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              "relative min-w-[6.75rem] shrink-0 snap-start rounded-2xl border px-3.5 py-2.5 text-start transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/25",
              active
                ? "border-forest-800 bg-forest-800 text-white shadow-sm dark:border-forest-500 dark:bg-forest-500"
                : "border-line bg-surface-muted text-ink-muted hover:border-forest-300 hover:text-ink",
              state === "past" && !active && "opacity-75",
              d.invalid && !active && "border-danger",
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-xs font-black">
                روز {toFaDigits(d.dayNumber)}
              </span>
              {meta && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-bold",
                    active ? "text-white/85" : "text-ink-soft",
                  )}
                >
                  <span
                    className={cn("size-1.5 rounded-full", meta.dot)}
                    aria-hidden="true"
                  />
                  {meta.label}
                </span>
              )}
              {d.invalid && (
                <span
                  className={cn(
                    "size-2 rounded-full",
                    active ? "bg-white" : "bg-danger",
                  )}
                  aria-label="نیاز به اصلاح"
                  role="img"
                />
              )}
            </span>
            <span
              className={cn(
                "mt-1 block text-[11px] font-medium",
                active ? "text-white/80" : "text-ink-soft",
              )}
            >
              {d.date
                ? `${formatWeekday(d.date)} ${formatDate(d.date, false)}`
                : "تاریخ نامشخص"}
            </span>
            <span
              className={cn(
                "mt-0.5 block text-[10px]",
                active ? "text-white/70" : "text-ink-soft",
              )}
            >
              {d.count === 0 ? "بدون فعالیت" : `${toFaDigits(d.count)} فعالیت`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
