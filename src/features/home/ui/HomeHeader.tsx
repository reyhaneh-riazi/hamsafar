import { Link, NavLink, useLocation } from 'react-router';
import { UserMenu } from '@/app/layout/Header';
import { useSession } from '@/features/auth/hooks';
import { cn } from '@/shared/lib/cn';
import { useTheme } from '@/shared/theme/ThemeProvider';

const NAV = [
  { to: '/', label: 'خانه', end: true },
  { to: '/tours', label: 'تورها', end: false },
  { to: '/about', label: 'درباره ما', end: false },
  { to: '/contact', label: 'ارتباط با ما', end: false },
  { to: '/about#rules', label: 'قوانین و مقررات', end: false },
] as const;

/** Globe mark used by the home page header. */
function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function useAuthTarget() {
  const location = useLocation();
  return `/auth?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`;
}

function DesktopHeader() {
  const { theme, toggle } = useTheme();
  const { user, isLoading } = useSession();
  const authTo = useAuthTarget();
  const dark = theme === 'dark';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/[0.92] shadow-xs backdrop-blur-md dark:border-[#1B332B] dark:bg-[rgba(13,23,20,0.95)]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & slogan */}
        <Link to="/" className="flex items-center gap-3" aria-label="همسفر — صفحه اصلی">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#1c3c34] text-white shadow-md shadow-[#1c3c34]/20 transition hover:scale-105">
            <GlobeIcon className="size-6" />
          </span>
          <span className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-[#1c3c34] dark:text-[#F5F7F6]">
              همسفر
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-[#768B83]">
              سفرهای واقعی، آدم‌های واقعی
            </span>
          </span>
        </Link>

        {/* Main navigation */}
        <nav
          aria-label="منوی اصلی"
          className="hidden items-center gap-8 text-[15px] font-semibold text-slate-700 md:flex"
        >
          {NAV.slice(0, 2).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'transition hover:text-[#e8604c]',
                  isActive ? 'font-bold text-[#e8604c]' : 'text-slate-600 dark:text-[#B0BEB9]',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/planner"
            className="flex items-center gap-1.5 text-slate-600 transition hover:text-[#e8604c] dark:text-[#B0BEB9]"
          >
            <span>ساخت تور</span>
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-[#1c3c34] dark:bg-emerald-900/50 dark:text-emerald-200">
              رایگان
            </span>
          </Link>
          {NAV.slice(2).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-slate-600 transition hover:text-[#e8604c] dark:text-[#B0BEB9]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Theme + account */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            aria-label="سوییچ حالت روشن و تاریک"
            title="حالت روشن / تاریک"
            className="flex items-center justify-center gap-2 rounded-xl border border-transparent bg-slate-100 p-2.5 px-3 text-slate-700 transition hover:border-slate-300 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#e8604c] dark:bg-[#1A2F29] dark:text-[#B0BEB9] dark:hover:border-[#233F36] dark:hover:bg-[#243D35]"
          >
            <span className="text-base leading-none" aria-hidden="true">
              {dark ? '☀️' : '🌙'}
            </span>
            <span className="hidden text-xs font-bold sm:inline-block">
              {dark ? 'حالت روز' : 'حالت شب'}
            </span>
          </button>
          {isLoading ? (
            <span
              className="h-10 w-28 animate-pulse rounded-xl bg-slate-100 dark:bg-[#1A2F29]"
              aria-hidden="true"
            />
          ) : user ? (
            <UserMenu buttonClassName="flex items-center gap-2 rounded-xl bg-slate-100 py-1.5 ps-1.5 pe-3 text-slate-800 transition hover:bg-slate-200 dark:bg-[#1A2F29] dark:text-[#F5F7F6] dark:hover:bg-[#243D35]" />
          ) : (
            <Link
              to={authTo}
              className="rounded-xl bg-[#e8604c] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#e8604c]/25 transition hover:bg-[#d5503d] active:scale-95"
            >
              ورود / ثبت‌نام
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function MobileHeader() {
  const { theme, toggle } = useTheme();
  const { user, isLoading } = useSession();
  const authTo = useAuthTarget();
  const dark = theme === 'dark';

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#f6f3ee]/95 backdrop-blur-md transition-colors dark:border-stone-800 dark:bg-[#0A1311]/95">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="group flex items-center gap-2" aria-label="همسفر — صفحه اصلی">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#132822] text-lg text-white shadow-sm dark:bg-[#1B332B]">
            <svg
              className="size-5 text-emerald-400"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </span>
          <span>
            <span className="block text-lg font-black leading-none tracking-tight text-stone-900 dark:text-white">
              همسفر
            </span>
            <span className="mt-0.5 block text-[10px] font-medium text-stone-500 dark:text-stone-400">
              سفرهای واقعی، آدم‌های واقعی
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={dark ? 'حالت روشن' : 'حالت تیره'}
            title="تغییر تم"
            className="flex items-center gap-1 rounded-xl border border-stone-300 bg-white/80 p-2 text-xs text-stone-700 shadow-sm transition-all active:scale-95 dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-200"
          >
            <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
          </button>
          {isLoading ? (
            <span
              className="h-8 w-24 animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800"
              aria-hidden="true"
            />
          ) : user ? (
            <UserMenu buttonClassName="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white/80 py-1 ps-1 pe-2.5 text-xs font-semibold text-stone-800 shadow-sm dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-100" />
          ) : (
            <Link
              to={authTo}
              className="rounded-xl bg-[#E05A47] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#c94a38] active:scale-95"
            >
              ورود / ثبت‌نام
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function HomeHeader({ desktop }: { desktop: boolean }) {
  return desktop ? <DesktopHeader /> : <MobileHeader />;
}
