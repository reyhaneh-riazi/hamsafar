import { Link } from "react-router";
import { FavoriteButton } from "@/features/favorites/ui/FavoriteButton";
import type {
  TourCategory,
  TourSummary,
} from "@/features/tours/api/tour-schemas";
import { CATEGORY_LABELS } from "@/features/tours/model/labels";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";
import { shortDateRange } from "../model/jalali";

/** «۴,۵۰۰,۰۰۰» — Persian digits with Latin thousands separators, as in the design. */
export function formatPrice(value: number): string {
  return toFaDigits(value.toLocaleString("en-US"));
}

const CATEGORY_TONES: Record<TourCategory, string> = {
  historic:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  nature: "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
  beach: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  camping:
    "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  adventure:
    "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
  family: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
};

function capacityLabel(tour: TourSummary) {
  return `${toFaDigits(tour.confirmedCount)}/${toFaDigits(tour.capacity)}`;
}

export function DesktopTourCard({ tour }: { tour: TourSummary }) {
  const category = tour.categories[0];
  const halfFull = tour.confirmedCount / tour.capacity > 0.5;
  return (
    <article className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs transition-all duration-300 hover:shadow-xl dark:border-[#233F36] dark:bg-[#132822]">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={tour.coverImageUrl}
          alt={tour.title}
          width={640}
          height={400}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-black text-[#0A1311] shadow-xs backdrop-blur-md">
          {tour.province}، {tour.destination}
        </span>
        <div className="absolute left-3 top-3">
          <FavoriteButton tour={tour} variant="glass" />
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-[#768B83]">
            <span>{toFaDigits(tour.durationDays)} روزه</span>
            <span>•</span>
            <span>{shortDateRange(tour.startDate, tour.endDate)}</span>
            {category && (
              <>
                <span>•</span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 font-bold",
                    CATEGORY_TONES[category],
                  )}
                >
                  {CATEGORY_LABELS[category]}
                </span>
              </>
            )}
          </div>
          <h3 className="line-clamp-1 text-lg font-extrabold text-slate-900 transition group-hover:text-[#e8604c] dark:text-[#F5F7F6]">
            <Link
              to={`/tours/${tour.id}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {tour.title}
            </Link>
          </h3>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-[#233F36]">
          <div className="text-right">
            <span className="block text-[10px] font-medium text-slate-400 dark:text-[#94a3b8]">
              برای هر نفر
            </span>
            <span className="flex items-baseline gap-1 text-lg font-black tracking-[-0.02em] text-[#0f2c25] dark:text-[#6ee7b7]">
              {formatPrice(tour.priceToman)}{" "}
              <span className="text-xs font-medium text-slate-500 dark:text-[#cbd5e1]">
                تومان
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1.5 dark:border-[#233F36] dark:bg-[#0D1714]">
            <span
              className={cn(
                "text-xs font-black",
                halfFull ? "text-emerald-600" : "text-amber-600",
              )}
            >
              {capacityLabel(tour)}
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-[#768B83]">
              ظرفیت
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function MobileTourCard({ tour }: { tour: TourSummary }) {
  const category = tour.categories[0];
  return (
    <article className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm transition duration-300 dark:border-stone-800 dark:bg-[#132822]">
      <div className="relative h-56 w-full overflow-hidden">
        <img
          src={tour.coverImageUrl}
          alt={tour.title}
          width={640}
          height={448}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
        <div className="absolute right-3 top-3">
          <span className="inline-block rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-bold text-stone-900 shadow-sm backdrop-blur-md dark:bg-black/75 dark:text-white">
            {tour.province}، {tour.destination}
          </span>
        </div>
        <div className="absolute left-3 top-3">
          <FavoriteButton tour={tour} variant="glass" />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-start gap-2 text-right text-xs">
          <span className="font-medium text-stone-500 dark:text-stone-400">
            {toFaDigits(tour.durationDays)} روزه
          </span>
          <span className="text-stone-300 dark:text-stone-600">•</span>
          <span className="font-medium text-stone-500 dark:text-stone-400">
            {shortDateRange(tour.startDate, tour.endDate)}
          </span>
          {category && (
            <>
              <span className="text-stone-300 dark:text-stone-600">•</span>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                {CATEGORY_LABELS[category]}
              </span>
            </>
          )}
        </div>
        <h3 className="pt-0.5 text-lg font-black leading-snug text-stone-900 dark:text-white">
          <Link
            to={`/tours/${tour.id}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {tour.title}
          </Link>
        </h3>
        <div className="h-px bg-stone-100 pt-0.5 dark:bg-stone-800/80" />
        <div className="flex items-center justify-between pt-1">
          <div className="text-right">
            <span className="block text-[10px] font-normal text-stone-400">
              برای هر نفر
            </span>
            <div className="flex items-baseline justify-start gap-1">
              <span className="text-base font-black tracking-tight text-stone-900 dark:text-white">
                {formatPrice(tour.priceToman)}
              </span>
              <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                تومان
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-900/10 bg-[#f0f9f8] px-3.5 py-1.5 shadow-sm dark:bg-[#1B332B]">
            <span className="text-xs font-semibold text-[#486581] dark:text-stone-300">
              ظرفیت
            </span>
            <span className="font-mono text-xs font-bold tracking-tight text-[#00a896] dark:text-emerald-400">
              {capacityLabel(tour)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function DesktopTourCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-[#233F36] dark:bg-[#132822]"
      aria-hidden="true"
    >
      <div className="skeleton aspect-[16/10]" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-3 w-2/3 rounded-md" />
        <div className="skeleton h-5 w-3/4 rounded-md" />
        <div className="skeleton h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function MobileTourCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white dark:border-stone-800 dark:bg-[#132822]"
      aria-hidden="true"
    >
      <div className="skeleton h-56" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-3 w-2/3 rounded-md" />
        <div className="skeleton h-5 w-3/4 rounded-md" />
        <div className="skeleton h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}
