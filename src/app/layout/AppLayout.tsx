import { Outlet, ScrollRestoration, useNavigation } from "react-router";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { DemoBadge } from "./DemoBadge";
import { MobileTabBar } from "./MobileTabBar";
import { SessionWatcher } from "./SessionWatcher";
import { OfflineBanner, RequestProgressBar } from "./RequestIndicators";

export function AppLayout() {
  const navigation = useNavigation();
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip pb-16 lg:pb-0">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-toast focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-ink"
      >
        پرش به محتوای اصلی
      </a>
      {navigation.state === "loading" && (
        <div
          className="fixed inset-x-0 top-0 z-toast h-0.5 animate-pulse bg-coral-500"
          role="progressbar"
          aria-label="در حال بارگذاری صفحه"
        />
      )}
      <RequestProgressBar />
      <OfflineBanner />
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileTabBar />
      <DemoBadge />
      <SessionWatcher />
      <ScrollRestoration />
    </div>
  );
}
