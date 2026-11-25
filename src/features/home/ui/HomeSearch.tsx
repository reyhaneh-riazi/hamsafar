import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router";
import type { TourCategory } from "@/features/tours/api/tour-schemas";
import { useDestinations } from "@/features/tours/hooks";
import { CATEGORY_LABELS } from "@/features/tours/model/labels";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";
import * as J from "../model/jalali";

/* ------------------------------------------------------------------ */
/* Shared search state                                                  */
/* ------------------------------------------------------------------ */

type Panel = "destination" | "date" | "style" | null;

interface QuickDate {
  key: "weekend" | "next-week" | "any";
  label: string;
  when: string;
}

const QUICK_DATES: Record<QuickDate["key"], QuickDate> = {
  weekend: { key: "weekend", label: "آخر این هفته", when: "7" },
  "next-week": { key: "next-week", label: "هفته آینده", when: "14" },
  any: { key: "any", label: "هر تاریخی", when: "" },
};

/** Labels as in the design; values are the stable category IDs the search API understands. */
const STYLE_OPTIONS: { value: TourCategory | ""; label: string }[] = [
  { value: "", label: "همه سبک‌ها" },
  { value: "nature", label: "طبیعت‌گردی" },
  { value: "adventure", label: "ماجراجویی و کوهنوردی" },
  { value: "historic", label: "تاریخی و فرهنگی" },
  { value: "camping", label: "کمپینگ و کویر" },
  { value: "family", label: "آرام و خانوادگی" },
  { value: "beach", label: CATEGORY_LABELS.beach },
];

/** The tours page filters by "departing within N days"; a picked day maps to the smallest window that contains it. */
const WINDOWS = [7, 14, 30, 60];
function windowFor(day: Date): string {
  const diff = J.daysBetween(J.today(), day);
  const w = WINDOWS.find((n) => n >= diff);
  return w ? String(w) : "";
}

interface DateChoice {
  when: string;
  label: string;
  day: Date | null;
  quick: QuickDate["key"] | null;
}

function useHomeSearch() {
  const navigate = useNavigate();
  const { data: destinations } = useDestinations();
  const [text, setText] = useState("");
  const [destination, setDestination] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [date, setDate] = useState<DateChoice | null>(null);
  const [category, setCategory] = useState<TourCategory | "">("");

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    const q = text.trim();
    if (q) {
      params.set("q", q);
      params.set("mode", "describe");
    }
    if (destination?.id) params.set("destination", destination.id);
    if (date?.when) params.set("when", date.when);
    if (category) params.set("category", category);
    const qs = params.toString();
    navigate(`/tours${qs ? `?${qs}` : ""}`);
  };

  return {
    destinations: destinations ?? [],
    text,
    setText,
    destination,
    setDestination,
    date,
    pickDay: (day: Date) =>
      setDate({
        when: windowFor(day),
        label: J.dayLabel(day),
        day,
        quick: null,
      }),
    pickQuick: (q: QuickDate) =>
      setDate(
        q.key === "any"
          ? null
          : { when: q.when, label: q.label, day: null, quick: q.key },
      ),
    category,
    setCategory,
    styleLabel:
      STYLE_OPTIONS.find((o) => o.value === category)?.label ?? "همه سبک‌ها",
    submit,
  };
}

/** Closes the open dropdown on an outside press or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) closeRef.current();
    };
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && closeRef.current();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return ref;
}

/* ------------------------------------------------------------------ */
/* Icons (inline, matching the design's stroke icons)                  */
/* ------------------------------------------------------------------ */

function SearchIcon({
  className,
  width = 2.5,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={width}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function Chevron({
  dir,
  className,
}: {
  dir: "left" | "right";
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d={dir === "right" ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Jalali calendar dropdown                                             */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

interface CalendarProps {
  variant: "desktop" | "mobile";
  selected: DateChoice | null;
  onPickDay: (day: Date) => void;
  onQuick: (q: QuickDate) => void;
  onClose: () => void;
}

function JalaliCalendar({
  variant,
  selected,
  onPickDay,
  onQuick,
  onClose,
}: CalendarProps) {
  const now = useMemo(J.today, []);
  const [offset, setOffset] = useState(() => {
    if (!selected?.day) return 0;
    let k = 0;
    while (
      k < 24 &&
      J.daysBetween(J.shiftJalaliMonth(now, k + 1), selected.day) >= 0
    )
      k++;
    return k;
  });
  const first = useMemo(() => J.shiftJalaliMonth(now, offset), [now, offset]);
  const days = useMemo(() => J.monthDays(first), [first]);
  const lead = J.weekColumn(first);
  const trail = (7 - ((lead + days.length) % 7)) % 7;
  const desktop = variant === "desktop";

  const pick = (day: Date) => {
    onPickDay(day);
    onClose();
  };
  const quick = (q: QuickDate) => {
    onQuick(q);
    onClose();
  };

  const quickOrder: QuickDate[] = desktop
    ? [QUICK_DATES.weekend, QUICK_DATES["next-week"], QUICK_DATES.any]
    : [QUICK_DATES.any, QUICK_DATES["next-week"], QUICK_DATES.weekend];
  const activeQuick = selected ? selected.quick : "any";

  const grid = (
    <>
      <div
        className={cn(
          "grid grid-cols-7 gap-1 text-center",
          desktop
            ? "mb-1 border-b border-slate-100 py-1 text-[11px] font-bold text-[#1c3c34] dark:border-[#233F36] dark:text-[#6ee7b7]"
            : "border-b border-stone-100 pb-1.5 text-xs font-bold text-stone-400 dark:border-stone-800",
        )}
      >
        {WEEKDAYS.map((w, i) => (
          <span
            key={w}
            className={desktop && i === 6 ? "text-rose-500" : undefined}
          >
            {w}
          </span>
        ))}
      </div>
      <div
        className={cn(
          "grid grid-cols-7 gap-1 text-center text-xs",
          desktop
            ? "justify-items-center font-semibold text-slate-800 dark:text-[#F5F7F6]"
            : "font-medium text-stone-700 dark:text-stone-200",
        )}
      >
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {days.map((day) => {
          const past = J.daysBetween(now, day) < 0;
          const isSelected = J.isSameDay(selected?.day ?? null, day);
          const isToday = J.isSameDay(now, day);
          const friday = J.weekColumn(day) === 6;
          const label = toFaDigits(J.jalaliParts(day).day);
          return (
            <button
              key={day.getTime()}
              type="button"
              disabled={past}
              onClick={() => pick(day)}
              aria-label={J.dayLabel(day)}
              aria-pressed={isSelected}
              className={cn(
                desktop
                  ? cn(
                      "flex size-8 items-center justify-center rounded-lg transition",
                      isSelected
                        ? "bg-[#e8604c] font-black text-white shadow-sm hover:bg-[#d5503d]"
                        : past
                          ? "cursor-not-allowed text-slate-300 dark:text-[#3d554d]"
                          : friday
                            ? "font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            : "text-slate-700 hover:bg-slate-100 dark:text-[#B0BEB9] dark:hover:bg-[#1A2F29]",
                    )
                  : cn(
                      "p-1.5",
                      isSelected
                        ? "rounded-lg bg-[#E05A47] font-bold text-white shadow-sm"
                        : past
                          ? "cursor-not-allowed rounded text-stone-300 dark:text-stone-600"
                          : cn(
                              "rounded hover:bg-stone-100 dark:hover:bg-stone-800",
                              isToday && "font-bold text-[#E05A47]",
                            ),
                    ),
              )}
            >
              {label}
            </button>
          );
        })}
        {Array.from({ length: trail }, (_, i) => (
          <span key={`trail-${i}`} />
        ))}
      </div>
    </>
  );

  if (desktop) {
    return (
      <div
        className="absolute left-1/2 top-full z-50 mt-2 w-[330px] -translate-x-1/2 select-none rounded-2xl border border-slate-200/90 bg-white p-4 text-slate-800 shadow-2xl sm:w-[350px] dark:border-[#233F36] dark:bg-[#132822] dark:text-[#F5F7F6]"
        role="dialog"
        aria-label="انتخاب تاریخ رفت"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-[#233F36]">
          <button
            type="button"
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            aria-label="ماه قبل"
            className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-[#1A2F29]"
          >
            <Chevron dir="right" className="size-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900 sm:text-sm dark:text-[#F5F7F6]">
              {J.monthLabel(first)}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {J.seasonOf(first)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOffset((o) => Math.min(24, o + 1))}
            aria-label="ماه بعد"
            className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#1A2F29]"
          >
            <Chevron dir="left" className="size-4" />
          </button>
        </div>
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-2.5">
          {quickOrder.map((q) => (
            <button
              key={q.key}
              type="button"
              onClick={() => quick(q)}
              className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-[#e8604c] hover:text-white dark:bg-[#1A2F29] dark:text-[#B0BEB9]"
            >
              {q.label}
            </button>
          ))}
        </div>
        <div className="pt-1">{grid}</div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-[#233F36]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-[#768B83] dark:hover:bg-[#1A2F29]"
          >
            بستن
          </button>
          <span className="text-[11px] font-medium text-slate-400 dark:text-[#768B83]">
            تقویم شمسی همسفر
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute left-0 right-0 top-full z-30 mt-2 space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl dark:border-stone-700 dark:bg-[#132822]"
      role="dialog"
      aria-label="انتخاب تاریخ رفت"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            {J.seasonOf(first)}
          </span>
          <span className="text-sm font-bold text-stone-900 dark:text-white">
            {J.monthLabel(first)}
          </span>
        </div>
        <div className="flex items-center">
          {offset > 0 && (
            <button
              type="button"
              onClick={() => setOffset((o) => Math.max(0, o - 1))}
              aria-label="ماه قبل"
              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <Chevron dir="right" className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOffset((o) => Math.min(24, o + 1))}
            aria-label="ماه بعد"
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <Chevron dir="left" className="size-4" />
          </button>
        </div>
      </div>
      <div className="no-scrollbar flex items-center justify-start gap-1.5 overflow-x-auto pt-0.5">
        {quickOrder.map((q) => (
          <button
            key={q.key}
            type="button"
            onClick={() => quick(q)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1 text-xs font-medium",
              activeQuick === q.key
                ? "bg-[#E05A47] text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300",
            )}
          >
            {q.label}
          </button>
        ))}
      </div>
      {grid}
      <div className="flex items-center justify-between border-t border-stone-100 pt-2.5 text-xs dark:border-stone-800">
        <span className="text-[11px] text-stone-400">تقویم شمسی همسفر</span>
        <button
          type="button"
          onClick={onClose}
          className="font-medium text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white"
        >
          بستن
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop: hero smart input + quick search bar                         */
/* ------------------------------------------------------------------ */

function DesktopField({
  icon,
  label,
  open,
  onToggle,
  children,
  panel,
}: {
  icon: ReactNode;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  panel: ReactNode;
}) {
  return (
    <div className="group relative flex-1 select-none border-b border-slate-100 md:border-b-0 md:border-l dark:border-[#233F36]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-right"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition group-hover:bg-rose-50 group-hover:text-[#e8604c] dark:bg-[#0D1714] dark:text-[#768B83] dark:group-hover:bg-rose-500/10">
          {icon}
        </span>
        <span className="min-w-0 flex-1 text-right">
          <span className="mb-0.5 block text-[11px] font-bold text-slate-400 dark:text-[#768B83]">
            {label}
          </span>
          <span className="flex items-center justify-between">
            {children}
            <ChevronDown className="mr-1 size-4 shrink-0 text-slate-400 transition-transform group-hover:text-slate-600 dark:text-[#768B83]" />
          </span>
        </span>
      </button>
      {open && panel}
    </div>
  );
}

function DesktopOptionList({
  heading,
  options,
  onPick,
}: {
  heading?: string;
  options: { key: string; label: string }[];
  onPick: (key: string) => void;
}) {
  return (
    <div
      role="listbox"
      className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-slate-200/90 bg-white p-2 text-slate-800 shadow-2xl dark:border-[#233F36] dark:bg-[#132822] dark:text-[#F5F7F6]"
    >
      {heading && (
        <div className="mb-1 border-b border-slate-100 pb-2 pt-1 text-center dark:border-[#233F36]">
          <span className="text-[11px] font-bold text-slate-400 dark:text-[#768B83]">
            {heading}
          </span>
        </div>
      )}
      <div className="no-scrollbar flex max-h-60 flex-col space-y-1 overflow-y-auto text-center">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            role="option"
            aria-selected={false}
            onClick={() => onPick(o.key)}
            className="flex w-full items-center justify-center rounded-xl px-3 py-2 text-center text-xs font-semibold text-slate-800 transition hover:bg-slate-100 hover:text-[#e8604c] sm:text-sm dark:text-[#F5F7F6] dark:hover:bg-[#1A2F29]"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DesktopHeroSearch() {
  const s = useHomeSearch();
  const [panel, setPanel] = useState<Panel>(null);
  const barRef = useDismiss(panel !== null, () => setPanel(null));
  const inputId = useId();
  const toggle = (p: Exclude<Panel, null>) =>
    setPanel((cur) => (cur === p ? null : p));

  const destinationOptions = [
    { key: "", label: "همه مقصدها" },
    ...s.destinations.map((d) => ({ key: d.id, label: d.name })),
  ];

  return (
    <>
      {/* Primary hero actions */}
      <form
        onSubmit={s.submit}
        role="search"
        aria-label="جست‌وجوی توصیفی تور"
        className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-3 px-2 sm:flex-row"
      >
        <div className="relative flex w-full flex-1 items-center rounded-2xl border border-white/20 bg-white/95 p-1.5 shadow-xl backdrop-blur-md transition-all duration-300 focus-within:ring-2 focus-within:ring-[#e8604c]">
          <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-1 text-right">
            <div className="mb-0.5 flex items-center gap-1.5">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-[#e8604c]" />
              <label
                htmlFor={inputId}
                className="cursor-pointer select-none text-[11px] font-bold text-slate-500"
              >
                تور دلخواهت رو توصیف کن
              </label>
            </div>
            <input
              id={inputId}
              type="text"
              value={s.text}
              onChange={(e) => s.setText(e.target.value)}
              maxLength={300}
              autoComplete="off"
              placeholder="مثلاً: سفر آرام کویری با عکاسی شب و اقامت بومگردی..."
              className="w-full truncate border-none bg-transparent p-0 text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#e8604c] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#e8604c]/30 transition hover:bg-[#d5503d] active:scale-95 sm:px-6 sm:py-3 sm:text-sm"
          >
            <SearchIcon className="size-4" />
            <span>کشف تورها</span>
          </button>
        </div>
        <Link
          to="/planner"
          className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-white/20 bg-white/15 px-5 py-3 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 sm:w-auto sm:text-sm"
        >
          <span className="text-base leading-none">+</span>
          <span>ساخت تور</span>
        </Link>
      </form>

      {/* Quick search bar */}
      <div
        ref={barRef}
        className="relative z-50 mx-auto mt-12 flex max-w-4xl flex-col items-stretch gap-2 rounded-3xl border border-slate-100 bg-white p-3 text-slate-800 shadow-2xl md:flex-row dark:border-[#25453B] dark:bg-[#132822] dark:text-[#F5F7F6]"
      >
        <DesktopField
          label="مقصد"
          open={panel === "destination"}
          onToggle={() => toggle("destination")}
          icon={
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
          panel={
            <DesktopOptionList
              heading="مقصدهای محبوب پیشنهادی"
              options={destinationOptions}
              onPick={(key) => {
                const d = s.destinations.find((x) => x.id === key);
                s.setDestination(d ? { id: d.id, label: d.name } : null);
                setPanel(null);
              }}
            />
          }
        >
          <span
            className={cn(
              "block min-w-0 flex-1 truncate text-xs font-bold sm:text-sm",
              s.destination
                ? "text-slate-800 dark:text-[#F5F7F6]"
                : "text-slate-400 dark:text-[#768B83]",
            )}
          >
            {s.destination?.label ?? "مثلاً قلعه الموت، هرمز، کویر"}
          </span>
        </DesktopField>

        <DesktopField
          label="تاریخ رفت"
          open={panel === "date"}
          onToggle={() => toggle("date")}
          icon={
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          panel={
            <JalaliCalendar
              variant="desktop"
              selected={s.date}
              onPickDay={s.pickDay}
              onQuick={s.pickQuick}
              onClose={() => setPanel(null)}
            />
          }
        >
          <span className="block truncate text-xs font-bold text-slate-800 sm:text-sm dark:text-[#F5F7F6]">
            {s.date?.label ?? "هر تاریخی"}
          </span>
        </DesktopField>

        <DesktopField
          label="سبک سفر"
          open={panel === "style"}
          onToggle={() => toggle("style")}
          icon={
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          }
          panel={
            <DesktopOptionList
              options={STYLE_OPTIONS.map((o) => ({
                key: o.value,
                label: o.label,
              }))}
              onPick={(key) => {
                s.setCategory(key as TourCategory | "");
                setPanel(null);
              }}
            />
          }
        >
          <span className="block flex-1 truncate text-right text-xs font-bold text-slate-800 sm:text-sm dark:text-[#F5F7F6]">
            {s.styleLabel}
          </span>
        </DesktopField>

        <button
          type="button"
          onClick={() => s.submit()}
          className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#e8604c] px-8 py-3.5 font-bold text-white shadow-md shadow-[#e8604c]/30 transition hover:bg-[#d5503d] active:scale-95"
        >
          <SearchIcon className="size-5" />
          <span className="text-sm">جستجو</span>
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile: smart search card                                            */
/* ------------------------------------------------------------------ */

function MobileField({
  icon,
  label,
  value,
  open,
  onToggle,
  panel,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  panel: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-stone-200/70 bg-stone-50 p-2.5 text-right dark:border-stone-700/60 dark:bg-[#1B332B]/60"
      >
        <span className="flex items-center gap-2.5">
          {icon}
          <span>
            <span className="block text-[10px] font-medium text-stone-400">
              {label}
            </span>
            <span className="block text-xs font-bold text-stone-800 dark:text-stone-100">
              {value}
            </span>
          </span>
        </span>
        <ChevronDown className="size-4 text-stone-400" />
      </button>
      {open && panel}
    </div>
  );
}

export function MobileSearchCard() {
  const s = useHomeSearch();
  const [panel, setPanel] = useState<Panel>(null);
  const cardRef = useDismiss(panel !== null, () => setPanel(null));
  const inputId = useId();
  const toggle = (p: Exclude<Panel, null>) =>
    setPanel((cur) => (cur === p ? null : p));
  const now = useMemo(J.today, []);
  const defaultDate = `${J.monthName(now)} یا ${J.monthName(J.shiftJalaliMonth(now, 1))} ${toFaDigits(J.jalaliYear(now))} (انتخاب تاریخ)`;

  const menuItem =
    "cursor-pointer py-1 text-xs font-bold text-stone-900 transition hover:text-[#E05A47] dark:text-white";

  return (
    <section className="-mt-2 px-4">
      <div
        ref={cardRef}
        className="space-y-3.5 rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm transition-colors dark:border-stone-800 dark:bg-[#132822]"
      >
        {/* Descriptive search */}
        <form
          onSubmit={s.submit}
          role="search"
          aria-label="جست‌وجوی توصیفی تور"
          className="relative"
        >
          <div className="mb-1.5 flex items-center justify-between px-1">
            <label
              htmlFor={inputId}
              className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 dark:text-stone-300"
            >
              <span className="size-2 rounded-full bg-[#E05A47]" />
              تور دلخواهت رو توصیف کن
            </label>
            <span className="text-[10px] text-stone-400">جستجوی هوشمند</span>
          </div>
          <div className="relative flex items-center">
            <input
              id={inputId}
              type="text"
              value={s.text}
              onChange={(e) => s.setText(e.target.value)}
              maxLength={300}
              autoComplete="off"
              placeholder="مثلاً: سفر آرام کویری با عکاسی شب ..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-16 pr-3.5 text-xs text-stone-800 placeholder-stone-400 focus:border-[#E05A47] focus:outline-none focus:ring-2 focus:ring-[#E05A47]/40 dark:border-stone-700/80 dark:bg-[#1B332B] dark:text-white"
            />
            <button
              type="submit"
              className="absolute bottom-1.5 left-1.5 top-1.5 flex items-center justify-center rounded-lg bg-[#E05A47] px-3 text-xs font-medium text-white"
            >
              جستجو
            </button>
          </div>
        </form>

        <div className="h-px bg-stone-100 dark:bg-stone-800" />

        {/* Structured search */}
        <div className="space-y-2.5">
          <MobileField
            className="z-30"
            label="مقصد"
            value={s.destination?.label ?? "قلعه الموت، هرمز یا کویر"}
            open={panel === "destination"}
            onToggle={() => toggle("destination")}
            icon={
              <svg
                className="size-5 shrink-0 stroke-[1.8] text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
            }
            panel={
              <div
                role="listbox"
                className="absolute left-0 right-0 top-full z-50 mt-2 w-full space-y-2.5 rounded-2xl border border-stone-200 bg-white px-3 py-3 text-center shadow-lg dark:border-stone-700 dark:bg-[#1B332B]"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={!s.destination}
                  className={cn(menuItem, "block w-full")}
                  onClick={() => {
                    s.setDestination(null);
                    setPanel(null);
                  }}
                >
                  همه مقصدها (ایران‌گردی)
                </button>
                {s.destinations.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    role="option"
                    aria-selected={s.destination?.id === d.id}
                    className={cn(menuItem, "block w-full")}
                    onClick={() => {
                      s.setDestination({ id: d.id, label: d.name });
                      setPanel(null);
                    }}
                  >
                    {d.name} ({d.province})
                  </button>
                ))}
              </div>
            }
          />

          <MobileField
            className={panel === "date" ? "z-30" : undefined}
            label="تاریخ رفت"
            value={s.date?.label ?? defaultDate}
            open={panel === "date"}
            onToggle={() => toggle("date")}
            icon={
              <svg
                className="size-5 stroke-[1.8] text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
            }
            panel={
              <JalaliCalendar
                variant="mobile"
                selected={s.date}
                onPickDay={s.pickDay}
                onQuick={s.pickQuick}
                onClose={() => setPanel(null)}
              />
            }
          />

          <MobileField
            className={panel === "style" ? "z-30" : undefined}
            label="سبک سفر"
            value={
              s.category
                ? s.styleLabel
                : "همه سبک‌ها (کوهنوردی، کویر، بومگردی...)"
            }
            open={panel === "style"}
            onToggle={() => toggle("style")}
            icon={
              <svg
                className="size-5 stroke-[1.8] text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.386a8.552 8.552 0 003.546-3.546c.486-.827.313-1.908-.386-2.607l-9.581-9.581A2.25 2.25 0 009.568 3z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6h.008v.008H6V6z"
                />
              </svg>
            }
            panel={
              <div
                role="listbox"
                className="absolute left-0 top-full z-40 mt-2 w-48 space-y-3 rounded-2xl border border-stone-200 bg-white px-3 py-3 text-center shadow-2xl dark:border-stone-700 dark:bg-[#132822]"
              >
                {STYLE_OPTIONS.map((o) => (
                  <button
                    key={o.value || "all"}
                    type="button"
                    role="option"
                    aria-selected={s.category === o.value}
                    className={cn(menuItem, "block w-full py-0")}
                    onClick={() => {
                      s.setCategory(o.value);
                      setPanel(null);
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            }
          />

          <button
            type="button"
            onClick={() => s.submit()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E05A47] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#c94a38] active:scale-[0.98]"
          >
            <SearchIcon className="size-4" />
            <span>جستجوی تورهای همسفر</span>
          </button>
        </div>
      </div>
    </section>
  );
}
