import {
  Ban,
  CalendarDays,
  Compass,
  MapPin,
  MessageSquareDashed,
  Star,
  UserCheck,
} from "lucide-react";
import { useParams } from "react-router";
import { TourCard } from "@/features/tours/ui/TourCard";
import { ApiError, errorMessage } from "@/shared/api/errors";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { toFaDigits } from "@/shared/lib/digits";
import { formatDate, formatRating } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Container } from "@/shared/ui/Container";
import { Foliage } from "@/shared/ui/Foliage";
import { EmptyState, ErrorState, Skeleton } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import { useBlockUser, usePublicProfile } from "../hooks";
import { ReportButton } from "./ReportButton";
import { TravelerSummary, TravelerSummarySkeleton } from "./TravelerSummary";

/** Public traveller profile (FS 1 & 10): ratings from co-travellers, report and block. */
export function PublicProfilePage() {
  const { userId = "" } = useParams();
  const {
    data: p,
    isPending,
    isError,
    error,
    refetch,
  } = usePublicProfile(userId);
  const block = useBlockUser(userId);
  const toast = useToast();
  useDocumentTitle(p?.displayName ?? "پروفایل همسفر");

  if (isPending) return <ProfileSkeleton />;
  if (isError || !p) {
    return (
      <Container className="py-16">
        {error instanceof ApiError && error.status === 404 ? (
          <EmptyState
            title="این پروفایل در دسترس نیست"
            text="ممکن است کاربر حذف یا مسدود شده باشد."
          />
        ) : (
          <ErrorState
            text="دریافت پروفایل ممکن نشد."
            onRetry={() => void refetch()}
          />
        )}
      </Container>
    );
  }

  return (
    <div className="pb-12">
      <div className="relative overflow-hidden bg-forest-800 pb-24 pt-10 text-white dark:bg-forest-950">
        <Foliage
          variant="corner-top"
          className="absolute -left-6 -top-6 w-[clamp(90px,12vw,190px)]"
          motion="slow"
          eager
        />
        <Container className="relative flex flex-wrap items-center gap-5">
          <Avatar
            name={p.displayName}
            src={p.avatarUrl}
            size="xl"
            className="ring-4 ring-white/20"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-black sm:text-3xl">{p.displayName}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
              {p.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" aria-hidden="true" />
                  {p.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarDays className="size-4" aria-hidden="true" />
                عضو از {formatDate(p.joinedAt.slice(0, 10))}
              </span>
              <span className="flex items-center gap-1">
                <Compass className="size-4" aria-hidden="true" />
                {toFaDigits(p.tripsCount)} سفر
              </span>
              {p.rating !== null && (
                <span className="flex items-center gap-1 font-bold text-coral-300">
                  <Star className="size-4 fill-current" aria-hidden="true" />
                  {formatRating(p.rating)} ({toFaDigits(p.reviewCount)} نظر)
                </span>
              )}
            </p>
          </div>
          {!p.isMe && (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="light"
                size="sm"
                icon={
                  p.blockedByMe ? (
                    <UserCheck className="size-4" />
                  ) : (
                    <Ban className="size-4" />
                  )
                }
                loading={block.isPending}
                onClick={() =>
                  block.mutate(!p.blockedByMe, {
                    onSuccess: () =>
                      toast.success(
                        p.blockedByMe
                          ? "مسدودسازی برداشته شد."
                          : "این کاربر مسدود شد و پروفایل‌ها برای هم پنهان می‌شوند.",
                      ),
                    onError: (e) => toast.error(errorMessage(e)),
                  })
                }
              >
                {p.blockedByMe ? "رفع مسدودی" : "مسدود کردن"}
              </Button>
              <span className="rounded-lg bg-white/10 px-3 py-2 [&_button]:text-white/80">
                <ReportButton
                  targetType="user"
                  targetId={p.id}
                  label="گزارش تخلف"
                />
              </span>
            </div>
          )}
          {p.isMe && (
            <ButtonLink to="/profile?tab=settings" variant="light" size="sm">
              ویرایش پروفایل من
            </ButtonLink>
          )}
        </Container>
      </div>

      <Container className="relative z-[1] -mt-14 grid gap-6 lg:grid-cols-12">
        <aside
          className="h-fit rounded-panel border border-line bg-surface p-6 shadow-card lg:sticky lg:top-24 lg:col-span-4"
          aria-label="پروفایل سفر"
        >
          <h2 className="mb-4 text-base font-black">پروفایل سفر</h2>
          {p.blockedByMe ? (
            <p className="text-sm text-ink-muted">
              این کاربر را مسدود کرده‌اید؛ جزئیات پروفایل پنهان است.
            </p>
          ) : (
            <TravelerSummary data={p} />
          )}
        </aside>
        <div className="space-y-6 lg:col-span-8">
          <section
            className="rounded-panel border border-line bg-surface p-6 shadow-card"
            aria-labelledby="pr-reviews"
          >
            <h2 id="pr-reviews" className="text-lg font-black">
              نظر همسفران
            </h2>
            {p.reviews.length === 0 ? (
              <EmptyState
                className="mt-4 py-10"
                icon={<MessageSquareDashed className="size-7" />}
                title="هنوز نظری ثبت نشده است"
                text="پس از اولین سفر مشترک، همسفران می‌توانند به این کاربر امتیاز بدهند."
              />
            ) : (
              <ul className="mt-4 space-y-3">
                {p.reviews.map((r) => (
                  <li key={r.id} className="rounded-2xl bg-surface-muted p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold">{r.authorName}</span>
                      <span
                        className="flex items-center gap-0.5"
                        aria-label={`${toFaDigits(r.rating)} از ۵`}
                      >
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={
                              i < r.rating
                                ? "size-4 fill-coral-500 text-coral-500"
                                : "size-4 text-line"
                            }
                            aria-hidden="true"
                          />
                        ))}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-sm leading-7 text-ink-muted">
                        {r.comment}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-ink-soft">
                      سفر «{r.tourTitle}» ·{" "}
                      {formatDate(r.createdAt.slice(0, 10))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {p.ledTours.length > 0 && (
            <section aria-labelledby="pr-tours">
              <h2 id="pr-tours" className="mb-4 text-lg font-black">
                تورهای فعال این تورلیدر
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {p.ledTours.map((t) => (
                  <TourCard key={t.id} tour={t} />
                ))}
              </div>
            </section>
          )}
          {p.publicFavorites && p.publicFavorites.length > 0 && (
            <section aria-labelledby="pr-favs">
              <h2 id="pr-favs" className="mb-4 text-lg font-black">
                علاقه‌مندی‌های عمومی
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {p.publicFavorites.map((f) => (
                  <TourCard
                    key={f.tour.id}
                    tour={f.tour}
                    footnote={
                      f.label ? (
                        <p className="mt-1 text-[11px] font-bold text-forest-700 dark:text-forest-200">
                          #{f.label}
                        </p>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </Container>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="pb-12" role="status" aria-label="در حال بارگذاری پروفایل">
      <div className="bg-forest-800 pb-24 pt-10 dark:bg-forest-950">
        <Container className="flex items-center gap-5">
          <div className="size-24 animate-pulse rounded-full bg-white/15" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-48 animate-pulse rounded-lg bg-white/15" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded-lg bg-white/10" />
          </div>
        </Container>
      </div>
      <Container className="relative z-[1] -mt-14 grid gap-6 lg:grid-cols-12">
        <div className="rounded-panel border border-line bg-surface p-6 shadow-card lg:col-span-4">
          <TravelerSummarySkeleton />
        </div>
        <div className="space-y-4 rounded-panel border border-line bg-surface p-6 shadow-card lg:col-span-8">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </Container>
    </div>
  );
}
