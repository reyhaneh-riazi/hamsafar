import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  CalendarClock,
  CheckCheck,
  CircleCheck,
  CircleX,
  MessageCircle,
  Megaphone,
  PartyPopper,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";
import { formatDateTime } from "@/shared/lib/format";
import type { AppNotification } from "../api/notification-schemas";
import { useMarkNotificationsRead, useNotifications } from "../hooks";

const ICONS: Record<AppNotification["type"], typeof Bell> = {
  join_request: UserPlus,
  request_approved: CircleCheck,
  request_rejected: CircleX,
  quorum_reached: PartyPopper,
  plan_changed: CalendarClock,
  tour_cancelled: CircleX,
  tour_approved: CircleCheck,
  tour_rejected: CircleX,
  new_message: MessageCircle,
  system: Megaphone,
};

/** Header bell with unread count (FS 7). Opening the panel marks everything read. */
export function NotificationBell() {
  const { data } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = data?.unread ?? 0;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={
          unread ? `اعلان‌ها، ${toFaDigits(unread)} خوانده‌نشده` : "اعلان‌ها"
        }
        className="relative inline-flex size-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-white"
      >
        {unread ? (
          <BellRing className="size-[19px] origin-top animate-[sway_1.2s_ease-in-out_2]" />
        ) : (
          <Bell className="size-[19px]" />
        )}
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-black leading-5 text-white ring-2 ring-white dark:ring-forest-950">
            {toFaDigits(unread > 9 ? "9+" : unread)}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute end-0 top-full z-drawer mt-2 w-[min(22rem,calc(100vw-2rem))] animate-pop overflow-hidden rounded-2xl border border-line bg-surface-raised text-ink shadow-float">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-black">اعلان‌ها</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markRead.mutate(undefined)}
                className="inline-flex items-center gap-1 text-xs font-bold text-coral-500 hover:text-coral-600"
              >
                <CheckCheck className="size-4" aria-hidden="true" />
                همه خوانده شد
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {data?.items.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-ink-muted">
                اعلانی ندارید.
              </li>
            )}
            {data?.items.map((n) => {
              const Icon = ICONS[n.type];
              const body = (
                <>
                  <span
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                      n.read
                        ? "bg-surface-muted text-ink-soft"
                        : "bg-coral-50 text-coral-600 dark:bg-coral-700/15",
                    )}
                  >
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      {n.title}
                      {!n.read && (
                        <span
                          className="size-2 rounded-full bg-coral-500"
                          aria-label="خوانده‌نشده"
                        />
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs leading-6 text-ink-muted">
                      {n.body}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink-soft">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </span>
                </>
              );
              const cls = cn(
                "flex gap-3 px-4 py-3 text-start transition hover:bg-surface-muted",
                !n.read && "bg-coral-50/40 dark:bg-white/[0.02]",
              );
              return (
                <li
                  key={n.id}
                  className="border-b border-line/60 last:border-0"
                >
                  {n.tourId ? (
                    <Link
                      to={`/tours/${n.tourId}`}
                      onClick={() => {
                        setOpen(false);
                        if (!n.read) markRead.mutate([n.id]);
                      }}
                      className={cls}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className={cls}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
