import { useState, type FormEvent, type ReactNode } from "react";
import {
  CalendarDays,
  ChevronDown,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import heroImage from "@/assets/images/hero-lake-road.webp";
import type { TourCategory } from "@/features/tours/api/tour-schemas";
import { useDestinations } from "@/features/tours/hooks";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { JalaliDatePicker } from "@/shared/ui/JalaliDatePicker";
import { Popover } from "@/shared/ui/Popover";

/* Figma «Dropdown Style Options Popup» (59:4735) labels → category IDs. */
const STYLES: { value: TourCategory | ""; label: string }[] = [
  { value: "", label: "همه سبک‌ها" },
  { value: "nature", label: "طبیعت‌گردی" },
  { value: "adventure", label: "ماجراجویی و کوهنوردی" },
  { value: "historic", label: "تاریخی و فرهنگی" },
  { value: "camping", label: "کمپینگ و کویر" },
  { value: "family", label: "آرام و خانوادگی" },
  { value: "beach", label: "ساحلی و جزیره" },
];

function FieldTrigger({
  icon,
  label,
  value,
  placeholder,
  ...rest
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
  placeholder: string;
  onClick: () => void;
  "aria-expanded": boolean;
  "aria-controls": string;
}) {
  return (
    <button
      type="button"
      {...rest}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition hover:bg-slate-50 dark:hover:bg-white/5"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/80">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium text-slate-500 dark:text-ink-muted">
          {label}
        </span>
        <span
          className={cn(
            "mt-0.5 block truncate text-sm font-bold",
            value ? "text-slate-900 dark:text-white" : "text-slate-400",
          )}
        >
          {value ?? placeholder}
        </span>
      </span>
      <ChevronDown
        className="size-4 shrink-0 text-slate-400"
        aria-hidden="true"
      />
    </button>
  );
}

/** Home hero — Figma frame 28:5555 top: kicker, headline, smart-search pill and the 3-field search card. */
export function HomeHero() {
  const navigate = useNavigate();
  const { data: destinations } = useDestinations();
  const [describe, setDescribe] = useState("");
  const [destination, setDestination] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [style, setStyle] = useState<TourCategory | "">("");

  const smartSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = describe.trim();
    navigate(
      q.length >= 2
        ? `/tours?q=${encodeURIComponent(q)}&mode=describe`
        : "/tours",
    );
  };

  const search = (e: FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (destination) p.set("destination", destination.id);
    if (date) p.set("from", date);
    if (style) p.set("category", style);
    navigate(`/tours${p.toString() ? `?${p}` : ""}`);
  };

  return (
    <section
      className="relative z-20 bg-[#1c3c34]"
      aria-labelledby="hero-title"
    >
      <img
        src={heroImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(15,35,30,0.55)] via-[rgba(15,35,30,0.35)] to-[rgba(15,35,30,0.75)]" />
      <div className="relative mx-auto max-w-page px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20 lg:px-8 lg:pb-24">
        <p className="inline-flex rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-800">
          سفرهای بعدی همین‌جاست
        </p>
        <h1
          id="hero-title"
          className="mx-auto mt-4 max-w-3xl text-[2rem] font-black leading-[1.35] text-white sm:text-5xl sm:leading-[1.3]"
        >
          همسفرهایت را پیدا کن،
          <br />
          سفر را با هم بسازید
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/85 sm:text-base">
          تورهای گروهی واقعی با برنامه روزانه شفاف، ظرفیت مشخص و آدم‌هایی که مثل
          شما سفر را دوست دارند.
        </p>

        {/* Smart search pill */}
        <div className="mx-auto mt-7 flex max-w-2xl flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <form
            onSubmit={smartSearch}
            role="search"
            aria-label="جست‌وجوی هوشمند"
            className="flex flex-1 items-center gap-2 rounded-2xl bg-white p-1.5 shadow-float dark:bg-surface-raised"
          >
            <label
              htmlFor="hero-describe"
              className="min-w-0 flex-1 ps-2 text-start"
            >
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                <Sparkles
                  className="size-3 text-[#e8604c]"
                  aria-hidden="true"
                />
                سفر دلخواهت را توصیف کن
              </span>
              <input
                id="hero-describe"
                value={describe}
                onChange={(e) => setDescribe(e.target.value)}
                maxLength={300}
                placeholder="مثلاً سفر کم‌هزینه کویری با عکاسی شب و اقامت بومگردی..."
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#e8604c] px-4 text-sm font-bold text-white transition hover:bg-coral-600"
            >
              <Search className="size-4" aria-hidden="true" />
              کشف تورها
            </button>
          </form>
          <Link
            to="/planner"
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Plus className="size-4" aria-hidden="true" />
            ساخت تور
          </Link>
        </div>

        {/* Search card: destination · date · style */}
        <form
          onSubmit={search}
          role="search"
          aria-label="جست‌وجوی تور"
          className="mx-auto mt-6 grid max-w-4xl gap-2 rounded-3xl bg-white p-2 text-start shadow-float sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-center dark:bg-surface-raised"
        >
          <Popover
            panelClassName="start-0 w-64"
            trigger={(p) => (
              <FieldTrigger
                {...p}
                icon={<MapPin className="size-4" />}
                label="مقصد"
                value={destination?.name ?? null}
                placeholder="مثلاً قلعه الموت، هرمز"
              />
            )}
          >
            {(close) => (
              <div
                className="max-h-80 overflow-y-auto overscroll-contain p-2"
                role="listbox"
                aria-label="مقصدهای محبوب پیشنهادی"
              >
                <p className="px-2 pb-1 pt-1 text-[11px] font-bold text-slate-400">
                  مقصدهای محبوب پیشنهادی
                </p>
                <button
                  type="button"
                  role="option"
                  aria-selected={!destination}
                  onClick={() => {
                    setDestination(null);
                    close();
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  همه مقصدها
                </button>
                {(destinations ?? []).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    role="option"
                    aria-selected={destination?.id === d.id}
                    onClick={() => {
                      setDestination({ id: d.id, name: d.name });
                      close();
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm hover:bg-slate-50 dark:hover:bg-white/5",
                      destination?.id === d.id && "font-bold text-[#e8604c]",
                    )}
                  >
                    <MapPin
                      className="size-3.5 text-slate-400"
                      aria-hidden="true"
                    />
                    {d.name}
                    <span className="ms-auto text-[11px] text-slate-400">
                      {d.province}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Popover>
          <Popover
            panelClassName="start-0"
            trigger={(p) => (
              <FieldTrigger
                {...p}
                icon={<CalendarDays className="size-4" />}
                label="تاریخ رفت"
                value={date ? formatDate(date) : null}
                placeholder="هر تاریخی"
              />
            )}
          >
            {(close) => (
              <div>
                <JalaliDatePicker
                  value={date}
                  onChange={(iso) => {
                    setDate(iso);
                    close();
                  }}
                />
                {date && (
                  <button
                    type="button"
                    onClick={() => {
                      setDate(null);
                      close();
                    }}
                    className="w-full border-t border-slate-100 py-2 text-xs font-bold text-[#e8604c]"
                  >
                    هر تاریخی
                  </button>
                )}
              </div>
            )}
          </Popover>
          <Popover
            panelClassName="start-0 w-56"
            trigger={(p) => (
              <FieldTrigger
                {...p}
                icon={<Tag className="size-4" />}
                label="سبک سفر"
                value={STYLES.find((s) => s.value === style)?.label ?? null}
                placeholder="همه سبک‌ها"
              />
            )}
          >
            {(close) => (
              <div className="p-2" role="listbox" aria-label="سبک سفر">
                {STYLES.map((s) => (
                  <button
                    key={s.value || "all"}
                    type="button"
                    role="option"
                    aria-selected={style === s.value}
                    onClick={() => {
                      setStyle(s.value);
                      close();
                    }}
                    className={cn(
                      "block w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-slate-50 dark:hover:bg-white/5",
                      style === s.value && "font-bold text-[#e8604c]",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </Popover>
          <button
            type="submit"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#e8604c] px-8 text-sm font-bold text-white shadow-cta transition hover:bg-coral-600 sm:col-span-2 lg:col-span-1"
          >
            <Search className="size-5" aria-hidden="true" />
            جستجو
          </button>
        </form>
      </div>
    </section>
  );
}
