import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { addDays, todayIso } from "@/shared/lib/dates";
import { toFaDigits } from "@/shared/lib/digits";
import { formatMonth } from "@/shared/lib/format";

const latinPersian = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
});

/** Persian calendar parts of a date-only value. */
export function persianParts(iso: string): { y: number; m: number; d: number } {
  const parts = latinPersian.formatToParts(new Date(`${iso}T12:00:00Z`));
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** First day (ISO) of the Persian month that contains `iso`. */
export function persianMonthStart(iso: string): string {
  return addDays(iso, -(persianParts(iso).d - 1));
}

const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

interface JalaliDatePickerProps {
  value: string | null;
  onChange: (iso: string) => void;
  /** Earliest selectable day (default: today). */
  min?: string;
  label?: string;
}

/**
 * Month grid in the Persian (Solar Hijri) calendar — Figma «Dropdown Calendar Popup» (57:638).
 * Works on ISO date-only strings so the value can go straight to the API.
 */
export function JalaliDatePicker({
  value,
  onChange,
  min = todayIso(),
  label = "انتخاب تاریخ",
}: JalaliDatePickerProps) {
  const [monthStart, setMonthStart] = useState(() =>
    persianMonthStart(value ?? min),
  );
  const { y, m } = persianParts(monthStart);

  const days = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < 31; i += 1) {
      const iso = addDays(monthStart, i);
      if (persianParts(iso).m !== m) break;
      out.push(iso);
    }
    return out;
  }, [monthStart, m]);

  // Persian weeks start on Saturday (getUTCDay 6 → column 0).
  const offset = (new Date(`${monthStart}T12:00:00Z`).getUTCDay() + 1) % 7;
  const prevDisabled = monthStart <= persianMonthStart(min);

  return (
    <div className="w-[17.5rem] p-3" role="group" aria-label={label}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="ماه قبل"
          disabled={prevDisabled}
          onClick={() =>
            setMonthStart(persianMonthStart(addDays(monthStart, -1)))
          }
          className="inline-flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-white/80 dark:hover:bg-white/10"
        >
          <ChevronRight className="size-4" />
        </button>
        <p
          className="text-sm font-black text-slate-900 dark:text-white"
          aria-live="polite"
        >
          {formatMonth(monthStart)} {toFaDigits(y)}
        </p>
        <button
          type="button"
          aria-label="ماه بعد"
          onClick={() =>
            setMonthStart(persianMonthStart(addDays(monthStart, 32)))
          }
          className="inline-flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/10"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
        {WEEKDAYS.map((w) => (
          <span key={w} aria-hidden="true">
            {w}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: offset }, (_, i) => (
          <span key={`e${i}`} />
        ))}
        {days.map((iso) => {
          const disabled = iso < min;
          const selected = iso === value;
          const today = iso === todayIso();
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`${toFaDigits(persianParts(iso).d)} ${formatMonth(iso)}`}
              onClick={() => onChange(iso)}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-lg text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-30",
                selected
                  ? "bg-[#e8604c] text-white"
                  : today
                    ? "border border-[#e8604c] text-[#e8604c]"
                    : "text-slate-700 hover:bg-slate-100 dark:text-white/85 dark:hover:bg-white/10",
              )}
            >
              {toFaDigits(persianParts(iso).d)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
