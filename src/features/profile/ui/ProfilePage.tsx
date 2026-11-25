import { useState, type FormEvent, type ReactNode } from "react";
import {
  CalendarDays,
  Compass,
  Eye,
  Heart,
  LayoutGrid,
  LogOut,
  Map,
  MonitorSmartphone,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  displayName,
  EMAIL_PATTERN,
  type User,
} from "@/features/auth/api/auth-schemas";
import {
  useAvatar,
  useLogout,
  useRevokeSession,
  useSession,
  useSessions,
  useUpdateProfile,
} from "@/features/auth/hooks";
import { useFavorites } from "@/features/favorites/hooks";
import { TravelerSummary } from "@/features/users/ui/TravelerSummary";
import { useCancelJoin, useMyTours, useMyTrips } from "@/features/tours/hooks";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  JOIN_STATUS_META,
  STATUS_META,
} from "@/features/tours/model/labels";
import type { MyTrip } from "@/features/tours/api/tour-schemas";
import { ApiError, errorMessage } from "@/shared/api/errors";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";
import { formatDate, formatDateTime, formatToman } from "@/shared/lib/format";
import { formatMobile } from "@/shared/lib/phone";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { TextArea, TextField } from "@/shared/ui/Field";
import { Foliage } from "@/shared/ui/Foliage";
import { Chip } from "@/shared/ui/Chip";
import { ImagePicker, type PickedImage } from "@/shared/ui/ImagePicker";
import { Modal } from "@/shared/ui/Modal";
import { mutationStatus, RequestFeedback } from "@/shared/ui/RequestFeedback";
import { TagInput } from "@/shared/ui/TagInput";
import { formatBytes } from "@/shared/lib/image";
import { EmptyState, ErrorState, Skeleton } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";

const TABS = [
  { id: "overview", label: "نمای کلی", icon: LayoutGrid },
  { id: "trips", label: "سفرهای من", icon: Map },
  { id: "tours", label: "تورهای من", icon: Compass },
  { id: "settings", label: "ویرایش پروفایل", icon: Settings },
  { id: "security", label: "امنیت و نشست‌ها", icon: ShieldCheck },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function ProfilePage() {
  useDocumentTitle("پروفایل من");
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const tab: TabId = TABS.some((t) => t.id === raw)
    ? (raw as TabId)
    : "overview";
  if (!user) return null;
  const name = displayName(user);

  return (
    <div className="pb-12">
      <div className="relative overflow-hidden bg-forest-800 pb-24 pt-10 text-white dark:bg-forest-950">
        <Foliage
          variant="corner-top"
          className="absolute -left-6 -top-6 w-[clamp(90px,12vw,190px)]"
          motion="slow"
          eager
        />
        <div
          className="absolute -bottom-24 right-1/4 size-72 rounded-full bg-coral-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-page flex-wrap items-center gap-5 px-4 sm:px-6 lg:px-8">
          <AvatarEditor name={name} src={user.avatarUrl} />
          <div className="animate-fade-up">
            <h1 className="text-2xl font-black sm:text-3xl">{name}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
              {user.phone ? (
                <span className="ltr-island">{formatMobile(user.phone)}</span>
              ) : user.email ? (
                <span className="ltr-island">{user.email}</span>
              ) : null}
              {user.city && <span>{user.city}</span>}
              <span>عضو از {formatDate(user.createdAt.slice(0, 10))}</span>
              {user.role === "admin" && <Badge tone="coral">مدیر سامانه</Badge>}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Compass className="size-4" aria-hidden="true" />
                {toFaDigits(user.tripsCount)} سفر
              </span>
              {user.rating !== null && (
                <span className="flex items-center gap-1 font-bold text-coral-300">
                  <Star className="size-4 fill-current" aria-hidden="true" />
                  {toFaDigits(user.rating.toFixed(1))}
                </span>
              )}
              <Link
                to={`/users/${user.id}`}
                className="flex items-center gap-1 underline-offset-4 hover:underline"
              >
                <Eye className="size-4" aria-hidden="true" />
                پروفایل عمومی من
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto -mt-14 max-w-page px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <nav aria-label="بخش‌های پروفایل" className="lg:col-span-3">
            <ul className="no-scrollbar flex gap-1 overflow-x-auto rounded-panel border border-line bg-surface p-2 shadow-card lg:sticky lg:top-24 lg:flex-col">
              {TABS.map(({ id, label, icon: Icon }) => (
                <li key={id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setParams(id === "overview" ? {} : { tab: id })
                    }
                    aria-current={tab === id ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-bold transition",
                      tab === id
                        ? "bg-forest-800 text-white dark:bg-forest-500"
                        : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                    )}
                  >
                    <Icon className="size-[18px]" aria-hidden="true" />
                    {label}
                  </button>
                </li>
              ))}
              <li className="shrink-0 lg:mt-1 lg:border-t lg:border-line lg:pt-1">
                <Link
                  to="/favorites"
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-bold text-ink-muted hover:bg-surface-muted hover:text-ink"
                >
                  <Heart className="size-[18px]" aria-hidden="true" />
                  علاقه‌مندی‌ها
                </Link>
              </li>
            </ul>
          </nav>
          <div key={tab} className="animate-fade-up lg:col-span-9">
            {tab === "overview" && (
              <Overview user={user} onTab={(t) => setParams({ tab: t })} />
            )}
            {tab === "trips" && <Trips userId={user.id} />}
            {tab === "tours" && <MyTours userId={user.id} />}
            {tab === "settings" && <ProfileForm user={user} />}
            {tab === "security" && <Security userId={user.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Profile photo: pick (gallery / camera / computer) → validated preview → confirm upload. */
function AvatarEditor({ name, src }: { name: string; src: string | null }) {
  const avatar = useAvatar();
  const toast = useToast();
  const [pending, setPending] = useState<PickedImage | null>(null);

  const close = () => {
    if (pending) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    avatar.reset();
  };
  const upload = () =>
    pending &&
    avatar.mutate(pending.blob, {
      onSuccess: () => {
        toast.success("عکس پروفایل به‌روز شد.");
        close();
      },
    });

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar
          name={name}
          src={src}
          size="xl"
          className="ring-4 ring-white/20"
        />
        {avatar.isPending && !pending && (
          <span
            className="absolute inset-0 animate-pulse rounded-full bg-black/40"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="[&_button]:border-white/30 [&_button]:bg-white/10 [&_button]:text-white [&_[role=alert]]:bg-white [&_[role=alert]_button]:bg-transparent [&_[role=alert]_button]:text-ink-soft">
        <ImagePicker
          compact
          maxSize={600}
          label={src ? "تغییر عکس" : "افزودن عکس"}
          disabled={avatar.isPending}
          onPick={([img]) => img && setPending(img)}
        >
          {src && (
            <button
              type="button"
              aria-label="حذف عکس پروفایل"
              disabled={avatar.isPending}
              onClick={() =>
                avatar.mutate(null, {
                  onSuccess: () => toast.success("عکس پروفایل حذف شد."),
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
              className="inline-flex h-9 items-center rounded-lg border px-2.5 text-xs font-bold"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </ImagePicker>
      </div>
      <Modal
        open={pending !== null}
        onClose={close}
        title="پیش‌نمایش عکس پروفایل"
        description="عکس به شکل دایره نمایش داده می‌شود."
        size="sm"
        dismissible={!avatar.isPending}
      >
        {pending && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={pending.previewUrl}
              alt="پیش‌نمایش عکس جدید"
              className="size-40 rounded-full object-cover ring-4 ring-surface-muted"
            />
            <p className="text-xs text-ink-muted">
              {toFaDigits(pending.width)}×{toFaDigits(pending.height)} پیکسل ·{" "}
              {formatBytes(pending.originalSize)} ← {formatBytes(pending.size)}{" "}
              پس از فشرده‌سازی
            </p>
            <RequestFeedback
              className="w-full"
              status={mutationStatus(avatar)}
              loadingText="در حال بارگذاری عکس..."
              error={avatar.error}
              onRetry={upload}
            />
            <div className="flex w-full gap-3">
              <Button
                variant="ghost"
                fullWidth
                onClick={close}
                disabled={avatar.isPending}
              >
                انصراف
              </Button>
              <Button fullWidth onClick={upload} loading={avatar.isPending}>
                ذخیره عکس
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-panel border border-line bg-surface p-6 shadow-card sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Overview({ user, onTab }: { user: User; onTab: (t: TabId) => void }) {
  const trips = useMyTrips(user.id);
  const tours = useMyTours(user.id);
  const favorites = useFavorites();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (trips.data ?? [])
    .filter((t) => t.request.status === "approved" && t.tour.startDate >= today)
    .sort((a, b) => a.tour.startDate.localeCompare(b.tour.startDate))[0];
  const checks = [
    Boolean(user.firstName && user.lastName),
    Boolean(user.avatarUrl),
    Boolean(user.city),
    Boolean(user.bio),
    user.travelStyles.length > 0,
    user.languages.length > 0,
    user.interests.length > 0,
    Boolean(user.budgetRange),
  ];
  const completeness = Math.round(
    (checks.filter(Boolean).length / checks.length) * 100,
  );

  const stats = [
    {
      label: "سفرهای من",
      value: trips.data?.length,
      icon: Map,
      tab: "trips" as const,
    },
    {
      label: "تورهای ساخته‌شده",
      value: tours.data?.length,
      icon: Compass,
      tab: "tours" as const,
    },
    {
      label: "علاقه‌مندی‌ها",
      value: favorites.data?.length,
      icon: Heart,
      tab: undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, tab }) => {
          const content = (
            <>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-tint-mint text-forest-700 dark:text-forest-200">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-2xl font-black">
                  {value === undefined ? "—" : toFaDigits(value)}
                </span>
                <span className="block text-xs text-ink-muted">{label}</span>
              </span>
            </>
          );
          const cls =
            "flex items-center gap-4 rounded-panel border border-line bg-surface p-5 shadow-card transition hover:-translate-y-0.5 text-start w-full";
          return tab ? (
            <button
              key={label}
              type="button"
              onClick={() => onTab(tab)}
              className={cls}
            >
              {content}
            </button>
          ) : (
            <Link key={label} to="/favorites" className={cls}>
              {content}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="سفر بعدی">
          {trips.isPending ? (
            <Skeleton className="h-28" />
          ) : upcoming ? (
            <Link
              to={`/tours/${upcoming.tour.id}`}
              className="group flex gap-4"
            >
              <img
                src={upcoming.tour.coverImageUrl}
                alt=""
                className="h-24 w-32 shrink-0 rounded-2xl object-cover transition group-hover:brightness-110"
              />
              <div>
                <p className="font-black group-hover:text-coral-500">
                  {upcoming.tour.title}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {formatDate(upcoming.tour.startDate)}
                </p>
                <Badge
                  tone={STATUS_META[upcoming.tour.status].tone}
                  className="mt-2"
                >
                  {STATUS_META[upcoming.tour.status].label}
                </Badge>
              </div>
            </Link>
          ) : (
            <div className="text-sm text-ink-muted">
              هنوز سفر قطعی پیش رو ندارید.
              <ButtonLink
                to="/tours"
                size="sm"
                className="mt-4"
                icon={<Sparkles className="size-4" />}
              >
                پیدا کردن سفر
              </ButtonLink>
            </div>
          )}
        </Card>
        <Card title="تکمیل پروفایل">
          <div className="flex items-center gap-4">
            <div className="relative size-20 shrink-0">
              <svg
                viewBox="0 0 36 36"
                className="size-20 -rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  className="stroke-surface-muted"
                  strokeWidth="4"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  className="stroke-coral-500"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${completeness} 100`}
                  pathLength={100}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-black">
                {toFaDigits(completeness)}٪
              </span>
            </div>
            <div className="text-sm leading-7 text-ink-muted">
              پروفایل کامل‌تر یعنی اعتماد بیشتر برگزارکننده‌ها و همسفرها.
              <button
                type="button"
                onClick={() => onTab("settings")}
                className="mt-1 block font-bold text-coral-500 hover:text-coral-600"
              >
                تکمیل اطلاعات
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="پروفایل سفر من"
        action={
          <button
            type="button"
            onClick={() => onTab("settings")}
            className="text-sm font-bold text-coral-500 hover:text-coral-600"
          >
            ویرایش
          </button>
        }
      >
        <p className="-mt-3 mb-5 text-xs text-ink-muted">
          همسفرها و تورلیدرها این اطلاعات را در پروفایل عمومی شما می‌بینند.
        </p>
        <TravelerSummary
          showIdentity
          data={{
            displayName: displayName(user),
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            travelStyles: user.travelStyles,
            languages: user.languages,
            interests: user.interests,
            budgetRange: user.budgetRange,
            rating: user.rating,
            tripsCount: user.tripsCount,
          }}
        />
      </Card>
    </div>
  );
}

function TripRow({ trip }: { trip: MyTrip }) {
  const cancel = useCancelJoin(trip.tour.id);
  const toast = useToast();
  const meta = JOIN_STATUS_META[trip.request.status];
  const canCancel =
    (trip.request.status === "pending" || trip.request.status === "approved") &&
    trip.tour.status !== "completed";
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-line p-4 sm:flex-row sm:items-center">
      <img
        src={trip.tour.coverImageUrl}
        alt=""
        className="h-20 w-full rounded-xl object-cover sm:w-28"
      />
      <div className="min-w-0 flex-1">
        <Link
          to={`/tours/${trip.tour.id}`}
          className="font-black hover:text-coral-500"
        >
          {trip.tour.title}
        </Link>
        <p className="mt-1 text-xs text-ink-muted">
          {formatDate(trip.tour.startDate)} ·{" "}
          {toFaDigits(trip.tour.durationDays)} روز ·{" "}
          {formatToman(trip.tour.priceToman)}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone={meta.tone}>درخواست: {meta.label}</Badge>
          <Badge tone={STATUS_META[trip.tour.status].tone}>
            تور: {STATUS_META[trip.tour.status].label}
          </Badge>
        </div>
      </div>
      {canCancel && (
        <Button
          size="sm"
          variant="ghost"
          className="text-danger"
          loading={cancel.isPending}
          onClick={() =>
            cancel.mutate(undefined, {
              onSuccess: () => toast.success("درخواست لغو شد."),
              onError: (err) => toast.error(errorMessage(err)),
            })
          }
        >
          لغو
        </Button>
      )}
    </li>
  );
}

function RowSkeletons() {
  return (
    <ul className="space-y-3" role="status" aria-label="در حال بارگذاری">
      {Array.from({ length: 3 }, (_, i) => (
        <li
          key={i}
          className="flex flex-col gap-4 rounded-2xl border border-line p-4 sm:flex-row sm:items-center"
        >
          <Skeleton className="h-20 w-full sm:w-28" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Trips({ userId }: { userId: string }) {
  const { data, isPending, isError, refetch } = useMyTrips(userId);
  return (
    <Card title="سفرهای من">
      {isPending && <RowSkeletons />}
      {isError && (
        <ErrorState
          text="دریافت سفرها ممکن نشد."
          onRetry={() => void refetch()}
        />
      )}
      {data?.length === 0 && (
        <EmptyState
          title="هنوز به سفری نپیوسته‌اید"
          text="تورها را بگردید و درخواست پیوستن بدهید."
          action={
            <ButtonLink to="/tours" size="sm">
              مشاهده تورها
            </ButtonLink>
          }
        />
      )}
      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((t) => (
            <TripRow key={t.request.id} trip={t} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function MyTours({ userId }: { userId: string }) {
  const { data, isPending, isError, refetch } = useMyTours(userId);
  return (
    <Card
      title="تورهای من"
      action={
        <ButtonLink to="/planner" size="sm">
          ساخت تور جدید
        </ButtonLink>
      }
    >
      {isPending && <RowSkeletons />}
      {isError && (
        <ErrorState
          text="دریافت تورها ممکن نشد."
          onRetry={() => void refetch()}
        />
      )}
      {data?.length === 0 && (
        <EmptyState
          title="هنوز توری نساخته‌اید"
          text="با برنامه‌ریز سفر، اولین تور گروهی‌تان را بسازید."
          action={
            <ButtonLink to="/planner" size="sm">
              ساخت اولین تور
            </ButtonLink>
          }
        />
      )}
      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((t) => (
            <li
              key={t.id}
              className="flex flex-col gap-4 rounded-2xl border border-line p-4 sm:flex-row sm:items-center"
            >
              <img
                src={t.coverImageUrl}
                alt=""
                className="h-20 w-full rounded-xl object-cover sm:w-28"
              />
              <div className="min-w-0 flex-1">
                <Link
                  to={`/tours/${t.id}`}
                  className="font-black hover:text-coral-500"
                >
                  {t.title}
                </Link>
                <p className="mt-1 text-xs text-ink-muted">
                  {formatDate(t.startDate)} · {toFaDigits(t.confirmedCount)} از{" "}
                  {toFaDigits(t.capacity)} نفر
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={STATUS_META[t.status].tone}>
                    {STATUS_META[t.status].label}
                  </Badge>
                  {t.pendingRequests > 0 && (
                    <Badge tone="coral">
                      <Users className="size-3" aria-hidden="true" />
                      {toFaDigits(t.pendingRequests)} درخواست جدید
                    </Badge>
                  )}
                </div>
              </div>
              {t.status === "draft" ? (
                <ButtonLink
                  to={`/planner?draft=${encodeURIComponent(t.id)}`}
                  variant="secondary"
                  size="sm"
                >
                  ادامه ویرایش پیش‌نویس
                </ButtonLink>
              ) : (
                <ButtonLink to={`/tours/${t.id}`} variant="outline" size="sm">
                  مدیریت
                </ButtonLink>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const PROFILE_LIMITS = {
  name: 40,
  lastName: 60,
  city: 40,
  bio: 300,
  budget: 60,
  styles: 6,
  languages: 8,
  interests: 12,
} as const;

type ProfileFormState = {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  bio: string;
  budgetRange: string;
  travelStyles: string[];
  languages: string[];
  interests: string[];
  favoritesPublic: boolean;
};

function formFromUser(user: User): ProfileFormState {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    city: user.city ?? "",
    bio: user.bio ?? "",
    budgetRange: user.budgetRange ?? "",
    travelStyles: [...user.travelStyles],
    languages: [...user.languages],
    interests: [...user.interests],
    favoritesPublic: user.favoritesPublic,
  };
}

function validateProfile(f: ProfileFormState): Record<string, string> {
  const e: Record<string, string> = {};
  if (f.firstName.trim().length < 2) e.firstName = "نام باید حداقل ۲ حرف باشد.";
  if (f.lastName.trim().length < 2)
    e.lastName = "نام خانوادگی باید حداقل ۲ حرف باشد.";
  if (f.email.trim() && !EMAIL_PATTERN.test(f.email.trim().toLowerCase()))
    e.email = "ایمیل معتبر نیست (مثل name@example.com).";
  if (f.city.trim().length > PROFILE_LIMITS.city)
    e.city = `حداکثر ${toFaDigits(PROFILE_LIMITS.city)} حرف.`;
  if (f.bio.trim().length > PROFILE_LIMITS.bio)
    e.bio = `حداکثر ${toFaDigits(PROFILE_LIMITS.bio)} حرف.`;
  if (f.budgetRange.trim().length > PROFILE_LIMITS.budget)
    e.budgetRange = `حداکثر ${toFaDigits(PROFILE_LIMITS.budget)} حرف.`;
  return e;
}

/** Edit profile: every field is validated, saved with PATCH /users/me and reloaded from the response. */
function ProfileForm({ user }: { user: User }) {
  const update = useUpdateProfile();
  const toast = useToast();
  const [saved, setSaved] = useState<ProfileFormState>(() =>
    formFromUser(user),
  );
  const [form, setForm] = useState<ProfileFormState>(saved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof ProfileFormState>(
    k: K,
    v: ProfileFormState[K],
  ) => {
    const next = { ...form, [k]: v };
    setForm(next);
    if (update.isSuccess || update.isError) update.reset();
    if (attempted) setErrors(validateProfile(next));
  };
  const text =
    (k: "firstName" | "lastName" | "email" | "city" | "bio" | "budgetRange") =>
    (e: { target: { value: string } }) =>
      set(k, e.target.value);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    const local = validateProfile(form);
    setErrors(local);
    if (Object.keys(local).length) {
      toast.error("چند مورد نیاز به اصلاح دارد.");
      return;
    }
    update.mutate(
      {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase() || null,
        city: form.city.trim() || null,
        bio: form.bio.trim() || null,
        travelStyles: form.travelStyles,
        languages: form.languages,
        interests: form.interests,
        budgetRange: form.budgetRange.trim() || null,
        favoritesPublic: form.favoritesPublic,
      },
      {
        onSuccess: (u) => {
          const fresh = formFromUser(u);
          setSaved(fresh);
          setForm(fresh);
          setAttempted(false);
          toast.success("تغییرات پروفایل ذخیره شد.");
        },
        onError: (err) => {
          if (err instanceof ApiError) setErrors(err.fieldErrors);
          toast.error(errorMessage(err));
        },
      },
    );
  };

  return (
    <Card title="ویرایش پروفایل">
      <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="نام"
          required
          value={form.firstName}
          onChange={text("firstName")}
          error={errors.firstName}
          maxLength={PROFILE_LIMITS.name}
          autoComplete="given-name"
        />
        <TextField
          label="نام خانوادگی"
          required
          value={form.lastName}
          onChange={text("lastName")}
          error={errors.lastName}
          maxLength={PROFILE_LIMITS.lastName}
          autoComplete="family-name"
        />
        <TextField
          label="شماره موبایل"
          value={user.phone ? formatMobile(user.phone) : "ثبت نشده"}
          disabled
          dir="ltr"
          hint={
            user.phone
              ? "شماره موبایل شناسه ورود شماست و از اینجا تغییر نمی‌کند."
              : "با ایمیل ثبت‌نام کرده‌اید."
          }
          className="text-left"
        />
        <TextField
          label="ایمیل"
          type="email"
          value={form.email}
          onChange={text("email")}
          error={errors.email}
          dir="ltr"
          className="text-left"
          autoComplete="email"
          maxLength={120}
        />
        <TextField
          label="شهر"
          value={form.city}
          onChange={text("city")}
          error={errors.city}
          maxLength={PROFILE_LIMITS.city}
        />
        <TextField
          label="محدوده بودجه سفر"
          value={form.budgetRange}
          onChange={text("budgetRange")}
          error={errors.budgetRange}
          maxLength={PROFILE_LIMITS.budget}
          placeholder="مثلاً ۳ تا ۷ میلیون تومان"
          hint="در پروفایل عمومی نمایش داده می‌شود."
        />
        <div className="sm:col-span-2">
          <TextArea
            label="درباره من"
            value={form.bio}
            onChange={text("bio")}
            error={errors.bio}
            maxLength={PROFILE_LIMITS.bio}
            hint={`${toFaDigits(form.bio.length)} از ${toFaDigits(PROFILE_LIMITS.bio)} حرف`}
          />
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="mb-3 text-sm font-bold">
            سبک سفر مورد علاقه
            <span className="ms-2 text-xs font-normal text-ink-soft">
              {toFaDigits(form.travelStyles.length)} از{" "}
              {toFaDigits(PROFILE_LIMITS.styles)}
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((c) => {
              const on = form.travelStyles.includes(c);
              return (
                <Chip
                  key={c}
                  selected={on}
                  disabled={
                    !on && form.travelStyles.length >= PROFILE_LIMITS.styles
                  }
                  onClick={() =>
                    set(
                      "travelStyles",
                      on
                        ? form.travelStyles.filter((x) => x !== c)
                        : [...form.travelStyles, c],
                    )
                  }
                >
                  {CATEGORY_LABELS[c]}
                </Chip>
              );
            })}
          </div>
        </fieldset>
        <TagInput
          label="زبان‌ها"
          value={form.languages}
          onChange={(v) => set("languages", v)}
          maxItems={PROFILE_LIMITS.languages}
          maxLength={30}
          placeholder="مثلاً انگلیسی"
          suggestions={["فارسی", "انگلیسی", "عربی", "ترکی", "کردی"]}
          error={errors.languages}
        />
        <TagInput
          label="علایق"
          value={form.interests}
          onChange={(v) => set("interests", v)}
          maxItems={PROFILE_LIMITS.interests}
          maxLength={40}
          placeholder="مثلاً عکاسی"
          suggestions={[
            "عکاسی",
            "کوهنوردی",
            "غذاهای محلی",
            "ستاره‌نگری",
            "تاریخ",
          ]}
          error={errors.interests}
        />
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.favoritesPublic}
            onChange={(e) => set("favoritesPublic", e.target.checked)}
            className="mt-1 size-4 accent-coral-500"
          />
          <span>
            <span className="block text-sm font-bold">
              نمایش عمومی علاقه‌مندی‌ها
            </span>
            <span className="mt-1 block text-xs leading-6 text-ink-muted">
              دیگران فهرست علاقه‌مندی‌های شما را در پروفایل عمومی می‌بینند و
              همسفرهای هم‌سلیقه پیشنهاد می‌شوند.
            </span>
          </span>
        </label>
        <div className="space-y-3 sm:col-span-2">
          <RequestFeedback
            status={
              update.isPending
                ? "loading"
                : update.isError
                  ? "error"
                  : update.isSuccess && !dirty
                    ? "success"
                    : "idle"
            }
            loadingText="در حال ذخیره تغییرات..."
            successText="تغییرات ذخیره شد و در پروفایل عمومی شما نمایش داده می‌شود."
            error={update.error}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              loading={update.isPending}
              disabled={!dirty || update.isPending}
            >
              ذخیره تغییرات
            </Button>
            {dirty && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setForm(saved);
                  setErrors({});
                  setAttempted(false);
                }}
              >
                بازگردانی
              </Button>
            )}
            <span className="text-xs text-ink-soft" aria-live="polite">
              {dirty
                ? "تغییرات ذخیره‌نشده دارید."
                : "همه تغییرات ذخیره شده است."}
            </span>
          </div>
        </div>
      </form>
    </Card>
  );
}

function Security({ userId }: { userId: string }) {
  const { data, isPending, isError, refetch } = useSessions(userId);
  const revoke = useRevokeSession(userId);
  const logout = useLogout();
  const toast = useToast();
  const navigate = useNavigate();
  return (
    <Card
      title="نشست‌های فعال"
      action={
        <Button
          size="sm"
          variant="ghost"
          className="text-danger"
          icon={<LogOut className="size-4" />}
          loading={logout.isPending}
          onClick={() =>
            logout.mutate(undefined, { onSettled: () => navigate("/") })
          }
        >
          خروج از این دستگاه
        </Button>
      }
    >
      <p className="-mt-2 mb-5 text-sm text-ink-muted">
        دستگاه‌هایی که با حساب شما وارد شده‌اند. اگر دستگاهی را نمی‌شناسید، نشست
        آن را ببندید.
      </p>
      {isPending && <Skeleton className="h-20" />}
      {isError && (
        <ErrorState
          text="دریافت نشست‌ها ممکن نشد."
          onRetry={() => void refetch()}
        />
      )}
      <ul className="space-y-3">
        {data?.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-4 rounded-2xl border border-line p-4"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-surface-muted text-forest-700 dark:text-forest-200">
              <MonitorSmartphone className="size-5" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="ltr-island text-sm font-bold">{s.device}</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {s.location ?? "مکان نامشخص"} · آخرین فعالیت{" "}
                {formatDateTime(s.lastActiveAt)}
              </p>
            </div>
            {s.current ? (
              <Badge tone="brand">همین دستگاه</Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                loading={revoke.isPending && revoke.variables === s.id}
                onClick={() =>
                  revoke.mutate(s.id, {
                    onSuccess: () => toast.success("نشست بسته شد."),
                    onError: (err) => toast.error(errorMessage(err)),
                  })
                }
              >
                بستن نشست
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
