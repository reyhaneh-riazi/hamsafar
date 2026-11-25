import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { WifiOff } from "lucide-react";

/** Thin top bar while any API request is in flight (after a short delay, to avoid flicker). */
export function RequestProgressBar() {
  const busy = useIsFetching() + useIsMutating() > 0;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!busy) {
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), 200);
    return () => window.clearTimeout(t);
  }, [busy]);
  if (!visible) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-toast h-0.5 overflow-hidden"
      role="progressbar"
      aria-label="در حال دریافت اطلاعات"
    >
      <div className="h-full w-1/3 animate-[request-bar_1.1s_ease-in-out_infinite] rounded-full bg-coral-500" />
    </div>
  );
}

/** Banner shown while the browser reports no network connection. */
export function OfflineBanner() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  if (online) return null;
  return (
    <div
      role="alert"
      className="sticky top-0 z-toast flex items-center justify-center gap-2 bg-warning px-4 py-2 text-center text-xs font-bold text-white"
    >
      <WifiOff className="size-4" aria-hidden="true" />
      اتصال اینترنت قطع است؛ تغییرات تا وصل شدن دوباره ارسال نمی‌شوند.
    </div>
  );
}
