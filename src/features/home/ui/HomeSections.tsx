import {
  ArrowLeft,
  Check,
  FileText,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { Link } from "react-router";
import hikerImage from "@/assets/images/inspire-hiker.webp";
import { FavoriteButton } from "@/features/favorites/ui/FavoriteButton";
import { useFeaturedTours } from "@/features/tours/hooks";
import { TourCard, TourCardSkeleton } from "@/features/tours/ui/TourCard";
import { EmptyState, ErrorState } from "@/shared/ui/StateViews";

function SectionTitle({
  id,
  kicker,
  title,
  action,
}: {
  id: string;
  kicker: string;
  title: string;
  action?: { to: string; label: string; arrow?: boolean };
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-bold text-[#e8604c]">{kicker}</p>
        <h2
          id={id}
          className="mt-1 text-2xl font-black text-slate-900 sm:text-[28px] dark:text-white"
        >
          {title}
        </h2>
      </div>
      {action && (
        <Link
          to={action.to}
          className={
            action.arrow
              ? "inline-flex items-center gap-1 text-sm font-bold text-slate-700 hover:text-[#e8604c] dark:text-white/80"
              : "rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-white/85"
          }
        >
          {action.label}
          {action.arrow && <ArrowLeft className="size-4" aria-hidden="true" />}
        </Link>
      )}
    </div>
  );
}

/* Figma «مقصدهای محبوب» — five photo tiles leading to filtered search. */
const POPULAR = [
  {
    label: "جزایر جنوب",
    image: "/images/tours/dest-qeshm.webp",
    to: "/tours?category=beach",
  },
  {
    label: "بافت تاریخی",
    image: "/images/tours/dest-isfahan.webp",
    to: "/tours?category=historic",
  },
  {
    label: "کویر مرکزی",
    image: "/images/tours/tour-mesr-desert.webp",
    to: "/tours?category=camping",
  },
  {
    label: "قلعه‌های قزوین",
    image: "/images/tours/tour-shirom-canyon.webp",
    to: "/tours?q=%D9%82%D8%B2%D9%88%DB%8C%D9%86",
  },
  {
    label: "جنگل‌های هیرکانی",
    image: "/images/tours/tour-hyrcanian-forest.webp",
    to: "/tours?category=nature",
  },
];

export function PopularDestinations() {
  return (
    <section
      aria-labelledby="popular-title"
      className="mx-auto max-w-page px-4 pt-14 sm:px-6 lg:px-8"
    >
      <SectionTitle
        id="popular-title"
        kicker="یک مقصد، هزار قصه"
        title="مقصدهای محبوب"
        action={{ to: "/tours", label: "مشاهده همه" }}
      />
      <ul className="no-scrollbar -mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {POPULAR.map((p) => (
          <li
            key={p.label}
            className="w-[42%] shrink-0 snap-start sm:w-[30%] lg:w-auto"
          >
            <Link
              to={p.to}
              className="group relative block aspect-[4/3] overflow-hidden rounded-2xl"
            >
              <img
                src={p.image}
                alt=""
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <span className="absolute bottom-3 start-3 text-sm font-black text-white">
                {p.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FeaturedToursSection() {
  const { data, isPending, isError, error, refetch } = useFeaturedTours();
  return (
    <section
      aria-labelledby="featured-title"
      className="mx-auto max-w-page px-4 pt-14 sm:px-6 lg:px-8"
    >
      <SectionTitle
        id="featured-title"
        kicker="سفرهای منتخب و در حال تکمیل"
        title="تورهای پیشنهادی"
        action={{ to: "/tours", label: "دیدن تمام تورها", arrow: true }}
      />
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isPending &&
          Array.from({ length: 4 }, (_, i) => <TourCardSkeleton key={i} />)}
        {isError && (
          <ErrorState
            className="sm:col-span-2 lg:col-span-4"
            error={error}
            text="دریافت تورهای پیشنهادی ممکن نشد."
            onRetry={() => void refetch()}
          />
        )}
        {data?.length === 0 && (
          <EmptyState
            className="sm:col-span-2 lg:col-span-4"
            title="فعلاً تور فعالی نداریم"
            text="به‌زودی تورهای تازه اضافه می‌شوند."
          />
        )}
        {data?.slice(0, 4).map((t) => (
          <TourCard
            key={t.id}
            tour={t}
            action={<FavoriteButton tour={t} />}
            className="h-full"
          />
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "۱",
    title: "تور مناسب را کشف کن",
    text: "بر اساس مقصد، بودجه، تاریخ و سبک سفر جست‌وجو کن.",
  },
  {
    n: "۲",
    title: "درخواست عضویت بده",
    text: "پروفایل برگزارکننده و برنامه روزبه‌روز را ببین و با خیال راحت بپیوند.",
  },
  {
    n: "۳",
    title: "با اکیپ راهی شو",
    text: "برنامه، چت هماهنگی و هزینه‌ها را یکجا و مطمئن مدیریت کن.",
  },
];

/* Figma «سه قدم تا یک سفر متفاوت» — dark rounded band with three numbered steps. */
export function StepsBand() {
  return (
    <section
      aria-labelledby="steps-title"
      className="mx-auto max-w-page px-4 pt-16 sm:px-6 lg:px-8"
    >
      <div className="grid gap-8 rounded-[2rem] bg-[#1c3c34] p-8 text-white sm:p-10 lg:grid-cols-[1fr_2.2fr] lg:items-center dark:bg-[#12291f]">
        <div>
          <p className="text-xs font-bold text-[#f59e8b]">ساده، شفاف و همراه</p>
          <h2
            id="steps-title"
            className="mt-2 text-3xl font-black leading-[1.4]"
          >
            سه قدم تا یک سفر متفاوت
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/75">
            از پیدا کردن تور تا تسویه‌حساب، همه چیز در یک مسیر آرام، شفاف و
            مطمئن رخ می‌دهد.
          </p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-sm font-black">
                {s.n}
              </span>
              <h3 className="mt-4 text-sm font-black">{s.title}</h3>
              <p className="mt-2 text-xs leading-6 text-white/70">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const POINTS = [
  {
    icon: Check,
    title: "بررسی تور پیش از انتشار",
    text: "تورهای ساخته‌شده پس از بررسی مدیریت در دسترس قرار می‌گیرند.",
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: UserRoundCheck,
    title: "پروفایل و امتیاز واقعی",
    text: "فقط همسفرهای همان تور می‌توانند بعد از سفر نظر ثبت کنند.",
    tone: "bg-sky-50 text-sky-600",
  },
  {
    icon: FileText,
    title: "برنامه و هزینه شفاف",
    text: "از لحظه اقامت تا سهم هر نفر، همه چیز قابل پیگیری است.",
    tone: "bg-amber-50 text-amber-600",
  },
];

/* Figma «آدم‌های مناسب، برنامه روشن، سفر آسوده‌تر» — two photos, three trust points and a CTA. */
export function PeopleSection() {
  return (
    <section
      aria-labelledby="people-title"
      className="mx-auto max-w-page px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold text-[#e8604c]">
            اعتماد، قبل از حرکت
          </p>
          <h2
            id="people-title"
            className="mt-2 text-3xl font-black leading-[1.45] text-slate-900 dark:text-white"
          >
            آدم‌های مناسب، برنامه روشن، سفر آسوده‌تر
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600 dark:text-ink-muted">
            پروفایل واقعی، امتیاز همسفرها، برنامه روزبه‌روز و حد نصاب شفاف کمک
            می‌کنند قبل از پیوستن بدانید با چه کسانی و با چه برنامه‌ای سفر
            می‌کنید.
          </p>
          <ul className="mt-6 space-y-4">
            {POINTS.map(({ icon: Icon, title, text, tone }) => (
              <li key={title} className="flex gap-3">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone} dark:bg-white/10`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-900 dark:text-white">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-6 text-slate-500 dark:text-ink-muted">
                    {text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <Link
            to="/about"
            className="mt-7 inline-flex h-11 items-center rounded-xl bg-[#1c3c34] px-6 text-sm font-bold text-white transition hover:bg-forest-700"
          >
            بیشتر درباره همسفر
          </Link>
        </div>
        <div className="relative grid grid-cols-2 items-end gap-4">
          <img
            src={hikerImage}
            alt="کوهنوردان در مسیر قله"
            loading="lazy"
            className="aspect-[4/5] w-full rounded-3xl object-cover shadow-float"
          />
          <img
            src="/images/tours/tour-hyrcanian-forest.webp"
            alt="جنگل‌های هیرکانی"
            loading="lazy"
            className="aspect-[4/5] w-full translate-y-8 rounded-3xl object-cover shadow-float"
          />
          <span className="absolute -top-3 start-6 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-card dark:bg-surface-raised dark:text-white">
            <ShieldCheck
              className="size-4 text-emerald-600"
              aria-hidden="true"
            />
            برگزارکنندگان تأییدشده
          </span>
        </div>
      </div>
    </section>
  );
}
