import { useId, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router';
import footerImage from '@/assets/tours/dest-damavand.webp';
import { useSubscribeNewsletter } from '@/features/content/hooks';
import { errorMessage } from '@/shared/api/errors';
import { cn } from '@/shared/lib/cn';
import { toFaDigits } from '@/shared/lib/digits';
import { useToast } from '@/shared/ui/Toast';
import { jalaliYear } from '../model/jalali';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function useNewsletter() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const subscribe = useSubscribeNewsletter();
  const toast = useToast();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) return setError('ایمیل معتبر وارد کنید.');
    setError(null);
    subscribe.mutate(value, {
      onSuccess: () => {
        toast.success('عضویت شما در خبرنامه همسفر ثبت شد.');
        setEmail('');
      },
      onError: (err) => setError(errorMessage(err)),
    });
  };
  return { email, setEmail, error, submit, pending: subscribe.isPending };
}

const QUICK = [
  { to: '/tours', label: 'کشف و خرید تور' },
  { to: '/planner', label: 'ساخت تور جدید' },
  { to: '/profile', label: 'داشبورد من' },
  { to: '/about', label: 'داستان همسفر' },
  { to: '/contact', label: 'مرکز پشتیبانی' },
];

const TRUST = [
  { to: '/about#rules', label: 'قوانین و شرایط استفاده' },
  { to: '/about#rules', label: 'پرداخت و بازگشت وجه' },
  { to: '/about#rules', label: 'قوانین امنیت سفر' },
  { to: '/contact', label: 'گزارش تخلف' },
  { to: '/about#faq', label: 'پرسش‌های متداول' },
];

function DesktopFooter() {
  const n = useNewsletter();
  const id = useId();
  return (
    <footer className="relative overflow-hidden border-t border-emerald-950/40 bg-[#1c3c34] pb-8 pt-16 text-white dark:border-[#1B332B] dark:bg-[#08100E]">
      <div className="pointer-events-none absolute inset-0 opacity-10 mix-blend-overlay">
        <img
          src={footerImage}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 text-right md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-white/20 font-bold">
                هـ
              </div>
              <span className="text-xl font-black tracking-tight">همسفر</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              جایی برای پیدا کردن همسفر، ساختن یک برنامه دقیق و تبدیل ایده سفر به تجربه‌ای واقعی و
              امن.
            </p>
            <div className="flex flex-wrap gap-1.5 text-[10px] text-white/80">
              {['خرید سریع و شفاف', 'تورهای تاییدشده', 'همسفرهای واقعی', 'برنامه سفر یکپارچه'].map(
                (t) => (
                  <span key={t} className="rounded-full bg-white/10 px-2.5 py-1">
                    {t}
                  </span>
                ),
              )}
            </div>
          </div>
          <nav aria-label="دسترسی سریع">
            <h2 className="mb-4 text-sm font-bold text-white">دسترسی سریع</h2>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {QUICK.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="راهنما و اعتماد">
            <h2 className="mb-4 text-sm font-bold text-white">راهنما و اعتماد</h2>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {TRUST.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className="mb-4 text-sm font-bold text-white">با ما در ارتباط باشید</h2>
            <p className="mb-4 text-xs leading-relaxed text-slate-300">
              تهران، دانشگاه — تیم Frog Software
              <br />
              ۰۲۱-۹۱۰۱۲۳۴
              <br />
              <span className="ltr-island">hello@hamsafar.ir</span>
              <br />
              پشتیبانی: هر روز ۸ تا ۲۲
            </p>
            <form className="relative" onSubmit={n.submit} noValidate>
              <label htmlFor={id} className="sr-only">
                ایمیل برای عضویت در خبرنامه
              </label>
              <input
                id={id}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={n.email}
                onChange={(e) => n.setEmail(e.target.value)}
                placeholder="ایمیل برای پیشنهادهای سفر"
                aria-invalid={n.error ? true : undefined}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#e8604c]"
              />
              <button
                type="submit"
                disabled={n.pending}
                className="absolute left-1.5 top-1.5 rounded-lg bg-[#e8604c] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#d5503d] disabled:opacity-70"
              >
                عضویت
              </button>
              {n.error && (
                <p role="alert" className="mt-2 text-xs font-medium text-coral-300">
                  {n.error}
                </p>
              )}
            </form>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-slate-400 sm:flex-row">
          <span>طراحی‌شده برای سفرهای امن‌تر و به‌یادماندنی‌تر</span>
          <span>© {toFaDigits(jalaliYear())} همسفر — همه حقوق محفوظ است.</span>
        </div>
      </div>
    </footer>
  );
}

function MobileFooter() {
  const n = useNewsletter();
  const id = useId();
  const quick = [
    { to: '/tours', label: 'کشف و خرید تور' },
    { to: '/planner', label: 'ساخت تور جدید' },
    { to: '/about', label: 'داستان همسفر' },
    { to: '/contact', label: 'مرکز پشتیبانی' },
  ];
  const trust = TRUST.slice(0, 4);
  return (
    <footer className="mt-10 space-y-6 rounded-t-[32px] bg-[#132822] px-5 pb-12 pt-8 text-white">
      <div className="space-y-2">
        <h2 className="text-sm font-bold">عضویت در خبرنامه هفتگی تورها</h2>
        <p className="text-xs text-stone-400">از تورهای لحظه آخری و تخفیف‌های ویژه باخبر شوید.</p>
        <form className="flex items-center gap-1.5 pt-1" onSubmit={n.submit} noValidate>
          <label htmlFor={id} className="sr-only">
            ایمیل برای عضویت در خبرنامه
          </label>
          <input
            id={id}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={n.email}
            onChange={(e) => n.setEmail(e.target.value)}
            placeholder="ایمیل خود را وارد کنید..."
            aria-invalid={n.error ? true : undefined}
            className="min-w-0 flex-1 rounded-xl border border-stone-700 bg-stone-900/80 px-3 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#E05A47]"
          />
          <button
            type="submit"
            disabled={n.pending}
            className="shrink-0 rounded-xl bg-[#E05A47] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#c94a38] active:scale-95 disabled:opacity-70"
          >
            عضویت
          </button>
        </form>
        {n.error && (
          <p role="alert" className="text-xs font-medium text-coral-300">
            {n.error}
          </p>
        )}
      </div>
      <div className="h-px bg-stone-800" />
      <div className="grid grid-cols-2 gap-4 text-xs">
        {[
          { title: 'دسترسی سریع', links: quick },
          { title: 'راهنما و اعتماد', links: trust },
        ].map((col) => (
          <nav key={col.title} aria-label={col.title} className="space-y-2">
            <p className="font-bold text-stone-200">{col.title}</p>
            <ul className="space-y-1.5 text-[11px] text-stone-400">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="flex flex-col gap-1 border-t border-stone-800/80 pt-2 text-[11px] text-stone-400">
        <p>با ما در ارتباط باشید: ۰۲۱-۹۱۰۱۲۳۴</p>
        <p>
          ایمیل: <span className="ltr-island">hello@hamsafar.ir</span>
        </p>
        <p className="mt-2 text-[10px] text-stone-500">© کلیه حقوق برای پلتفرم همسفر محفوظ است.</p>
      </div>
    </footer>
  );
}

export function HomeFooter({ desktop }: { desktop: boolean }) {
  return desktop ? <DesktopFooter /> : <MobileFooter />;
}

/** Docked bottom navigation from the mobile home design. */
export function MobileBottomNav() {
  const { pathname } = useLocation();
  const items = [
    {
      to: '/',
      label: 'خانه',
      icon: (
        <svg
          className="size-5 transition-transform group-active:scale-90"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
    },
    { to: '/tours', label: 'کشف تور', path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    {
      to: '/favorites',
      label: 'ذخیره‌ها',
      path: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    },
    {
      to: '/profile',
      label: 'پروفایل',
      path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
  ];

  return (
    <nav
      aria-label="ناوبری پایین"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200/80 bg-white/95 px-4 py-2 shadow-lg backdrop-blur-md transition-colors dark:border-stone-800 dark:bg-[#132822]/95"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 items-center justify-between">
        {items.map((item) => {
          const active = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex flex-col items-center justify-center gap-1 py-1 transition-colors',
                active
                  ? 'text-[#E05A47]'
                  : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white',
              )}
            >
              {item.icon ?? (
                <svg
                  className="size-5 stroke-[2] transition-transform group-active:scale-90"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.path} />
                </svg>
              )}
              <span
                className={cn('text-[11px] leading-tight', active ? 'font-bold' : 'font-medium')}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
