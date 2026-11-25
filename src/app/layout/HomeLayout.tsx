import { Outlet, ScrollRestoration, useNavigation } from 'react-router';
import { HomeFooter, MobileBottomNav } from '@/features/home/ui/HomeFooter';
import { HomeHeader } from '@/features/home/ui/HomeHeader';
import { cn } from '@/shared/lib/cn';
import { useIsDesktop } from '@/shared/hooks/useMediaQuery';
import { DemoBadge } from './DemoBadge';

/**
 * Shell for the home page only: it follows the home design (light header, its own footer and,
 * on phones, a docked bottom navigation). Every other page keeps <AppLayout />.
 */
export function HomeLayout() {
  const navigation = useNavigation();
  const desktop = useIsDesktop();
  return (
    <div
      className={cn(
        'flex min-h-dvh flex-col overflow-x-clip bg-[#f6f3ee] text-stone-800 transition-colors duration-300 dark:bg-[#0A1311] dark:text-stone-100',
        !desktop && 'pb-20',
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-toast focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-ink"
      >
        پرش به محتوای اصلی
      </a>
      {navigation.state === 'loading' && (
        <div
          className="fixed inset-x-0 top-0 z-toast h-0.5 animate-pulse bg-coral-500"
          role="progressbar"
          aria-label="در حال بارگذاری صفحه"
        />
      )}
      <HomeHeader desktop={desktop} />
      <main id="main" className="w-full flex-1">
        <Outlet />
      </main>
      <HomeFooter desktop={desktop} />
      {!desktop && <MobileBottomNav />}
      <DemoBadge className={desktop ? undefined : 'bottom-20'} />
      <ScrollRestoration />
    </div>
  );
}
