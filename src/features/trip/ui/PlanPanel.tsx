import { useState, type FormEvent } from "react";
import {
  BedDouble,
  Bus,
  CalendarX2,
  ExternalLink,
  Flag,
  History,
  Landmark,
  MapPin,
  MessageCircle,
  Mountain,
  PencilLine,
  Route,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";
import type {
  ItemStatus,
  ItineraryItemType,
  TourDetail,
} from "@/features/tours/api/tour-schemas";
import { ITEM_TYPE_LABELS } from "@/features/tours/model/labels";
import { DayTabs, dayPanelId, dayTabId } from "@/features/tours/ui/DayTabs";
import { ReportButton } from "@/features/users/ui/ReportButton";
import { errorMessage } from "@/shared/api/errors";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";
import { dayState } from "@/shared/lib/dates";
import {
  formatDate,
  formatDateRange,
  formatDateTime,
  formatToman,
  formatWeekday,
} from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge, type BadgeTone } from "@/shared/ui/Badge";
import { ButtonLink } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import { useAddComment } from "../hooks";

const ITEM_ICONS: Record<ItineraryItemType, LucideIcon> = {
  accommodation: BedDouble,
  restaurant: Utensils,
  attraction: Landmark,
  activity: Mountain,
  transport: Bus,
};

export const ITEM_STATUS_META: Record<
  ItemStatus,
  { label: string; tone: BadgeTone }
> = {
  planned: { label: "برنامه‌ریزی‌شده", tone: "neutral" },
  done: { label: "انجام‌شده", tone: "brand" },
  cancelled: { label: "لغوشده", tone: "danger" },
  changed: { label: "تغییرکرده", tone: "amber" },
};

/** Day-by-day plan (FS 3). Everyone sees it; only members comment; only the leader edits (manage page). */
export function PlanPanel({ tour }: { tour: TourDetail }) {
  const [params, setParams] = useSearchParams();
  const canComment = Boolean(tour.viewer.isMember || tour.viewer.isCreator);
  const days = tour.itinerary;
  const requested = Number(params.get("day"));
  const fallback = days.find((d) => dayState(d.date) !== "past") ?? days[0];
  const day = days.find((d) => d.dayNumber === requested) ?? fallback;
  const selectDay = (key: string) => {
    const next = days.find((d) => d.id === key);
    if (!next) return;
    const p = new URLSearchParams(params);
    p.set("day", String(next.dayNumber));
    setParams(p, { replace: true });
  };
  const editLink = tour.viewer.canManage ? (
    <ButtonLink
      to={`/tours/${tour.id}/manage#plan`}
      size="sm"
      variant="outline"
      icon={<PencilLine className="size-4" />}
    >
      ویرایش برنامه
    </ButtonLink>
  ) : undefined;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_17rem]">
      <section
        className="min-w-0 rounded-panel border border-line bg-surface p-5 sm:p-7"
        aria-labelledby="itinerary-title"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="itinerary-title" className="text-lg font-black">
              برنامه روزانه
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              {formatDateRange(tour.startDate, tour.endDate)} ·{" "}
              {toFaDigits(tour.durationDays)} روز
            </p>
          </div>
          {tour.viewer.canManage && days.length > 0 && (
            <Link
              to={`/tours/${tour.id}/manage#plan`}
              className="text-xs font-bold text-coral-500 hover:text-coral-600"
            >
              ویرایش برنامه
            </Link>
          )}
        </div>
        {!day ? (
          <EmptyState
            className="mt-5 py-10"
            icon={<Route className="size-7" />}
            title="برنامه روزانه هنوز منتشر نشده است"
            text="تورلیدر به‌زودی برنامه روز به روز سفر را اضافه می‌کند."
            action={editLink}
          />
        ) : (
          <>
            <div className="mt-4">
              <DayTabs
                idPrefix="plan"
                label="روزهای سفر"
                showDateState
                activeKey={day.id}
                onChange={selectDay}
                days={days.map((d) => ({
                  key: d.id,
                  dayNumber: d.dayNumber,
                  date: d.date,
                  count: d.items.length,
                }))}
              />
            </div>
            <div
              role="tabpanel"
              id={dayPanelId("plan", day.id)}
              aria-labelledby={dayTabId("plan", day.id)}
              tabIndex={0}
              key={day.id}
              className="mt-5 animate-fade-up focus-visible:outline-none"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-black text-forest-800 dark:text-white">
                  روز {toFaDigits(day.dayNumber)}
                  {day.title ? `: ${day.title}` : ""}
                </h3>
                <p className="text-xs text-ink-muted">
                  {formatWeekday(day.date)} {formatDate(day.date)}
                  {dayState(day.date) === "today" && (
                    <span className="ms-2 rounded-full bg-coral-500 px-2 py-0.5 text-[10px] font-black text-white">
                      امروز
                    </span>
                  )}
                </p>
              </div>
              {day.items.length === 0 ? (
                <EmptyState
                  className="mt-4 py-10"
                  icon={<CalendarX2 className="size-7" />}
                  title="برای این روز فعالیتی ثبت نشده است"
                  text="ممکن است روز آزاد یا استراحت باشد. تغییرات برنامه در تاریخچه ثبت می‌شود."
                  action={editLink}
                />
              ) : (
                <ol
                  className="relative mt-4 space-y-4 border-s-2 border-dashed border-forest-200 ps-6 dark:border-line"
                  aria-label={`فعالیت‌های روز ${toFaDigits(day.dayNumber)}`}
                >
                  {day.items.map((item) => (
                    <PlanItem
                      key={item.id}
                      tourId={tour.id}
                      item={item}
                      canComment={canComment}
                    />
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </section>

      <aside
        className="rounded-panel border border-line bg-surface p-5"
        aria-labelledby="changes-title"
      >
        <h2
          id="changes-title"
          className="flex items-center gap-2 text-sm font-black"
        >
          <History className="size-4 text-forest-600" aria-hidden="true" />
          تاریخچه تغییرات
        </h2>
        {tour.changeLog.length === 0 ? (
          <p className="mt-3 text-xs leading-6 text-ink-muted">
            تغییری در برنامه ثبت نشده است.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {tour.changeLog.map((c) => (
              <li key={c.id} className="rounded-xl bg-surface-muted p-3">
                <p className="text-xs leading-6 text-ink">{c.text}</p>
                <p className="mt-1 text-[10px] text-ink-soft">
                  {formatDateTime(c.at)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}

function PlanItem({
  tourId,
  item,
  canComment,
}: {
  tourId: string;
  item: TourDetail["itinerary"][number]["items"][number];
  canComment: boolean;
}) {
  const Icon = ITEM_ICONS[item.type];
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const add = useAddComment(tourId);
  const toast = useToast();
  const status = ITEM_STATUS_META[item.status];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 2) return;
    add.mutate(
      { itemId: item.id, text: text.trim() },
      {
        onSuccess: () => {
          setText("");
          toast.success("نظر شما ثبت شد.");
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  return (
    <li className="relative">
      <span className="absolute -start-[37px] top-0 flex size-8 items-center justify-center rounded-full border-2 border-surface bg-forest-100 text-forest-700 dark:bg-forest-900 dark:text-forest-200">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div
        className={cn(
          "rounded-2xl bg-surface-muted p-4",
          item.status === "cancelled" && "opacity-70",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          {item.startTime && (
            <span className="ltr-island text-xs font-black text-coral-500">
              {toFaDigits(item.startTime)}
            </span>
          )}
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-ink-muted">
            {ITEM_TYPE_LABELS[item.type]}
          </span>
          {item.status !== "planned" && (
            <Badge tone={status.tone}>{status.label}</Badge>
          )}
        </div>
        <p
          className={cn(
            "mt-1.5 text-sm font-bold text-ink",
            item.status === "cancelled" && "line-through",
          )}
        >
          {item.title}
        </p>
        {item.location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
            <MapPin className="size-3.5" aria-hidden="true" />
            {item.location}
          </p>
        )}
        {item.note && (
          <p className="mt-2 text-xs leading-6 text-ink-muted">{item.note}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {item.costToman !== null && (
            <span className="font-bold text-ink-muted">
              هزینه تقریبی: {formatToman(item.costToman)}
            </span>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-info hover:underline"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              پیوند
            </a>
          )}
          {(item.comments.length > 0 || canComment) && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="inline-flex items-center gap-1 font-bold text-forest-700 hover:text-coral-500 dark:text-forest-200"
            >
              <MessageCircle className="size-3.5" aria-hidden="true" />
              {item.comments.length
                ? `${toFaDigits(item.comments.length)} نظر`
                : "نظر یا سؤال"}
            </button>
          )}
        </div>

        {open && (
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            {item.comments.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "flex gap-2 rounded-xl p-2.5",
                  c.byLeader ? "bg-tint-mint" : "bg-surface",
                )}
              >
                <Avatar
                  name={c.author.displayName}
                  src={c.author.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-xs font-black">
                    <Link
                      to={`/users/${c.author.id}`}
                      className="hover:text-coral-500"
                    >
                      {c.author.displayName}
                    </Link>
                    {c.byLeader && (
                      <span className="rounded bg-forest-700 px-1 text-[9px] text-white">
                        تورلیدر
                      </span>
                    )}
                    <span className="font-normal text-ink-soft">
                      {formatDateTime(c.createdAt)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs leading-6 text-ink">{c.text}</p>
                </div>
                <ReportButton
                  targetType="comment"
                  targetId={c.id}
                  label="گزارش نظر"
                  iconOnly
                />
              </div>
            ))}
            {canComment ? (
              <form onSubmit={submit} className="flex gap-2">
                <label htmlFor={`cm-${item.id}`} className="sr-only">
                  نظر درباره {item.title}
                </label>
                <input
                  id={`cm-${item.id}`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={400}
                  placeholder="سؤال، پیشنهاد یا گزارش تأخیر..."
                  className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-xs outline-none focus:border-forest-400"
                />
                <button
                  type="submit"
                  disabled={add.isPending || text.trim().length < 2}
                  className="h-10 shrink-0 rounded-xl bg-forest-800 px-4 text-xs font-bold text-white disabled:opacity-50 dark:bg-forest-600"
                >
                  ارسال
                </button>
              </form>
            ) : (
              <p className="flex items-center gap-1 text-[11px] text-ink-soft">
                <Flag className="size-3" aria-hidden="true" />
                فقط اعضای تأییدشده تور می‌توانند نظر بدهند.
              </p>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
