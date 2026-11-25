import type { BadgeTone } from "@/shared/ui/Badge";
import type {
  Difficulty,
  ItineraryItemType,
  JoinStatus,
  TourBadge,
  TourCategory,
  TourStatus,
  TourSummary,
} from "../api/tour-schemas";

export const CATEGORY_LABELS: Record<TourCategory, string> = {
  camping: "کمپینگ و طبیعت",
  family: "خانوادگی",
  adventure: "ماجراجویی",
  historic: "تاریخی و فرهنگی",
  beach: "ساحلی",
  nature: "طبیعت‌گردی",
};

export const CATEGORY_ORDER: readonly TourCategory[] = [
  "camping",
  "family",
  "adventure",
  "historic",
  "beach",
  "nature",
];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "آسان",
  moderate: "نیمه‌سنگین",
  hard: "سخت",
};

export const BADGE_META: Record<TourBadge, { label: string; tone: BadgeTone }> =
  {
    special_offer: { label: "تخفیف ویژه", tone: "coral" },
    new: { label: "جدید", tone: "green" },
    popular: { label: "محبوب", tone: "coral" },
    best_seller: { label: "پرفروش", tone: "coral" },
  };

export const STATUS_META: Record<
  TourStatus,
  { label: string; tone: BadgeTone }
> = {
  draft: { label: "پیش‌نویس", tone: "neutral" },
  pending_review: { label: "در انتظار بررسی", tone: "amber" },
  open: { label: "در حال تکمیل ظرفیت", tone: "info" },
  confirmed: { label: "قطعی شده", tone: "brand" },
  cancelled: { label: "لغو شده", tone: "danger" },
  completed: { label: "برگزار شده", tone: "neutral" },
  rejected: { label: "رد شده", tone: "danger" },
};

export const JOIN_STATUS_META: Record<
  JoinStatus,
  { label: string; tone: BadgeTone }
> = {
  pending: { label: "در انتظار تأیید", tone: "amber" },
  approved: { label: "تأیید شده", tone: "brand" },
  rejected: { label: "رد شده", tone: "danger" },
  cancelled: { label: "لغو شده", tone: "neutral" },
};

export const ITEM_TYPE_LABELS: Record<ItineraryItemType, string> = {
  accommodation: "اقامت",
  restaurant: "رستوران",
  attraction: "جاذبه",
  activity: "فعالیت",
  transport: "جابه‌جایی",
};

export function spotsLeft(
  tour: Pick<TourSummary, "capacity" | "confirmedCount">,
): number {
  return Math.max(0, tour.capacity - tour.confirmedCount);
}

export function quorumRemaining(
  tour: Pick<TourSummary, "minParticipants" | "confirmedCount">,
): number {
  return Math.max(0, tour.minParticipants - tour.confirmedCount);
}

export function isBookable(
  tour: Pick<TourSummary, "status" | "capacity" | "confirmedCount">,
): boolean {
  return (
    (tour.status === "open" || tour.status === "confirmed") &&
    spotsLeft(tour) > 0
  );
}

/** Category pill colours on tour cards (Figma: ماجراجویی = purple, کمپینگ = orange). Complete class strings for Tailwind. */
export const CATEGORY_TONES: Record<TourCategory, string> = {
  adventure:
    "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  camping:
    "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  nature:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  beach: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  historic:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  family: "bg-pink-50 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
};

/** Short category names for card pills (Figma: «کمپینگ», «ماجراجویی»). */
export const CATEGORY_SHORT: Record<TourCategory, string> = {
  camping: "کمپینگ",
  family: "خانوادگی",
  adventure: "ماجراجویی",
  historic: "تاریخی",
  beach: "ساحلی",
  nature: "طبیعت‌گردی",
};
