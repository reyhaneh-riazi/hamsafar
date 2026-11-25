import type { ReactNode } from "react";
import { Compass, Heart, Languages, Quote, Star, Wallet } from "lucide-react";
import { categorySchema } from "@/features/tours/api/tour-schemas";
import { CATEGORY_LABELS } from "@/features/tours/model/labels";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";
import { formatRating } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Skeleton } from "@/shared/ui/StateViews";

export interface TravelerSummaryData {
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  travelStyles: readonly string[];
  languages: readonly string[];
  interests: readonly string[];
  budgetRange: string | null;
  rating: number | null;
  reviewCount?: number;
  tripsCount: number;
}

/** Travel-style IDs share the tour category enum; unknown values are shown as sent. */
export function travelStyleLabel(value: string): string {
  const parsed = categorySchema.safeParse(value);
  return parsed.success ? CATEGORY_LABELS[parsed.data] : value;
}

function Row({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-tint-mint text-forest-700 dark:text-forest-200">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-black text-ink-soft">{title}</dt>
        <dd className="mt-1.5">{children}</dd>
      </div>
    </div>
  );
}

function Pills({
  items,
  tone = "mint",
}: {
  items: readonly string[];
  tone?: "mint" | "muted";
}) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((x) => (
        <li
          key={x}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            tone === "mint"
              ? "bg-tint-mint text-forest-800 dark:text-forest-100"
              : "bg-surface-muted text-ink-muted",
          )}
        >
          {x}
        </li>
      ))}
    </ul>
  );
}

function Missing({ text }: { text: string }) {
  return <p className="text-xs text-ink-soft">{text}</p>;
}

/**
 * Traveller "card": photo, bio, travel styles, languages, interests, budget, rating and trips.
 * Used on the public profile and on the user's own profile overview. Missing values get an
 * explicit "not set" line instead of disappearing, so the layout is the same for every user.
 */
export function TravelerSummary({
  data,
  showIdentity = false,
  emptyHint,
}: {
  data: TravelerSummaryData;
  showIdentity?: boolean;
  emptyHint?: ReactNode;
}) {
  const missing = "ثبت نشده";
  return (
    <div>
      {showIdentity && (
        <div className="mb-5 flex items-center gap-3">
          <Avatar name={data.displayName} src={data.avatarUrl} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-black">{data.displayName}</p>
            {!data.avatarUrl && (
              <p className="text-[11px] text-ink-soft">
                عکس پروفایل اضافه نشده
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-muted p-3 text-center">
          <p className="flex items-center justify-center gap-1 text-lg font-black text-coral-500">
            <Star className="size-4 fill-current" aria-hidden="true" />
            {data.rating !== null ? formatRating(data.rating) : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            {data.rating !== null && data.reviewCount !== undefined
              ? `امتیاز از ${toFaDigits(data.reviewCount)} نظر`
              : data.rating !== null
                ? "امتیاز همسفران"
                : "هنوز امتیازی ندارد"}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-muted p-3 text-center">
          <p className="flex items-center justify-center gap-1 text-lg font-black text-forest-700 dark:text-forest-200">
            <Compass className="size-4" aria-hidden="true" />
            {toFaDigits(data.tripsCount)}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-muted">سفر انجام‌شده</p>
        </div>
      </div>

      <dl className="mt-5 space-y-4">
        <Row
          icon={<Quote className="size-4" aria-hidden="true" />}
          title="درباره من"
        >
          {data.bio ? (
            <p className="whitespace-pre-line text-sm leading-7 text-ink-muted">
              {data.bio}
            </p>
          ) : (
            <Missing text="بیوگرافی ثبت نشده است." />
          )}
        </Row>
        <Row
          icon={<Compass className="size-4" aria-hidden="true" />}
          title="سبک سفر"
        >
          {data.travelStyles.length ? (
            <Pills items={data.travelStyles.map(travelStyleLabel)} />
          ) : (
            <Missing text={missing} />
          )}
        </Row>
        <Row
          icon={<Languages className="size-4" aria-hidden="true" />}
          title="زبان‌ها"
        >
          {data.languages.length ? (
            <Pills items={data.languages} tone="muted" />
          ) : (
            <Missing text={missing} />
          )}
        </Row>
        <Row
          icon={<Heart className="size-4" aria-hidden="true" />}
          title="علایق"
        >
          {data.interests.length ? (
            <Pills items={data.interests} tone="muted" />
          ) : (
            <Missing text={missing} />
          )}
        </Row>
        <Row
          icon={<Wallet className="size-4" aria-hidden="true" />}
          title="بودجه سفر"
        >
          {data.budgetRange ? (
            <p className="text-sm font-bold text-ink">{data.budgetRange}</p>
          ) : (
            <Missing text={missing} />
          )}
        </Row>
      </dl>
      {emptyHint}
    </div>
  );
}

export function TravelerSummarySkeleton() {
  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <div className="mt-5 space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-8 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
