import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Clock3, MapPin, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { safeStorage } from "@/shared/lib/storage";
import { Spinner } from "@/shared/ui/Spinner";
import type { Destination } from "../api/tour-schemas";

export type SearchMode = "keyword" | "smart";

interface Suggestion {
  id: string;
  kind: "recent" | "example" | "destination";
  label: string;
  /** Text placed in the box (recent/example) or destination ID. */
  value: string;
  mode: SearchMode;
}

const RECENT_KEY = "hamsafar:recent-searches";
const MAX_RECENT = 5;

export const SMART_EXAMPLES = [
  "کمپینگ آخر هفته در کویر با بودجه ۳ میلیون",
  "سفر خانوادگی آرام کنار دریا برای عید",
  "طبیعت‌گردی جنگلی دو روزه نزدیک تهران",
  "سفر تاریخی و فرهنگی به اصفهان برای مبتدی‌ها",
];

function readRecent(): { q: string; mode: SearchMode }[] {
  try {
    const parsed: unknown = JSON.parse(safeStorage.get(RECENT_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is { q: string; mode: SearchMode } =>
          !!x &&
          typeof x.q === "string" &&
          (x.mode === "smart" || x.mode === "keyword"),
      )
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function saveRecent(q: string, mode: SearchMode) {
  const next = [{ q, mode }, ...readRecent().filter((r) => r.q !== q)].slice(
    0,
    MAX_RECENT,
  );
  safeStorage.set(RECENT_KEY, JSON.stringify(next));
}

interface SearchBoxProps {
  initialText: string;
  initialMode: SearchMode;
  destinations: readonly Destination[] | undefined;
  /** True while results for the submitted query are loading. */
  searching?: boolean;
  onSearch: (q: string, mode: SearchMode) => void;
  onPickDestination: (destinationId: string) => void;
  /**
   * `toolbar` = Figma «Filtering Toolbar»: one row with the search field (2 columns), the filter
   * selects passed as `children`, and the submit button. `card` = stacked layout with mode tabs.
   */
  layout?: "card" | "toolbar";
  children?: ReactNode;
  submitLabel?: string;
}

/**
 * Search field with two modes:
 * - «جست‌وجوی عادی»: keywords in title/destination; suggests matching destinations.
 * - «جست‌وجوی هوشمند»: free-text trip description analysed by POST /search/describe.
 * ARIA combobox with keyboard navigation (↑ ↓ Enter Escape) and recent searches.
 */
export function SearchBox({
  initialText,
  initialMode,
  destinations,
  searching,
  onSearch,
  onPickDestination,
  layout = "card",
  children,
  submitLabel = "جست‌وجو",
}: SearchBoxProps) {
  const [text, setText] = useState(initialText);
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState(readRecent);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const hintId = useId();

  useEffect(() => setText(initialText), [initialText]);
  useEffect(() => setMode(initialMode), [initialMode]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = text.trim();
    const out: Suggestion[] = [];
    if (mode === "keyword" && q) {
      for (const d of destinations ?? []) {
        if (d.name.includes(q) || d.province.includes(q))
          out.push({
            id: `d-${d.id}`,
            kind: "destination",
            label: `${d.name}، ${d.province}`,
            value: d.id,
            mode,
          });
      }
    }
    for (const r of recent) {
      if (r.mode === mode && (!q || r.q.includes(q)) && r.q !== q)
        out.push({
          id: `r-${r.q}`,
          kind: "recent",
          label: r.q,
          value: r.q,
          mode: r.mode,
        });
    }
    if (mode === "smart" && !q)
      for (const e of SMART_EXAMPLES)
        out.push({ id: `e-${e}`, kind: "example", label: e, value: e, mode });
    return out.slice(0, 7);
  }, [text, mode, destinations, recent]);

  const run = (q: string, m: SearchMode) => {
    const trimmed = q.trim();
    setOpen(false);
    setActive(-1);
    if (trimmed) {
      saveRecent(trimmed, m);
      setRecent(readRecent());
    }
    onSearch(trimmed, m);
  };

  const choose = (s: Suggestion) => {
    if (s.kind === "destination") {
      setText("");
      setOpen(false);
      onPickDestination(s.value);
      return;
    }
    setText(s.value);
    run(s.value, s.mode);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const picked = active >= 0 ? suggestions[active] : undefined;
    if (open && picked) choose(picked);
    else run(text, mode);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  const showList = open && suggestions.length > 0;
  const smartError = mode === "smart" && text.trim().length === 1;
  const toolbar = layout === "toolbar";
  const toggleMode = (id: SearchMode) => {
    setMode(id);
    setActive(-1);
    inputRef.current?.focus();
  };

  const field = (
    <div className={cn("relative", toolbar ? "lg:col-span-2" : "flex-1")}>
      <label htmlFor="tours-q" className="sr-only">
        {mode === "smart"
          ? "سفر دلخواهت را توصیف کن"
          : "جست‌وجوی مقصد، هتل، جاذبه یا فعالیت"}
      </label>
      {!toolbar &&
        (mode === "smart" ? (
          <Sparkles
            className="pointer-events-none absolute start-4 top-6 size-5 -translate-y-1/2 text-coral-500"
            aria-hidden="true"
          />
        ) : (
          <Search
            className="pointer-events-none absolute start-4 top-6 size-5 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          />
        ))}
      <input
        ref={inputRef}
        id="tours-q"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showList && active >= 0 ? `${listId}-${active}` : undefined
        }
        aria-describedby={hintId}
        aria-invalid={smartError || undefined}
        autoComplete="off"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        placeholder={
          mode === "smart"
            ? "سفرت را توصیف کن؛ مثلاً کمپینگ آخر هفته در کویر با بودجه ۳ میلیون"
            : toolbar
              ? "جست‌وجوی مقصد، هتل، جاذبه یا فعالیت..."
              : "نام تور، مقصد یا استان..."
        }
        maxLength={300}
        className={cn(
          "w-full border bg-surface text-sm text-ink outline-none transition placeholder:text-slate-500 focus:ring-4 dark:placeholder:text-ink-soft",
          toolbar
            ? "h-[42px] rounded-xl ps-[17px] pe-[7.5rem] font-medium"
            : "h-12 rounded-xl ps-12 pe-11",
          smartError
            ? "border-danger focus:ring-danger/15"
            : "border-slate-200 focus:border-forest-400 focus:ring-forest-500/10 dark:border-line",
        )}
      />
      <div
        className={cn(
          "absolute end-1.5 flex items-center gap-1",
          toolbar ? "top-[21px] -translate-y-1/2" : "top-6 -translate-y-1/2",
        )}
      >
        {searching ? (
          <Spinner className="me-2 size-4 text-ink-soft" />
        ) : (
          text && (
            <button
              type="button"
              aria-label="پاک کردن متن"
              onClick={() => {
                setText("");
                inputRef.current?.focus();
              }}
              className="inline-flex size-7 items-center justify-center rounded-full text-ink-soft hover:bg-surface-muted hover:text-ink"
            >
              <X className="size-4" />
            </button>
          )
        )}
        {toolbar && (
          <button
            type="button"
            aria-pressed={mode === "smart"}
            onClick={() => toggleMode(mode === "smart" ? "keyword" : "smart")}
            title="جست‌وجوی هوشمند: سفرت را به زبان ساده توصیف کن"
            className={cn(
              "inline-flex h-[30px] items-center gap-1 rounded-lg px-2 text-[11px] font-bold transition",
              mode === "smart"
                ? "bg-coral-50 text-coral-600 dark:bg-coral-500/15 dark:text-coral-300"
                : "bg-surface-muted text-ink-muted hover:text-ink",
            )}
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            هوشمند
          </button>
        )}
      </div>
      <p
        id={hintId}
        className={cn(
          "px-1 text-[11px]",
          toolbar
            ? smartError
              ? "mt-1 text-danger"
              : "sr-only"
            : cn("mt-1.5", smartError ? "text-danger" : "text-ink-soft"),
        )}
      >
        {smartError
          ? "برای جست‌وجوی هوشمند حداقل ۲ حرف بنویسید."
          : mode === "smart"
            ? "مقصد، زمان، بودجه، سبک یا همراهانت را به زبان ساده بنویس؛ ما فیلترها را تشخیص می‌دهیم."
            : "در نام تور، مقصد و استان جست‌وجو می‌شود."}
      </p>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="پیشنهادها"
          className={cn(
            "absolute inset-x-0 z-drawer max-h-80 overflow-auto rounded-2xl border border-line bg-surface-raised p-1.5 shadow-float",
            toolbar ? "top-[46px]" : "top-[3.25rem]",
          )}
        >
          {suggestions.map((s, i) => {
            const Icon =
              s.kind === "destination"
                ? MapPin
                : s.kind === "recent"
                  ? Clock3
                  : Sparkles;
            return (
              <li
                key={s.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(s)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm",
                  i === active ? "bg-surface-muted text-ink" : "text-ink-muted",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    s.kind === "example" ? "text-coral-500" : "text-ink-soft",
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                <span className="shrink-0 text-[10px] text-ink-soft">
                  {s.kind === "destination"
                    ? "مقصد"
                    : s.kind === "recent"
                      ? "اخیر"
                      : "نمونه"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  if (toolbar) {
    return (
      <form
        onSubmit={submit}
        role="search"
        aria-label="جست‌وجو و فیلتر تورها"
        className="grid gap-3 rounded-2xl border border-slate-200/80 bg-surface p-[17px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] sm:grid-cols-2 lg:grid-cols-6 dark:border-line"
      >
        {field}
        {children}
        <button
          type="submit"
          disabled={smartError}
          className="h-[42px] rounded-xl bg-[#e8604c] text-sm font-bold text-white shadow-sm transition hover:bg-coral-600 disabled:opacity-60 sm:col-span-2 lg:col-span-1"
        >
          {submitLabel}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label="جست‌وجوی تور"
      className="rounded-[1.4rem] border border-line bg-surface p-3 shadow-float sm:p-4"
    >
      <div
        role="radiogroup"
        aria-label="نوع جست‌وجو"
        className="mb-3 inline-flex rounded-xl bg-surface-muted p-1"
      >
        {(
          [
            { id: "smart", label: "جست‌وجوی هوشمند", icon: Sparkles },
            { id: "keyword", label: "جست‌وجوی عادی", icon: Search },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={mode === id}
            onClick={() => toggleMode(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition sm:px-4 sm:text-sm",
              mode === id
                ? "bg-surface text-forest-800 shadow-sm dark:text-white"
                : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon
              className={cn(
                "size-4",
                id === "smart" && mode === id && "text-coral-500",
              )}
              aria-hidden="true"
            />
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        {field}
        <button
          type="submit"
          disabled={smartError}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-coral-500 px-8 text-sm font-bold text-white shadow-cta transition hover:bg-coral-600 disabled:opacity-60"
        >
          {mode === "smart" ? (
            <Sparkles className="size-[18px]" aria-hidden="true" />
          ) : (
            <Search className="size-[18px]" aria-hidden="true" />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
