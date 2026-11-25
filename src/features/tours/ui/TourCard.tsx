import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";
import { formatDateRangeShort, formatNumber } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/Badge";
import type { TourSummary } from "../api/tour-schemas";
import {
  CATEGORY_SHORT,
  CATEGORY_TONES,
  STATUS_META,
  spotsLeft,
} from "../model/labels";

interface TourCardProps {
  tour: TourSummary;
  /** Slot over the photo's top-left corner (the favourite button in Figma). */
  action?: ReactNode;
  /** Extra content under the title (e.g. smart-search match reasons). */
  footnote?: ReactNode;
  /**
   * Status pill on the photo. Shown for every status except `open` (the default state of a
   * listed tour, as in Figma); pass `true` to show it for open tours as well.
   */
  showStatus?: boolean;
  className?: string;
  imageLoading?: "lazy" | "eager";
}

/**
 * Tour summary card — Figma «Tour Card» (node 154:1138): location pill and favourite on the photo,
 * category · dates · duration, title, then price per person and capacity (confirmed/capacity).
 */
export function TourCard({
  tour,
  action,
  footnote,
  showStatus,
  className,
  imageLoading = "lazy",
}: TourCardProps) {
  const status = STATUS_META[tour.status];
  const category = tour.categories[0];
  const href = `/tours/${tour.id}`;
  const place =
    tour.destination && tour.destination !== tour.province
      ? `${tour.destination}، ${tour.province}`
      : tour.province;
  const full = spotsLeft(tour) === 0;
  const inactive = tour.status === "cancelled" || tour.status === "rejected";
  const statusVisible = showStatus ?? tour.status !== "open";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-surface p-px shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-float dark:border-line",
        className,
      )}
    >
      <div className="relative h-[177.5px] overflow-hidden rounded-t-[23px]">
        <img
          src={tour.coverImageUrl}
          alt={tour.title}
          width={568}
          height={355}
          loading={imageLoading}
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = "/images/tours/tour-mesr-desert.webp";
          }}
          className={cn(
            "size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105",
            inactive && "grayscale-[60%]",
          )}
        />
        <span className="absolute end-auto start-3 top-3 max-w-[70%] truncate rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-black leading-4 text-[#0a1311] backdrop-blur-[6px]">
          <span className="sr-only">مقصد: </span>
          {place}
        </span>
        {action && <div className="absolute end-3 top-3">{action}</div>}
        {statusVisible && (
          <Badge
            tone={status.tone}
            className="absolute bottom-3 start-3 shadow-sm"
          >
            <span className="sr-only">وضعیت: </span>
            {status.label}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="flex flex-col gap-2">
          <p className="flex flex-wrap items-center gap-2 text-[11px] font-medium leading-[16.5px] text-slate-500 dark:text-ink-muted">
            {category && (
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 font-bold",
                  CATEGORY_TONES[category],
                )}
              >
                {CATEGORY_SHORT[category]}
              </span>
            )}
            <span aria-hidden="true">•</span>
            <span>
              <span className="sr-only">زمان سفر: </span>
              {formatDateRangeShort(tour.startDate, tour.endDate)}
            </span>
            <span aria-hidden="true">•</span>
            <span>{toFaDigits(tour.durationDays)} روزه</span>
          </p>
          <h3 className="line-clamp-1 text-lg font-extrabold leading-7 text-slate-900 dark:text-white">
            <Link
              to={href}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {tour.title}
            </Link>
          </h3>
          {footnote}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-[17px] dark:border-line">
          <div>
            <p className="text-[10px] font-medium leading-[15px] text-slate-400 dark:text-ink-soft">
              برای هر نفر
            </p>
            <p className="mt-0.5 flex items-baseline gap-1 tracking-[-0.02em]">
              <span className="text-lg font-black leading-7 text-forest-900 dark:text-white">
                {formatNumber(tour.priceToman)}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-ink-muted">
                تومان
              </span>
            </p>
          </div>
          <p
            className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-[11px] py-[7px] dark:border-line dark:bg-surface-muted"
            aria-label={`ظرفیت: ${toFaDigits(tour.confirmedCount)} نفر از ${toFaDigits(tour.capacity)} نفر${full ? "، تکمیل" : ""}`}
          >
            <span
              className="text-[10px] font-medium leading-[15px] text-slate-500 dark:text-ink-muted"
              aria-hidden="true"
            >
              {full ? "تکمیل" : "ظرفیت"}
            </span>
            <span
              className={cn(
                "text-xs font-black leading-4",
                full
                  ? "text-coral-600"
                  : "text-emerald-600 dark:text-emerald-400",
              )}
              aria-hidden="true"
            >
              {toFaDigits(tour.confirmedCount)}/{toFaDigits(tour.capacity)}
            </span>
          </p>
        </div>
      </div>
    </article>
  );
}

/** Placeholder with the same geometry as {@link TourCard}, so results don't jump when they load. */
export function TourCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-3xl border border-slate-200/80 bg-surface dark:border-line"
      aria-hidden="true"
    >
      <div className="skeleton h-[177.5px]" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-3 w-3/4 rounded-md" />
        <div className="skeleton h-5 w-2/3 rounded-md" />
        <div className="flex items-center justify-between border-t border-line pt-4">
          <div className="space-y-1.5">
            <div className="skeleton h-2.5 w-12 rounded" />
            <div className="skeleton h-5 w-24 rounded-md" />
          </div>
          <div className="skeleton h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Accessible loading region with N skeleton cards. */
export function TourCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <>
      <span role="status" className="sr-only">
        در حال بارگذاری تورها
      </span>
      {Array.from({ length: count }, (_, i) => (
        <TourCardSkeleton key={i} />
      ))}
    </>
  );
}
