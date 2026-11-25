import { useState, type ReactNode } from "react";
import {
  BedDouble,
  Bus,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Compass,
  Crown,
  Gauge,
  Images,
  Info,
  MapPin,
  MessagesSquare,
  Route,
  Settings2,
  Share2,
  ShieldCheck,
  Star,
  UsersRound,
  UtensilsCrossed,
  Vote,
  Wallet,
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";
import { FavoriteButton } from "@/features/favorites/ui/FavoriteButton";
import { AlbumPanel } from "@/features/trip/ui/AlbumPanel";
import { ChatThread } from "@/features/trip/ui/ChatThread";
import { ExpensesPanel } from "@/features/trip/ui/ExpensesPanel";
import { PlanPanel } from "@/features/trip/ui/PlanPanel";
import { PollsChecklistPanel } from "@/features/trip/ui/PollsChecklistPanel";
import { ReviewsPanel } from "@/features/trip/ui/ReviewsPanel";
import { ReportButton } from "@/features/users/ui/ReportButton";
import { Tabs, type TabItem } from "@/shared/ui/Tabs";
import { ApiError } from "@/shared/api/errors";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { toFaDigits } from "@/shared/lib/digits";
import { formatDate, formatDateRange, formatToman } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { ButtonLink } from "@/shared/ui/Button";
import { Container } from "@/shared/ui/Container";
import { EmptyState, ErrorState, Skeleton } from "@/shared/ui/StateViews";
import type { TourDetail } from "../api/tour-schemas";
import { useTourDetail } from "../hooks";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  ITEM_TYPE_LABELS,
  STATUS_META,
  quorumRemaining,
  spotsLeft,
} from "../model/labels";
import { CreatorRequestsPanel } from "./CreatorRequestsPanel";
import { InviteLinksPanel } from "@/features/invites/ui/InviteLinksPanel";
import {
  JoinConfirmModal,
  OrganizerModal,
  ShareModal,
} from "./detail/DetailModals";
import { JoinPanel } from "./JoinPanel";

type DetailTab =
  "overview" | "plan" | "expenses" | "chat" | "polls" | "album" | "reviews";

/** Figma anchor tabs (sticky under the hero). */
const ANCHORS = [
  { id: "plan-section", label: "برنامه سفر" },
  { id: "about-section", label: "درباره سفر" },
  { id: "members-section", label: "همسفران" },
  { id: "reviews-section", label: "نظرات" },
  { id: "gallery-section", label: "تصاویر سفر" },
] as const;

export function TourDetailPage() {
  const { tourId = "" } = useParams();
  const {
    data: tour,
    isPending,
    isError,
    error,
    refetch,
  } = useTourDetail(tourId);
  useDocumentTitle(tour?.title ?? "جزئیات تور");

  if (isPending) return <DetailSkeleton />;
  if (isError || !tour) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Container className="py-16">
        {notFound ? (
          <EmptyState
            title="این تور پیدا نشد"
            text="ممکن است تور حذف یا هنوز منتشر نشده باشد."
            action={<ButtonLink to="/tours">مشاهده تورها</ButtonLink>}
          />
        ) : (
          <ErrorState
            text="دریافت اطلاعات تور ممکن نشد."
            onRetry={() => void refetch()}
          />
        )}
      </Container>
    );
  }
  return <TourDetailView tour={tour} />;
}

export function durationLabel(days: number): string {
  return days > 1
    ? `${toFaDigits(days)} روز و ${toFaDigits(days - 1)} شب`
    : "یک روزه";
}

function TourDetailView({ tour }: { tour: TourDetail }) {
  const [params, setParams] = useSearchParams();
  const [shareOpen, setShareOpen] = useState(false);
  const [organizerOpen, setOrganizerOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const member = Boolean(tour.viewer.isMember || tour.viewer.isCreator);
  const tabs: TabItem<DetailTab>[] = [
    {
      id: "overview",
      label: "نمای کلی",
      icon: <Info className="size-4" aria-hidden="true" />,
    },
    {
      id: "plan",
      label: "برنامه روزانه",
      icon: <Route className="size-4" aria-hidden="true" />,
    },
    {
      id: "expenses",
      label: "هزینه‌ها",
      icon: <Wallet className="size-4" aria-hidden="true" />,
    },
    {
      id: "chat",
      label: "گفت‌وگو",
      icon: <MessagesSquare className="size-4" aria-hidden="true" />,
    },
    {
      id: "polls",
      label: "رأی و چک‌لیست",
      icon: <Vote className="size-4" aria-hidden="true" />,
    },
    {
      id: "album",
      label: "آلبوم",
      icon: <Images className="size-4" aria-hidden="true" />,
    },
    ...(tour.viewer.canReview
      ? ([
          {
            id: "reviews",
            label: "امتیاز به همسفران",
            icon: <Star className="size-4" aria-hidden="true" />,
          },
        ] satisfies TabItem<DetailTab>[])
      : []),
  ];
  const visibleTabs = member ? tabs : [];
  const requested = params.get("tab") as DetailTab | null;
  const tab: DetailTab =
    requested && visibleTabs.some((t) => t.id === requested)
      ? requested
      : "overview";
  const setTab = (id: DetailTab) =>
    setParams(id === "overview" ? {} : { tab: id }, { replace: true });
  const quorum = quorumRemaining(tour);
  const heroStatus =
    tour.status === "open" && quorum > 0
      ? "در انتظار حد نصاب"
      : STATUS_META[tour.status].label;
  const openJoin = () => {
    setOrganizerOpen(false);
    setJoinOpen(true);
  };

  return (
    <div className="bg-[#f6f3ee] pb-14 dark:bg-transparent">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={tour.coverImageUrl}
          alt=""
          aria-hidden="true"
          onError={(e) => {
            e.currentTarget.src = "/images/tours/tour-mesr-desert.webp";
          }}
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-slate-950/20" />
        <Container className="flex min-h-[clamp(320px,40vw,460px)] flex-col justify-end pb-10 pt-8 text-white">
          <nav
            aria-label="مسیر صفحه"
            className="mb-auto flex items-center gap-1.5 text-xs text-white/75"
          >
            <Link to="/" className="hover:text-white">
              خانه
            </Link>
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            <Link to="/tours" className="hover:text-white">
              تورها
            </Link>
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            <span className="line-clamp-1 text-white">{tour.title}</span>
          </nav>
          <div className="mt-10 flex flex-wrap items-center gap-2 text-[11px] font-extrabold">
            <span className="rounded-full bg-coral-500 px-3 py-1.5 text-white">
              {heroStatus}
            </span>
            <HeroChip icon={<Clock3 className="size-3.5" />}>
              {durationLabel(tour.durationDays)}
            </HeroChip>
            <HeroChip icon={<CalendarDays className="size-3.5" />}>
              {formatDateRange(tour.startDate, tour.endDate)}
            </HeroChip>
            <HeroChip icon={<Gauge className="size-3.5" />}>
              سختی {DIFFICULTY_LABELS[tour.difficulty]}
            </HeroChip>
          </div>
          <h1 className="mt-4 max-w-3xl animate-fade-up text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
            {tour.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" />
              {tour.destination}، {tour.province}
            </span>
            {tour.rating !== null && (
              <span className="flex items-center gap-1 font-bold text-amber-300">
                <Star className="size-4 fill-current" aria-hidden="true" />
                {toFaDigits(tour.rating.toFixed(1))}
                <span className="font-normal text-white/70">
                  ({toFaDigits(tour.reviewCount)} نظر)
                </span>
              </span>
            )}
            {tour.categories.map((c) => (
              <span
                key={c}
                className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold backdrop-blur"
              >
                {CATEGORY_LABELS[c]}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* Sticky anchor bar */}
      <div className="sticky top-[72px] z-20 lg:top-20 border-b border-line bg-surface/95 backdrop-blur">
        <Container className="flex items-center gap-2">
          <nav
            aria-label="بخش‌های صفحه تور"
            className="flex min-w-0 flex-1 gap-1 overflow-x-auto py-2 [scrollbar-width:none]"
          >
            {ANCHORS.map((a) => (
              <a
                key={a.id}
                href={`#${a.id}`}
                className="shrink-0 rounded-full px-3.5 py-2 text-sm font-bold text-slate-600 transition hover:bg-coral-50 hover:text-coral-600 dark:text-ink-muted"
              >
                {a.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="اشتراک‌گذاری سفر"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink transition hover:border-coral-300 hover:text-coral-600"
          >
            <Share2 className="size-4" />
          </button>
        </Container>
      </div>

      <Container className="mt-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="min-w-0 space-y-8 lg:col-span-8">
            {member && (
              <section aria-label="ابزارهای همسفران" className="space-y-4">
                <Tabs
                  label="ابزارهای همسفران"
                  items={visibleTabs}
                  value={tab}
                  onChange={setTab}
                />
                {tab !== "overview" && (
                  <div
                    id={`panel-${tab}`}
                    role="tabpanel"
                    aria-labelledby={`tab-${tab}`}
                    key={tab}
                    className="animate-fade-up"
                  >
                    {tab === "plan" && <PlanPanel tour={tour} />}
                    {tab === "expenses" && <ExpensesPanel tourId={tour.id} />}
                    {tab === "chat" && (
                      <ChatThread
                        tourId={tour.id}
                        enabled={Boolean(
                          tour.viewer.canChat ||
                            tour.viewer.isCreator ||
                            tour.viewer.isMember,
                        )}
                        className="h-[min(70dvh,38rem)]"
                      />
                    )}
                    {tab === "polls" && (
                      <PollsChecklistPanel tourId={tour.id} />
                    )}
                    {tab === "album" && <AlbumPanel tourId={tour.id} />}
                    {tab === "reviews" && <ReviewsPanel tourId={tour.id} />}
                  </div>
                )}
              </section>
            )}
            {tour.viewer.isCreator && <CreatorStatusBanner tour={tour} />}
            {tab === "overview" && (
              <>
                <TimelineSection tour={tour} />
                <AboutSection tour={tour} />
                <MembersSection tour={tour} />
                <ReviewsSection tour={tour} />
                <GallerySection tour={tour} />
                {tour.viewer.isCreator && (
                  <>
                    <CreatorRequestsPanel tourId={tour.id} />
                    <section
                      className="rounded-panel border border-line bg-surface p-6 shadow-card"
                      aria-labelledby="invites-title"
                    >
                      <h2
                        id="invites-title"
                        className="mb-4 text-base font-black"
                      >
                        لینک‌های دعوت اختصاصی به تور
                      </h2>
                      <InviteLinksPanel tourId={tour.id} />
                    </section>
                  </>
                )}
              </>
            )}
          </div>

          <aside className="order-first lg:order-none lg:col-span-4">
            <div className="space-y-4 lg:sticky lg:top-36">
              <SidebarCard
                tour={tour}
                onOrganizer={() => setOrganizerOpen(true)}
                onJoin={() => setJoinOpen(true)}
              />
              <ul className="space-y-2 rounded-panel border border-line bg-surface p-4 text-xs leading-6 text-ink-muted">
                <li className="flex items-start gap-2">
                  <ShieldCheck
                    className="mt-0.5 size-4 shrink-0 text-forest-600"
                    aria-hidden="true"
                  />
                  برگزارکننده تأییدشده و سوابق همسفرها بررسی شده‌اند
                </li>
                <li className="flex items-start gap-2">
                  <Wallet
                    className="mt-0.5 size-4 shrink-0 text-forest-600"
                    aria-hidden="true"
                  />
                  پرداخت امن و نگهداری وجه تا تأیید درخواست
                </li>
              </ul>
              {!tour.viewer.isCreator && (
                <div className="px-2">
                  <ReportButton
                    targetType="tour"
                    targetId={tour.id}
                    label="گزارش تخلف این تور"
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      </Container>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        tour={tour}
      />
      <OrganizerModal
        open={organizerOpen}
        onClose={() => setOrganizerOpen(false)}
        tour={tour}
        onJoin={tour.viewer.canRequestJoin ? openJoin : undefined}
      />
      {tour.viewer.canRequestJoin && (
        <JoinConfirmModal
          open={joinOpen}
          onClose={() => setJoinOpen(false)}
          tour={tour}
        />
      )}
    </div>
  );
}

/** After «ارسال برای بررسی» the creator lands here: show the new status in words, not just a pill. */
function CreatorStatusBanner({ tour }: { tour: TourDetail }) {
  const text: Partial<
    Record<TourDetail["status"], { tone: string; title: string; body: string }>
  > = {
    draft: {
      tone: "border-line bg-surface",
      title: "وضعیت: پیش‌نویس",
      body: "این تور فقط برای شما قابل مشاهده است. برای انتشار، آن را از برنامه‌ریز برای بررسی ارسال کنید.",
    },
    pending_review: {
      tone: "border-amber-300 bg-amber-50 dark:bg-amber-500/10",
      title: "وضعیت: در انتظار بررسی مدیر",
      body: "تور شما ثبت شد و پس از تأیید مدیر سامانه در فهرست تورها منتشر می‌شود. تا آن زمان دیگران آن را نمی‌بینند.",
    },
    rejected: {
      tone: "border-danger/40 bg-danger/5",
      title: "وضعیت: رد شده",
      body: "این تور منتشر نشد. اطلاعات را اصلاح و دوباره برای بررسی ارسال کنید.",
    },
    open: {
      tone: "border-forest-300 bg-tint-mint",
      title: "وضعیت: منتشر شده",
      body: "تور شما در فهرست عمومی است و همسفرها می‌توانند درخواست بدهند.",
    },
  };
  const t = text[tour.status];
  if (!t) return null;
  return (
    <div role="status" className={`rounded-panel border p-4 ${t.tone}`}>
      <p className="text-sm font-black text-ink">{t.title}</p>
      <p className="mt-1 text-xs leading-6 text-ink-muted">{t.body}</p>
    </div>
  );
}

function HeroChip({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-white backdrop-blur">
      <span aria-hidden="true">{icon}</span>
      {children}
    </span>
  );
}

function SectionHead({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <p className="text-xs font-extrabold text-coral-500">{kicker}</p>
        <h2
          id={id}
          className="mt-1 text-xl font-black text-[#1c3c34] dark:text-ink sm:text-2xl"
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

const CARD =
  "scroll-mt-36 rounded-panel border border-line bg-surface p-5 sm:p-7";

function TimelineSection({ tour }: { tour: TourDetail }) {
  return (
    <section id="plan-section" className={CARD} aria-labelledby="plan-title">
      <SectionHead
        id="plan-title"
        kicker="برنامه روزبه‌روز"
        title="برنامه کامل سفر"
      />
      {tour.itinerary.length === 0 ? (
        <p className="text-sm text-ink-soft">
          برنامه روزانه هنوز منتشر نشده است.
        </p>
      ) : (
        <ol className="relative space-y-6 before:absolute before:inset-y-2 before:start-[1.1rem] before:w-px before:bg-line">
          {tour.itinerary.map((day) => (
            <li key={day.id} className="relative ps-12">
              <span className="absolute start-0 top-0 flex size-9 items-center justify-center rounded-full bg-[#1c3c34] text-sm font-black text-white">
                {toFaDigits(day.dayNumber)}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h3 className="text-base font-black">
                  روز {toFaDigits(day.dayNumber)}: {day.title}
                </h3>
                <span className="text-xs text-ink-soft">
                  {formatDate(day.date, false)}
                </span>
              </div>
              {day.items.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {day.items.map((it) => (
                    <li
                      key={it.id}
                      className="flex flex-wrap items-center gap-2 rounded-2xl bg-surface-muted px-3 py-2.5 text-sm"
                    >
                      {it.startTime && (
                        <span className="font-black text-coral-500">
                          {toFaDigits(it.startTime)}
                        </span>
                      )}
                      <span className="font-bold text-ink">{it.title}</span>
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-ink-soft">
                        {ITEM_TYPE_LABELS[it.type]}
                      </span>
                      {it.location && (
                        <span className="flex items-center gap-1 text-xs text-ink-soft">
                          <MapPin className="size-3" aria-hidden="true" />
                          {it.location}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function includeIcon(text: string) {
  if (/اتوبوس|مینی|ون|رفت|ترانسفر|خودرو|قطار|پرواز/.test(text)) return Bus;
  if (/اقامت|هتل|کمپ|چادر|بوم|اتاق/.test(text)) return BedDouble;
  if (/غذا|صبحانه|ناهار|شام|وعده/.test(text)) return UtensilsCrossed;
  if (/راهنما|لیدر|بلد|راهبلد/.test(text)) return Compass;
  return Check;
}

function AboutSection({ tour }: { tour: TourDetail }) {
  return (
    <section id="about-section" className={CARD} aria-labelledby="about-title">
      <SectionHead
        id="about-title"
        kicker="چیزی فراتر از یک مقصد"
        title="درباره این سفر"
      />
      <dl
        className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="مشخصات اصلی سفر"
      >
        {[
          {
            icon: Gauge,
            label: "سطح دشواری",
            value: DIFFICULTY_LABELS[tour.difficulty],
          },
          {
            icon: Compass,
            label: "سبک سفر",
            value: tour.categories.map((c) => CATEGORY_LABELS[c]).join("، "),
          },
          {
            icon: UsersRound,
            label: "ظرفیت",
            value: `${toFaDigits(tour.capacity)} نفر (حداقل ${toFaDigits(tour.minParticipants)})`,
          },
          {
            icon: Check,
            label: "اعضای قطعی",
            value: `${toFaDigits(tour.confirmedCount)} نفر`,
          },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-line p-3">
            <dt className="flex items-center gap-1.5 text-xs text-ink-soft">
              <Icon className="size-4 text-coral-500" aria-hidden="true" />
              {label}
            </dt>
            <dd className="mt-1 text-sm font-black leading-6 text-ink">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm leading-8 text-ink-muted">{tour.description}</p>
      {tour.includes.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tour.includes.map((inc) => {
            const Icon = includeIcon(inc);
            return (
              <li
                key={inc}
                className="flex flex-col items-start gap-2 rounded-2xl bg-surface-muted p-4"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-coral-50 text-coral-600 dark:bg-coral-500/15">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-xs font-bold leading-6 text-ink">
                  {inc}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {tour.highlights.length > 0 && (
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {tour.highlights.map((h) => (
            <li key={h} className="flex items-center gap-2 text-sm text-ink">
              <span className="flex size-5 items-center justify-center rounded-full bg-forest-100 text-forest-700 dark:bg-forest-900 dark:text-forest-200">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              {h}
            </li>
          ))}
        </ul>
      )}
      {tour.meetingPoint && (
        <p className="mt-6 flex items-start gap-2 rounded-2xl border border-dashed border-line p-3 text-xs leading-6 text-ink-muted">
          <MapPin
            className="mt-0.5 size-4 shrink-0 text-forest-600"
            aria-hidden="true"
          />
          محل حرکت: {tour.meetingPoint}
        </p>
      )}
    </section>
  );
}

function MembersSection({ tour }: { tour: TourDetail }) {
  return (
    <section
      id="members-section"
      className={CARD}
      aria-labelledby="members-title"
    >
      <SectionHead
        id="members-title"
        kicker="آدم‌های این تجربه"
        title="با همسفرها آشنا شو"
      >
        <span className="text-xs font-bold text-ink-soft">
          {toFaDigits(tour.confirmedCount)} همسفر قطعی
        </span>
      </SectionHead>
      {tour.members.length === 0 && tour.anonymousMembers === 0 ? (
        <p className="text-sm text-ink-soft">
          هنوز همسفری تأیید نشده است؛ اولین نفر باش!
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tour.members.map((m) => (
            <li key={m.id}>
              <Link
                to={`/users/${m.id}`}
                className="flex h-full flex-col items-center gap-2 rounded-2xl border border-line bg-surface-muted p-4 text-center transition hover:border-coral-300"
              >
                <Avatar name={m.displayName} src={m.avatarUrl} size="lg" />
                <span className="flex items-center gap-1 text-sm font-black">
                  {m.displayName}
                  {m.isLeader && (
                    <Crown
                      className="size-3.5 text-warning"
                      aria-label="تورلیدر"
                    />
                  )}
                </span>
                <span className="text-[11px] text-ink-soft">
                  {m.isLeader
                    ? "برگزارکننده"
                    : (m.tagline ?? m.city ?? "همسفر")}
                </span>
              </Link>
            </li>
          ))}
          {tour.anonymousMembers > 0 && (
            <li className="flex items-center justify-center rounded-2xl border border-dashed border-line p-4 text-xs text-ink-muted">
              + {toFaDigits(tour.anonymousMembers)} همسفر دیگر
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

function ReviewsSection({ tour }: { tour: TourDetail }) {
  const rating = tour.rating ?? tour.creator.rating;
  return (
    <section
      id="reviews-section"
      className={CARD}
      aria-labelledby="reviews-title"
    >
      <SectionHead
        id="reviews-title"
        kicker="تجربه‌های واقعی"
        title="نظر همسفرهای قبلی"
      />
      <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-[#1c3c34] p-5 text-white">
          <span className="text-4xl font-black">
            {rating !== null ? toFaDigits(rating.toFixed(1)) : "—"}
          </span>
          <span className="mt-1 flex gap-0.5 text-amber-300" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                className={`size-3.5 ${rating !== null && i < Math.round(rating) ? "fill-current" : ""}`}
              />
            ))}
          </span>
          <span className="mt-2 text-[11px] text-white/70">
            {toFaDigits(Math.max(tour.reviewCount, tour.creator.reviewCount))}{" "}
            تجربه ثبت‌شده
          </span>
        </div>
        {tour.leaderReviews.length === 0 ? (
          <p className="self-center text-sm text-ink-soft">
            هنوز نظری برای سفرهای این برگزارکننده ثبت نشده است.
          </p>
        ) : (
          <ul className="space-y-3">
            {tour.leaderReviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line p-4">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-black">
                    <Avatar name={r.authorName} src={null} size="sm" />
                    {r.authorName}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-coral-500">
                    <Star
                      className="size-3.5 fill-current"
                      aria-hidden="true"
                    />
                    {toFaDigits(r.rating)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-ink-muted">
                  {r.comment}
                </p>
                <p className="mt-1 text-[11px] text-ink-soft">
                  {r.tourTitle} · {formatDate(r.createdAt, false)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function GallerySection({ tour }: { tour: TourDetail }) {
  const images = tour.gallery.length > 0 ? tour.gallery : [tour.coverImageUrl];
  return (
    <section
      id="gallery-section"
      className={CARD}
      aria-labelledby="gallery-title"
    >
      <SectionHead
        id="gallery-title"
        kicker="قاب‌هایی از مسیر"
        title="تصاویر سفرهای قبلی"
      />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.slice(0, 6).map((g, i) => (
          <li key={g} className={i === 0 ? "col-span-2 row-span-2" : ""}>
            <img
              src={g}
              alt={`تصویر ${toFaDigits(i + 1)} از ${tour.title}`}
              loading="lazy"
              className="aspect-[4/3] size-full rounded-2xl object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CapacityRing({ value, max }: { value: number; max: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  return (
    <svg viewBox="0 0 80 80" className="size-20 -rotate-90" aria-hidden="true">
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        strokeWidth="8"
        className="stroke-surface-muted"
      />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        stroke="#e8604c"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        className="transition-all duration-700"
      />
    </svg>
  );
}

function SidebarCard({
  tour,
  onOrganizer,
  onJoin,
}: {
  tour: TourDetail;
  onOrganizer: () => void;
  onJoin: () => void;
}) {
  const left = spotsLeft(tour);
  const quorumReached = quorumRemaining(tour) === 0;
  return (
    <div className="rounded-panel border border-line bg-surface p-5 shadow-card sm:p-6">
      <button
        type="button"
        onClick={onOrganizer}
        className="flex w-full items-center gap-3 rounded-2xl bg-surface-muted p-3 text-start transition hover:bg-coral-50 dark:hover:bg-coral-500/10"
      >
        <Avatar
          name={tour.creator.displayName}
          src={tour.creator.avatarUrl}
          size="md"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] text-ink-soft">برگزارکننده</span>
          <span className="block truncate text-sm font-black">
            {tour.creator.displayName}
          </span>
        </span>
        {tour.creator.rating !== null && (
          <span className="flex items-center gap-1 text-xs font-bold text-coral-500">
            <Star className="size-3.5 fill-current" aria-hidden="true" />
            {toFaDigits(tour.creator.rating.toFixed(1))}
          </span>
        )}
        <ChevronLeft className="size-4 text-ink-soft" aria-hidden="true" />
      </button>

      <div className="mt-5 flex items-center gap-4">
        <div
          className="relative"
          role="img"
          aria-label={`${toFaDigits(tour.confirmedCount)} از ${toFaDigits(tour.capacity)} ظرفیت تکمیل شده`}
        >
          <CapacityRing value={tour.confirmedCount} max={tour.capacity} />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-black">
            <UsersRound
              className="me-0.5 size-3.5 text-coral-500"
              aria-hidden="true"
            />
            {toFaDigits(tour.confirmedCount)}
          </span>
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-black">
            {toFaDigits(tour.confirmedCount)} از {toFaDigits(tour.capacity)}{" "}
            ظرفیت تکمیل شده
          </p>
          <p
            className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-extrabold ${quorumReached ? "bg-tint-mint text-forest-800 dark:text-forest-100" : "bg-coral-50 text-coral-600 dark:bg-coral-500/15"}`}
          >
            حد نصاب {toFaDigits(tour.minParticipants)} نفر (
            {quorumReached ? "تشکیل قطعی" : "در انتظار"})
          </p>
          <p className="text-[11px] text-ink-soft">
            {left > 0 ? `${toFaDigits(left)} جای خالی` : "ظرفیت تکمیل"}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="text-xs text-ink-soft">هزینه تقریبی هر نفر</p>
        <p className="mt-1 text-2xl font-black text-[#1c3c34] dark:text-ink">
          {formatToman(tour.priceToman)}
        </p>
      </div>

      <JoinPanel tour={tour} onJoin={onJoin} />
      <div className="mt-3">
        <FavoriteButton tour={tour} variant="block" />
      </div>
      {tour.viewer.canManage && (
        <ButtonLink
          to={`/tours/${tour.id}/manage`}
          variant="secondary"
          className="mt-3 w-full"
          icon={<Settings2 className="size-4" />}
        >
          مدیریت تور (تورلیدر)
        </ButtonLink>
      )}
      {tour.status === "cancelled" && (
        <p className="mt-4 rounded-2xl bg-danger/10 p-3 text-xs leading-6 text-danger">
          این تور لغو شده است
          {tour.cancelReason ? `: ${tour.cancelReason}` : "."}
        </p>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری تور">
      <Skeleton className="h-[clamp(320px,40vw,460px)] rounded-none" />
      <Container className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96 lg:col-span-4" />
      </Container>
    </div>
  );
}
