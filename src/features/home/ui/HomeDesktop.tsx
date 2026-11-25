import { Link } from 'react-router';
import heroLarge from '@/assets/images/hero-lake-road.webp';
import heroMedium from '@/assets/images/hero-lake-road-1280.webp';
import heroSmall from '@/assets/images/hero-lake-road-800.webp';
import trustLake from '@/assets/tours/dest-lake.webp';
import trustCanyon from '@/assets/tours/tour-shirom-canyon.webp';
import { useDestinations, useFeaturedTours } from '@/features/tours/hooks';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/StateViews';
import { DesktopHeroSearch } from './HomeSearch';
import { DesktopTourCard, DesktopTourCardSkeleton } from './HomeTourCards';

function ArrowLeftIcon() {
  return (
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
  );
}

function Hero() {
  return (
    <section className="relative pb-32 pt-20 text-white" aria-labelledby="home-hero-title">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <img
          src={heroLarge}
          srcSet={`${heroSmall} 800w, ${heroMedium} 1280w, ${heroLarge} 2048w`}
          sizes="100vw"
          width={2048}
          height={768}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="size-full object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
      </div>
      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        <span className="mb-4 inline-block rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-wide text-white/90 backdrop-blur-md">
          سفرهای بعدی همین‌جاست
        </span>
        <h1
          id="home-hero-title"
          className="text-3xl font-black leading-tight tracking-tight sm:text-5xl sm:leading-snug lg:text-6xl"
        >
          همسفرهایت را پیدا کن،
          <br />
          سفر را با هم بسازید
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm font-light leading-relaxed text-slate-200 sm:text-lg">
          تورهای گروهی واقعی با برنامه روزانه شفاف، ظرفیت مشخص و آدم‌هایی که مثل شما سفر را دوست
          دارند.
        </p>
        <DesktopHeroSearch />
      </div>
    </section>
  );
}

function PopularDestinations() {
  const { data, isPending } = useDestinations();
  return (
    <section
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="home-dest-title"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="mb-1 block text-xs font-bold tracking-wide text-[#e8604c]">
            یک مقصد، هزار قصه
          </span>
          <h2
            id="home-dest-title"
            className="text-2xl font-black text-slate-900 sm:text-3xl dark:text-[#F5F7F6]"
          >
            مقصدهای محبوب
          </h2>
        </div>
        <Link
          to="/tours"
          className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-[#1c3c34] transition hover:bg-slate-200 hover:text-[#e8604c] sm:text-sm dark:bg-[#1A2F29] dark:text-[#B0BEB9] dark:hover:bg-[#243D35]"
        >
          مشاهده همه
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {isPending &&
          Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
          ))}
        {data?.slice(0, 5).map((d) => (
          <Link
            key={d.id}
            to={`/tours?destination=${d.id}`}
            className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl shadow-sm transition hover:shadow-md"
          >
            <img
              src={d.imageUrl}
              alt={d.name}
              width={420}
              height={315}
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4">
              <span className="text-sm font-bold text-white sm:text-base">{d.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeaturedTours() {
  const { data, isPending, isError, refetch } = useFeaturedTours();
  return (
    <section
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      aria-labelledby="home-featured-title"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="mb-1 block text-xs font-bold tracking-wide text-[#e8604c]">
            سفرهای منتخب و در حال تکمیل
          </span>
          <h2
            id="home-featured-title"
            className="text-2xl font-black text-slate-900 sm:text-3xl dark:text-[#F5F7F6]"
          >
            تورهای پیشنهادی
          </h2>
        </div>
        <Link
          to="/tours"
          className="flex items-center gap-1.5 text-xs font-bold text-[#1c3c34] transition hover:text-[#e8604c] sm:text-sm dark:text-[#B0BEB9]"
        >
          <span>دیدن تمام تورها</span>
          <ArrowLeftIcon />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isPending && Array.from({ length: 4 }, (_, i) => <DesktopTourCardSkeleton key={i} />)}
        {isError && (
          <ErrorState
            className="sm:col-span-2 lg:col-span-4"
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
        {data?.slice(0, 4).map((tour) => (
          <DesktopTourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { title: 'تور مناسب را کشف کن', text: 'بر اساس مقصد، بودجه، تاریخ و سبک سفر جستجو کن.' },
  {
    title: 'درخواست عضویت بده',
    text: 'پروفایل برگزارکننده و برنامه روزبه‌روز را ببین و راحت بپیوند.',
  },
  { title: 'با اکیپ راهی شو', text: 'برنامه، چت هماهنگی و هزینه‌ها را یکجا و مطمئن مدیریت کنید.' },
];

function ThreeSteps() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="home-steps-title"
    >
      <div className="relative overflow-hidden rounded-3xl bg-[#1c3c34] p-8 text-white shadow-xl sm:p-14">
        <div className="relative z-10 flex flex-col items-center justify-between gap-10 md:flex-row">
          <div className="text-right md:w-1/3">
            <span className="mb-2 block text-xs font-bold text-[#e8604c]">ساده، شفاف و همراه</span>
            <h2 id="home-steps-title" className="text-2xl font-black leading-tight sm:text-4xl">
              سه قدم تا یک سفر متفاوت
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              از پیدا کردن تور تا تسویه‌حساب و نظرات، همه چیز در یک مسیر آرام، شفاف و مطمئن رخ
              می‌دهد.
            </p>
          </div>
          <ol className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3 md:w-2/3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex flex-col items-start rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
              >
                <span className="mb-4 flex size-9 items-center justify-center rounded-xl bg-white/20 text-sm font-black text-white">
                  {['۱', '۲', '۳'][i]}
                </span>
                <h3 className="mb-2 text-base font-extrabold">{step.title}</h3>
                <p className="text-xs leading-relaxed text-slate-300">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

const PILLARS = [
  {
    title: 'بررسی تور پیش از انتشار',
    text: 'تورهای ساخته‌شده پس از بررسی مدیریت در دسترس قرار می‌گیرند.',
    tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    path: 'M5 13l4 4L19 7',
  },
  {
    title: 'پروفایل و امتیاز واقعی',
    text: 'فقط همسفران همان تور می‌توانند بعد از سفر نظر ثبت کنند.',
    tone: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    title: 'برنامه و هزینه شفاف',
    text: 'از محل اقامت تا سهم هر نفر، همه چیز قابل پیگیری است.',
    tone: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
];

function Trust() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
      aria-labelledby="home-trust-title"
    >
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
        <div className="text-right">
          <span className="mb-2 block text-xs font-bold text-[#e8604c]">اعتماد، قبل از حرکت</span>
          <h2
            id="home-trust-title"
            className="text-2xl font-black leading-tight text-slate-900 sm:text-4xl dark:text-[#F5F7F6]"
          >
            آدم‌های مناسب، برنامه روشن، سفر آسوده‌تر
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-[#B0BEB9]">
            پروفایل سفر، امتیاز همسفران، برنامه روزبه‌روز و حد نصاب شفاف کمک می‌کنند قبل از پیوستن
            بدانید با چه کسانی و با چه برنامه‌ای سفر می‌کنید.
          </p>
          <ul className="mt-8 space-y-4">
            {PILLARS.map((p) => (
              <li key={p.title} className="flex items-start gap-3.5">
                <div
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${p.tone}`}
                >
                  <svg
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d={p.path}
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F7F6]">
                    {p.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-[#768B83]">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link
              to="/about"
              className="inline-block rounded-xl bg-[#1c3c34] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#132822] dark:bg-[#1B332B] dark:hover:bg-[#243D35]"
            >
              بیشتر درباره همسفر
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <img
            src={trustCanyon}
            alt="سفرهای همسفر"
            width={600}
            height={600}
            loading="lazy"
            decoding="async"
            className="aspect-square rounded-3xl object-cover shadow-lg"
          />
          <img
            src={trustLake}
            alt="طبیعت گردی"
            width={600}
            height={600}
            loading="lazy"
            decoding="async"
            className="mt-8 aspect-square rounded-3xl object-cover shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}

export function HomeDesktop() {
  return (
    <>
      <Hero />
      <PopularDestinations />
      <FeaturedTours />
      <ThreeSteps />
      <Trust />
    </>
  );
}
