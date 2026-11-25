import { useRef, type MouseEvent, type PointerEvent } from 'react';
import { Link } from 'react-router';
import heroSmall from '@/assets/images/hero-lake-road-800.webp';
import collageInset from '@/assets/tours/tour-hyrcanian-forest.webp';
import { useDestinations, useFeaturedTours } from '@/features/tours/hooks';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/StateViews';
import { MobileSearchCard } from './HomeSearch';
import { MobileTourCard, MobileTourCardSkeleton } from './HomeTourCards';

function ChevronLeftSmall() {
  return (
    <svg
      className="size-3.5 rotate-180"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function Hero() {
  return (
    <section className="relative px-4 pb-2 pt-4" aria-labelledby="home-hero-title">
      <div className="relative flex min-h-[380px] flex-col justify-end overflow-hidden rounded-3xl border border-stone-200/50 p-5 text-white shadow-lg dark:border-stone-800">
        <img
          src={heroSmall}
          alt=""
          width={800}
          height={300}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 size-full scale-105 object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#132822]/95 via-[#132822]/65 to-black/30" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium text-emerald-300 backdrop-blur-md">
            <span className="size-1.5 animate-ping rounded-full bg-emerald-400" />
            سفرهای بعدی همین‌جاست
          </div>
          <h1 id="home-hero-title" className="text-2xl font-black leading-snug tracking-tight">
            همسفرهایت را پیدا کن،
            <br />
            <span className="text-white drop-shadow-sm">سفر را با هم بسازید</span>
          </h1>
          <p className="text-xs font-normal leading-relaxed text-stone-200">
            تورهای گروهی واقعی با برنامه روزانه شفاف، ظرفیت مشخص و آدم‌هایی که مثل شما سفر را دوست
            دارند.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Link
              to="/tours"
              className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#E05A47] px-3 text-xs font-bold text-white shadow-md transition hover:bg-[#c94a38] active:scale-95"
            >
              <span>کشف تورها</span>
              <svg
                className="size-4 rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
            <Link
              to="/planner"
              className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/40 bg-white/20 px-3 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/30 active:scale-95"
            >
              <span>+ ساخت تور</span>
              <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-medium text-white">
                رایگان
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Horizontal strip: native swipe on touch, drag-to-scroll with a mouse. */
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const end = () => {
    if (drag.current?.moved) suppressClick.current = true;
    drag.current = null;
    if (ref.current) ref.current.style.scrollBehavior = '';
  };
  return {
    ref,
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag.current = { x: e.clientX, moved: false };
      suppressClick.current = false;
      if (ref.current) ref.current.style.scrollBehavior = 'auto';
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!drag.current || !el) return;
      const dx = e.clientX - drag.current.x;
      if (Math.abs(dx) > 3) drag.current.moved = true;
      drag.current.x = e.clientX;
      el.scrollLeft -= dx;
    },
    onPointerUp: end,
    onPointerLeave: end,
    onClickCapture: (e: MouseEvent) => {
      // A drag that ends over a card must not open it.
      if (suppressClick.current) {
        e.preventDefault();
        suppressClick.current = false;
      }
    },
  };
}

function PopularDestinations() {
  const { data, isPending } = useDestinations();
  const { ref, ...dragHandlers } = useDragScroll();
  return (
    <section className="space-y-3" aria-labelledby="home-dest-title">
      <div className="flex items-center justify-between px-4">
        <div>
          <span className="mb-0.5 block text-[11px] font-bold text-[#E05A47]">
            یک مقصد، هزار قصه
          </span>
          <h2 id="home-dest-title" className="text-lg font-black text-stone-900 dark:text-white">
            مقصدهای محبوب
          </h2>
        </div>
        <Link
          to="/tours"
          className="flex items-center gap-1 text-xs font-semibold text-stone-500 transition hover:text-[#E05A47] dark:text-stone-400"
        >
          مشاهده همه
          <ChevronLeftSmall />
        </Link>
      </div>
      <div
        ref={ref}
        {...dragHandlers}
        tabIndex={0}
        role="region"
        aria-label="مقصدهای محبوب، قابل پیمایش افقی"
        className="no-scrollbar flex w-full cursor-grab items-center gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-2 pt-1"
      >
        {isPending &&
          Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-48 w-36 shrink-0 rounded-2xl" />
          ))}
        {data?.map((d) => (
          <Link
            key={d.id}
            to={`/tours?destination=${d.id}`}
            draggable={false}
            className="group relative h-48 w-36 flex-shrink-0 overflow-hidden rounded-2xl shadow-md"
          >
            <img
              src={d.imageUrl}
              alt={d.name}
              width={288}
              height={384}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="pointer-events-none size-full select-none object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-2.5 bottom-2.5 text-center text-white">
              <p className="text-xs font-black drop-shadow">{d.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecommendedTours() {
  const { data, isPending, isError, refetch } = useFeaturedTours();
  return (
    <section className="space-y-4 px-4" aria-labelledby="home-featured-title">
      <div className="flex items-center justify-between">
        <div>
          <span className="mb-0.5 block text-[11px] font-bold text-[#E05A47]">
            سفرهای منتخب و در حال تکمیل
          </span>
          <h2
            id="home-featured-title"
            className="text-lg font-black text-stone-900 dark:text-white"
          >
            تورهای پیشنهادی
          </h2>
        </div>
        <Link
          to="/tours"
          className="flex items-center gap-1 text-xs font-semibold text-stone-500 transition hover:text-[#E05A47] dark:text-stone-400"
        >
          دیدن تمام تورها
          <ChevronLeftSmall />
        </Link>
      </div>
      <div className="space-y-4">
        {isPending && Array.from({ length: 2 }, (_, i) => <MobileTourCardSkeleton key={i} />)}
        {isError && (
          <ErrorState text="دریافت تورهای پیشنهادی ممکن نشد." onRetry={() => void refetch()} />
        )}
        {data?.length === 0 && (
          <EmptyState title="فعلاً تور فعالی نداریم" text="به‌زودی تورهای تازه اضافه می‌شوند." />
        )}
        {data?.slice(0, 3).map((tour) => (
          <MobileTourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: 'تور مناسب را کشف کن',
    text: 'بر اساس مقصد، بودجه، تاریخ رفت و سبک سفر مورد نظرت جستجو کن.',
  },
  {
    title: 'درخواست عضویت بده',
    text: 'پروفایل برگزارکننده و برنامه روزبه‌روز را بررسی کن و با خیال راحت بپیوند.',
  },
  {
    title: 'با اکیپ راهی شو',
    text: 'برنامه، چت گروهی، هماهنگی‌ها و سهم هزینه‌ها را یکجا مدیریت کنید.',
  },
];

function HowItWorks() {
  return (
    <section className="px-4" aria-labelledby="home-steps-title">
      <div className="relative space-y-5 overflow-hidden rounded-3xl bg-[#132822] p-5 text-white shadow-lg">
        <div className="pointer-events-none absolute -left-12 -top-12 size-48 rounded-full bg-emerald-500/10 blur-2xl" />
        <div>
          <span className="mb-1 block text-[11px] font-bold text-[#e8604c]">
            ساده، شفاف و همراه
          </span>
          <h2 id="home-steps-title" className="text-xl font-black">
            سه قدم تا یک سفر متفاوت
          </h2>
          <p className="mt-1 text-xs text-stone-300">
            از پیدا کردن تور تا تسویه‌حساب و نظرات، همه چیز در یک مسیر آرام و شفاف رخ می‌دهد.
          </p>
        </div>
        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex items-start gap-3 rounded-2xl border border-emerald-900/40 bg-[#334f48] p-3.5"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-[#5b726c] text-base font-bold text-white shadow-sm">
                {['۱', '۲', '۳'][i]}
              </div>
              <div>
                <h3 className="text-xs font-black text-white">{step.title}</h3>
                <p className="mt-0.5 text-[11px] leading-relaxed text-stone-300">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const PILLARS = [
  {
    title: 'بررسی تور پیش از انتشار',
    text: 'تورهای ساخته‌شده پس از بررسی هویت و جزئیات در دسترس قرار می‌گیرند.',
    tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    stroke: 'stroke-[2.5]',
    paths: ['M4.5 12.75l6 6 9-13.5'],
  },
  {
    title: 'پروفایل و امتیاز واقعی',
    text: 'فقط همسفران همان تور می‌توانند بعد از سفر نظر و نمره ثبت کنند.',
    tone: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
    stroke: 'stroke-[2]',
    paths: [
      'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
    ],
  },
  {
    title: 'برنامه و هزینه شفاف',
    text: 'از محل اقامت تا سهم هر نفر، همه فاکتورها قابل پیگیری است.',
    tone: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    stroke: 'stroke-[2]',
    paths: [
      'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    ],
  },
];

function Trust() {
  return (
    <section className="space-y-4 px-4" aria-labelledby="home-trust-title">
      <div>
        <span className="mb-0.5 block text-[11px] font-bold text-[#E05A47]">
          اعتماد، قبل از حرکت
        </span>
        <h2
          id="home-trust-title"
          className="text-xl font-black leading-tight text-stone-900 dark:text-white"
        >
          آدم‌های مناسب، برنامه روشن،
          <br />
          سفر آسوده‌تر
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          پروفایل سفر، امتیاز همسفران، برنامه روزبه‌روز و حد نصاب شفاف کمک می‌کنند قبل از پیوستن
          بدانید با چه کسانی و با چه برنامه‌ای سفر می‌کنید.
        </p>
      </div>
      <div className="relative w-full overflow-hidden rounded-3xl border border-stone-200 shadow-sm dark:border-stone-800">
        <img
          src={heroSmall}
          alt="طبیعت و چشم‌اندازهای بکر ایران"
          width={800}
          height={300}
          loading="lazy"
          decoding="async"
          className="h-56 w-full object-cover"
        />
        <div className="absolute bottom-3 left-3 hidden h-20 w-28 overflow-hidden rounded-2xl border-2 border-white/80 shadow-md sm:block">
          <img
            src={collageInset}
            alt="طبیعت گردی همسفر"
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 right-3 text-white">
          <p className="text-xs font-bold">بیش از ۱,۲۰۰ سفر گروهی موفق</p>
          <span className="text-[10px] text-stone-200">
            همراهی امن و پر از خاطره در سراسر ایران
          </span>
        </div>
      </div>
      <ul className="space-y-3">
        {PILLARS.map((p) => (
          <li
            key={p.title}
            className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-white p-3.5 dark:border-stone-800 dark:bg-[#132822]"
          >
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm ${p.tone}`}
            >
              <svg
                className={`size-5 ${p.stroke}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {p.paths.map((d) => (
                  <path key={d} strokeLinecap="round" strokeLinejoin="round" d={d} />
                ))}
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-bold text-stone-900 dark:text-white">{p.title}</h3>
              <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">{p.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="pt-1">
        <Link
          to="/about"
          className="block w-full rounded-xl bg-[#1c3c34] py-3 text-center text-xs font-bold text-white shadow-md transition hover:bg-stone-900 active:scale-[0.98] dark:bg-[#1B332B]"
        >
          بیشتر درباره همسفر
        </Link>
      </div>
    </section>
  );
}

export function HomeMobile() {
  return (
    <div className="space-y-7">
      <Hero />
      <MobileSearchCard />
      <PopularDestinations />
      <RecommendedTours />
      <HowItWorks />
      <Trust />
    </div>
  );
}
