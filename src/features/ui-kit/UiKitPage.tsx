import { useState, type ReactNode } from "react";
import { Heart, Plus, Search } from "lucide-react";
import { LinkStatusCard } from "@/features/invites/ui/LinkStatusCard";
import { INVITE_STATUS_META } from "@/features/invites/model/invite-status";
import type { TourSummary } from "@/features/tours/api/tour-schemas";
import { JOIN_STATUS_META, STATUS_META } from "@/features/tours/model/labels";
import { DayTabs } from "@/features/tours/ui/DayTabs";
import { TourCard, TourCardSkeleton } from "@/features/tours/ui/TourCard";
import {
  TravelerSummary,
  TravelerSummarySkeleton,
} from "@/features/users/ui/TravelerSummary";
import { ApiError, networkError } from "@/shared/api/errors";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { addDays, todayIso } from "@/shared/lib/dates";
import { Badge } from "@/shared/ui/Badge";
import {
  Button,
  type ButtonSize,
  type ButtonVariant,
} from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { Container } from "@/shared/ui/Container";
import { SelectField, TextArea, TextField } from "@/shared/ui/Field";
import { ImagePicker } from "@/shared/ui/ImagePicker";
import { PageHeader } from "@/shared/ui/PageHeader";
import { RequestFeedback } from "@/shared/ui/RequestFeedback";
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  Skeleton,
} from "@/shared/ui/StateViews";
import { Tabs } from "@/shared/ui/Tabs";
import { useToast } from "@/shared/ui/Toast";

/* Sample data only for this showcase page — never shown as real content elsewhere. */
const today = todayIso();
const sampleTour: TourSummary = {
  id: "hyrcanian-forest",
  title: "جنگل‌های هیرکانی",
  destination: "سوادکوه",
  province: "مازندران",
  coverImageUrl: "/images/tours/tour-hyrcanian-forest.webp",
  startDate: addDays(today, 12),
  endDate: addDays(today, 15),
  durationDays: 4,
  priceToman: 3_600_000,
  capacity: 14,
  minParticipants: 6,
  confirmedCount: 6,
  difficulty: "easy",
  categories: ["nature"],
  badge: "popular",
  rating: 4.7,
  reviewCount: 54,
  status: "confirmed",
  createdAt: today,
};

const SECTIONS = [
  { id: "buttons", label: "دکمه‌ها" },
  { id: "fields", label: "فیلدهای فرم" },
  { id: "chips", label: "چیپ و برچسب وضعیت" },
  { id: "cards", label: "کارت تور" },
  { id: "states", label: "حالت‌های خالی و خطا" },
  { id: "requests", label: "وضعیت درخواست API" },
  { id: "links", label: "وضعیت لینک" },
  { id: "upload", label: "آپلود فایل" },
  { id: "nav", label: "تب‌ها" },
  { id: "profile", label: "پروفایل" },
] as const;

function Block({
  id,
  title,
  description,
  source,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  source?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 rounded-panel border border-line bg-surface p-5 shadow-card sm:p-7"
    >
      <h2 id={`${id}-title`} className="text-lg font-black">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-xs leading-6 text-ink-muted">{description}</p>
      )}
      {source && (
        <p className="mt-2 text-[11px] text-ink-soft">
          کد:{" "}
          <code
            dir="ltr"
            className="ltr-island rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] text-ink"
          >
            {source}
          </code>
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Variant({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className={className}>
      <figcaption className="mb-2 text-[11px] font-bold text-ink-soft">
        {label}
      </figcaption>
      {children}
    </figure>
  );
}

const VARIANTS: { id: ButtonVariant; label: string }[] = [
  { id: "primary", label: "اصلی" },
  { id: "secondary", label: "ثانویه" },
  { id: "outline", label: "خطی" },
  { id: "ghost", label: "بی‌زمینه" },
  { id: "danger", label: "خطرناک" },
];
const SIZES: { id: ButtonSize; label: string }[] = [
  { id: "sm", label: "کوچک" },
  { id: "md", label: "متوسط" },
  { id: "lg", label: "بزرگ" },
];

/**
 * `/ui-kit` — living reference of the shared components with all their variants and states
 * (default, hover/focus, disabled, loading, error, empty, success). Built from the real components.
 */
export function UiKitPage() {
  useDocumentTitle("کتابخانه کامپوننت‌ها");
  const toast = useToast();
  const [tab, setTab] = useState<"a" | "b" | "c">("a");
  const [day, setDay] = useState("2");
  const [chips, setChips] = useState<string[]>(["nature"]);

  return (
    <div className="pb-12">
      <PageHeader
        title="کتابخانه کامپوننت‌ها"
        subtitle="همه حالت‌ها و واریانت‌های کامپوننت‌های مشترک همسفر در یک صفحه؛ برای بازبینی طراحی و تطبیق با فیگما."
        crumbs={[{ label: "خانه", to: "/" }, { label: "کتابخانه کامپوننت‌ها" }]}
      />
      <Container className="relative z-[1] -mt-12">
        <div className="grid gap-6 lg:grid-cols-12">
          <nav aria-label="بخش‌ها" className="min-w-0 lg:col-span-3">
            <ul className="no-scrollbar flex gap-1 overflow-x-auto rounded-panel border border-line bg-surface p-2 shadow-card lg:sticky lg:top-24 lg:flex-col">
              {SECTIONS.map((s) => (
                <li key={s.id} className="shrink-0">
                  <a
                    href={`#${s.id}`}
                    className="block rounded-xl px-4 py-2.5 text-sm font-bold text-ink-muted hover:bg-surface-muted hover:text-ink"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-6 lg:col-span-9">
            <Block
              id="buttons"
              source="<Button variant size loading disabled icon /> · src/shared/ui/Button.tsx"
              title="دکمه‌ها"
              description="۵ واریانت × ۳ اندازه، با حالت‌های عادی، غیرفعال و در حال بارگذاری. حالت hover و focus را با ماوس و Tab ببینید."
            >
              <div className="space-y-5">
                {VARIANTS.map((v) => (
                  <div key={v.id} className="flex flex-wrap items-center gap-3">
                    <span className="w-28 text-xs font-bold text-ink-soft">
                      {v.label}
                      <code
                        dir="ltr"
                        className="mt-0.5 block font-mono text-[10px] font-normal"
                      >
                        variant=&quot;{v.id}&quot;
                      </code>
                    </span>
                    <Button variant={v.id}>عادی</Button>
                    <Button variant={v.id} icon={<Plus className="size-4" />}>
                      با آیکون
                    </Button>
                    <Button variant={v.id} disabled>
                      غیرفعال
                    </Button>
                    <Button variant={v.id} loading>
                      در حال ارسال
                    </Button>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
                  <span className="w-16 text-xs font-bold text-ink-soft">
                    اندازه
                  </span>
                  {SIZES.map((s) => (
                    <Button key={s.id} size={s.id}>
                      {s.label} ({s.id})
                    </Button>
                  ))}
                </div>
              </div>
            </Block>

            <Block
              id="fields"
              source="<TextField|SelectField|TextArea label hint error required /> · src/shared/ui/Field.tsx · <TagInput /> · src/shared/ui/TagInput.tsx"
              title="فیلدهای فرم"
              description="عادی، با راهنما، خطا، غیرفعال و الزامی."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField label="عادی" placeholder="متن را وارد کنید" />
                <TextField
                  label="با راهنما"
                  hint="حداقل ۵ حرف"
                  placeholder="نام تور"
                />
                <TextField
                  label="خطا"
                  required
                  defaultValue="۱۲۳"
                  error="نام تور باید شامل حروف باشد."
                />
                <TextField
                  label="غیرفعال"
                  disabled
                  defaultValue="قابل ویرایش نیست"
                />
                <TextField
                  label="با آیکون"
                  icon={<Search className="size-4" />}
                  placeholder="جست‌وجو..."
                />
                <SelectField
                  label="انتخابی"
                  placeholder="انتخاب کنید"
                  options={[
                    { value: "a", label: "آسان" },
                    { value: "b", label: "سخت" },
                  ]}
                  defaultValue=""
                />
                <TextArea
                  label="متن بلند"
                  hint="۰ از ۲۰۰۰ حرف"
                  className="sm:col-span-2"
                />
              </div>
            </Block>

            <Block
              id="chips"
              source="<Chip selected /> · <Badge tone /> · src/shared/ui · STATUS_META · features/tours/model/labels.ts"
              title="چیپ و برچسب وضعیت"
              description="چیپ انتخاب‌شده/نشده/غیرفعال و رنگ‌بندی ثابت وضعیت‌ها در کل سامانه."
            >
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {["nature", "beach", "historic"].map((c) => (
                    <Chip
                      key={c}
                      selected={chips.includes(c)}
                      onClick={() =>
                        setChips((l) =>
                          l.includes(c) ? l.filter((x) => x !== c) : [...l, c],
                        )
                      }
                    >
                      {c === "nature"
                        ? "طبیعت‌گردی"
                        : c === "beach"
                          ? "ساحلی"
                          : "تاریخی"}
                    </Chip>
                  ))}
                  <Chip disabled className="opacity-50">
                    غیرفعال
                  </Chip>
                </div>
                <Variant label="وضعیت تور">
                  <div className="flex flex-wrap gap-2">
                    {Object.values(STATUS_META).map((m) => (
                      <Badge key={m.label} tone={m.tone}>
                        {m.label}
                      </Badge>
                    ))}
                  </div>
                </Variant>
                <Variant label="وضعیت درخواست عضویت">
                  <div className="flex flex-wrap gap-2">
                    {Object.values(JOIN_STATUS_META).map((m) => (
                      <Badge key={m.label} tone={m.tone}>
                        {m.label}
                      </Badge>
                    ))}
                  </div>
                </Variant>
                <Variant label="وضعیت لینک دعوت">
                  <div className="flex flex-wrap gap-2">
                    {Object.values(INVITE_STATUS_META).map((m) => (
                      <Badge key={m.label} tone={m.tone}>
                        {m.label}
                      </Badge>
                    ))}
                  </div>
                </Variant>
              </div>
            </Block>

            <Block
              id="cards"
              source="<TourCard tour action footnote showStatus /> · <TourCardSkeleton /> · features/tours/ui/TourCard.tsx"
              title="کارت تور"
              description="در حال تکمیل ظرفیت، ظرفیت تکمیل، لغوشده و حالت بارگذاری."
            >
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Variant label="عادی">
                  <TourCard
                    tour={{ ...sampleTour, status: "open" }}
                    action={
                      <span className="inline-flex size-9 items-center justify-center rounded-full bg-black/35 text-white">
                        <Heart className="size-4" />
                      </span>
                    }
                  />
                </Variant>
                <Variant label="ظرفیت تکمیل">
                  <TourCard
                    tour={{ ...sampleTour, confirmedCount: 14, badge: null }}
                  />
                </Variant>
                <Variant label="لغوشده">
                  <TourCard
                    tour={{
                      ...sampleTour,
                      status: "cancelled",
                      badge: null,
                      confirmedCount: 3,
                    }}
                  />
                </Variant>
                <Variant label="در حال بارگذاری">
                  <TourCardSkeleton />
                </Variant>
              </div>
            </Block>

            <Block
              id="states"
              source="<EmptyState /> <ErrorState error onRetry /> <ForbiddenState /> <Skeleton /> · <QueryState query /> · src/shared/ui"
              title="حالت‌های خالی و خطا"
              description="هر فهرست و صفحه یکی از این حالت‌ها را به‌جای صفحه سفید نشان می‌دهد."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <EmptyState
                  title="توری با این مشخصات پیدا نشد"
                  text="فیلترها را کمتر کنید."
                  action={
                    <Button size="sm" variant="outline">
                      حذف فیلترها
                    </Button>
                  }
                />
                <ErrorState
                  error={networkError()}
                  onRetry={() => toast.info("تلاش دوباره")}
                />
                <ErrorState
                  error={
                    new ApiError(
                      500,
                      "SERVER_ERROR",
                      "سرور موقتاً پاسخ نمی‌دهد.",
                    )
                  }
                  onRetry={() => toast.info("تلاش دوباره")}
                />
                <ForbiddenState />
                <div
                  className="space-y-3 rounded-panel border border-dashed border-line p-5"
                  role="status"
                  aria-label="نمونه بارگذاری"
                >
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-24" />
                </div>
              </div>
            </Block>

            <Block
              id="requests"
              source='<RequestFeedback status="idle|loading|success|error" /> · useToast() · src/shared/ui'
              title="وضعیت درخواست API"
              description="بازخورد درون‌خطی برای ثبت/ارسال، به‌علاوه اعلان (Toast). برای دیدن روی صفحات واقعی، از منوی «نسخه نمایشی» پایین صفحه شبکه کند یا خطای سرور را انتخاب کنید."
            >
              <div className="space-y-3">
                <RequestFeedback
                  status="loading"
                  loadingText="در حال ارسال درخواست..."
                />
                <RequestFeedback
                  status="success"
                  successText="درخواست شما با موفقیت ثبت شد."
                />
                <RequestFeedback
                  status="error"
                  error={
                    new ApiError(
                      409,
                      "CAPACITY_FULL",
                      "ظرفیت این تور تکمیل شده است.",
                    )
                  }
                />
                <RequestFeedback
                  status="error"
                  error={networkError()}
                  onRetry={() => toast.info("تلاش دوباره")}
                />
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success("تغییرات ذخیره شد.")}
                  >
                    اعلان موفقیت
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.error("ارسال ممکن نشد.")}
                  >
                    اعلان خطا
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info("پیوند کپی شد.")}
                  >
                    اعلان اطلاع
                  </Button>
                </div>
              </div>
            </Block>

            <Block
              id="links"
              source='<LinkStatusCard state="valid|expired|used|revoked|invalid" /> · features/invites/ui'
              title="وضعیت لینک دعوت"
              description="نمونه زنده: /invite/demo-valid · demo-expired · demo-used · demo-revoked"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <LinkStatusCard
                  state="valid"
                  title="دعوت به سفر"
                  text="این لینک تا ۲۴ آبان معتبر است و فقط یک بار قابل استفاده است."
                />
                <LinkStatusCard
                  state="expired"
                  title="لینک منقضی شده است"
                  text="اعتبار این لینک به پایان رسیده؛ لینک تازه بخواهید."
                />
                <LinkStatusCard
                  state="used"
                  title="لینک قبلاً استفاده شده"
                  text="هر لینک فقط یک بار قابل استفاده است."
                />
                <LinkStatusCard
                  state="revoked"
                  title="لینک غیرفعال شده است"
                  text="تورلیدر این لینک را غیرفعال کرده است."
                />
                <LinkStatusCard
                  state="invalid"
                  title="لینک نامعتبر است"
                  text="لینک ناقص است یا وجود ندارد."
                  className="md:col-span-2"
                />
              </div>
            </Block>

            <Block
              id="upload"
              source="<ImagePicker multiple maxFiles rules compact /> · src/shared/ui/ImagePicker.tsx"
              title="آپلود فایل"
              description="فرمت، حجم، ابعاد و تعداد بررسی می‌شود؛ فایل‌های رد شده با دلیل نمایش داده می‌شوند. یک فایل غیرتصویری یا عکس بسیار کوچک انتخاب کنید."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Variant label="عادی (چندتایی)">
                  <ImagePicker
                    multiple
                    maxFiles={3}
                    onPick={(imgs) =>
                      toast.success(`${imgs.length} تصویر معتبر انتخاب شد.`)
                    }
                  />
                </Variant>
                <Variant label="غیرفعال (سقف پر شده)">
                  <ImagePicker
                    disabled
                    onPick={() => undefined}
                    hint="به سقف ۲۰ عکس رسیده‌اید."
                  />
                </Variant>
              </div>
            </Block>

            <Block
              id="nav"
              source="<Tabs /> · src/shared/ui/Tabs.tsx · <DayTabs showDateState /> · features/tours/ui/DayTabs.tsx"
              title="تب‌ها"
              description="تب صفحه و تب روزهای سفر (با تاریخ، وضعیت روز، تعداد فعالیت و خطا)."
            >
              <div className="space-y-5">
                <Tabs
                  label="نمونه تب"
                  value={tab}
                  onChange={setTab}
                  items={[
                    { id: "a", label: "نمای کلی" },
                    { id: "b", label: "برنامه روزانه" },
                    { id: "c", label: "گفت‌وگو", badge: 3 },
                  ]}
                />
                <DayTabs
                  idPrefix="kit"
                  label="نمونه روزها"
                  showDateState
                  activeKey={day}
                  onChange={setDay}
                  days={[
                    {
                      key: "1",
                      dayNumber: 1,
                      date: addDays(today, -1),
                      count: 3,
                    },
                    { key: "2", dayNumber: 2, date: today, count: 2 },
                    {
                      key: "3",
                      dayNumber: 3,
                      date: addDays(today, 1),
                      count: 0,
                    },
                    {
                      key: "4",
                      dayNumber: 4,
                      date: addDays(today, 2),
                      count: 1,
                      invalid: true,
                    },
                  ]}
                />
              </div>
            </Block>

            <Block
              id="profile"
              source="<TravelerSummary data showIdentity /> · features/users/ui/TravelerSummary.tsx"
              title="پروفایل سفر"
              description="پر، نیمه‌کامل و در حال بارگذاری."
            >
              <div className="grid gap-5 md:grid-cols-3">
                <Variant label="کامل">
                  <TravelerSummary
                    showIdentity
                    data={{
                      displayName: "پریسا هاشمی",
                      avatarUrl: null,
                      bio: "عاشق سفرهای گروهی و عکاسی.",
                      travelStyles: ["nature", "adventure"],
                      languages: ["فارسی", "انگلیسی"],
                      interests: ["عکاسی", "کوهنوردی"],
                      budgetRange: "۳ تا ۷ میلیون تومان",
                      rating: 4.9,
                      reviewCount: 12,
                      tripsCount: 8,
                    }}
                  />
                </Variant>
                <Variant label="نیمه‌کامل">
                  <TravelerSummary
                    showIdentity
                    data={{
                      displayName: "کاربر جدید",
                      avatarUrl: null,
                      bio: null,
                      travelStyles: [],
                      languages: ["فارسی"],
                      interests: [],
                      budgetRange: null,
                      rating: null,
                      tripsCount: 0,
                    }}
                  />
                </Variant>
                <Variant label="در حال بارگذاری">
                  <TravelerSummarySkeleton />
                </Variant>
              </div>
            </Block>
          </div>
        </div>
      </Container>
    </div>
  );
}
