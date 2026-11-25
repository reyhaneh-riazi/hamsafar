import { useState } from "react";
import { useSearchParams } from "react-router";
import { Tabs, type TabItem } from "@/shared/ui/Tabs";
import { ReportsSection, UsersSection } from "./AdminSections";
import {
  Check,
  ClipboardCheck,
  Compass,
  Flag,
  Inbox,
  LayoutDashboard,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router";
import { STATUS_META } from "@/features/tours/model/labels";
import { errorMessage } from "@/shared/api/errors";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";
import { formatDate, formatDateTime, formatToman } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { TextArea } from "@/shared/ui/Field";
import { Modal } from "@/shared/ui/Modal";
import { PageHeader } from "@/shared/ui/PageHeader";
import { EmptyState, ErrorState, Skeleton } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import type { AdminStats, AdminTour, FunnelStage } from "../api/admin-schemas";
import { useAdminStats, useAdminTours, useReviewTour } from "../hooks";

const FUNNEL_LABELS: Record<FunnelStage, string> = {
  created: "ساخته شده",
  submitted: "ارسال برای بررسی",
  approved: "تأیید و انتشار",
  first_request: "اولین درخواست",
  confirmed: "قطعی شده",
};

type AdminTab = "overview" | "users" | "reports";

export function AdminPage() {
  useDocumentTitle("پنل مدیریت");
  const stats = useAdminStats();
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const tab: AdminTab = raw === "users" || raw === "reports" ? raw : "overview";
  const [filter, setFilter] = useState<"pending_review" | "all">(
    "pending_review",
  );
  const tours = useAdminTours(filter);
  const tabs: TabItem<AdminTab>[] = [
    {
      id: "overview",
      label: "نمای کلی و بررسی تورها",
      icon: <LayoutDashboard className="size-4" aria-hidden="true" />,
    },
    {
      id: "users",
      label: "کاربران",
      icon: <Users className="size-4" aria-hidden="true" />,
    },
    {
      id: "reports",
      label: "گزارش‌ها",
      icon: <Flag className="size-4" aria-hidden="true" />,
      badge: stats.data?.openReports ?? undefined,
    },
  ];

  return (
    <div className="pb-12">
      <PageHeader
        title="پنل مدیریت"
        subtitle="بررسی تورهای ارسالی، مدیریت کاربران و گزارش‌ها، و قیف ساخت تور تا قطعی شدن."
        crumbs={[{ label: "خانه", to: "/" }, { label: "پنل مدیریت" }]}
      >
        <StatCards stats={stats.data} loading={stats.isPending} />
      </PageHeader>

      <div className="mx-auto mt-8 max-w-page space-y-6 px-4 sm:px-6 lg:px-8">
        <Tabs
          label="بخش‌های مدیریت"
          items={tabs}
          value={tab}
          onChange={(t) =>
            setParams(t === "overview" ? {} : { tab: t }, { replace: true })
          }
        />
        {tab === "users" && <UsersSection />}
        {tab === "reports" && <ReportsSection />}
        {tab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-12">
            <section
              className="rounded-panel border border-line bg-surface p-6 shadow-card lg:col-span-7"
              aria-labelledby="review-title"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="review-title" className="text-lg font-black">
                  بررسی تورها
                </h2>
                <div className="flex gap-2">
                  <Chip
                    selected={filter === "pending_review"}
                    onClick={() => setFilter("pending_review")}
                  >
                    در انتظار بررسی
                  </Chip>
                  <Chip
                    selected={filter === "all"}
                    onClick={() => setFilter("all")}
                  >
                    همه تورها
                  </Chip>
                </div>
              </div>
              <div className="mt-5">
                {tours.isPending && <Skeleton className="h-28" />}
                {tours.isError && (
                  <ErrorState
                    text="دریافت تورها ممکن نشد."
                    onRetry={() => void tours.refetch()}
                  />
                )}
                {tours.data?.length === 0 && (
                  <EmptyState
                    icon={<Inbox className="size-7" />}
                    title="صف بررسی خالی است"
                    text="تور جدیدی برای بررسی ارسال نشده."
                  />
                )}
                <ul className="space-y-3">
                  {tours.data?.map((t) => (
                    <ReviewRow key={t.id} tour={t} />
                  ))}
                </ul>
              </div>
            </section>

            <section
              className="rounded-panel border border-line bg-surface p-6 shadow-card lg:col-span-5"
              aria-labelledby="funnel-title"
            >
              <h2 id="funnel-title" className="text-lg font-black">
                قیف ساخت تور تا قطعی شدن
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                بر اساس داده‌های واقعی سامانه؛ درصد ریزش هر مرحله نسبت به مرحله
                قبل.
              </p>
              {stats.isPending ? (
                <Skeleton className="mt-5 h-56" />
              ) : stats.isError ? (
                <ErrorState
                  text="آمار در دسترس نیست."
                  onRetry={() => void stats.refetch()}
                />
              ) : (
                stats.data && <Funnel data={stats.data.funnel} />
              )}
              {stats.data?.quorumRate !== null &&
                stats.data?.quorumRate !== undefined && (
                  <p className="mt-5 rounded-2xl bg-surface-muted p-3 text-xs text-ink-muted">
                    نرخ رسیدن به حد نصاب در تورهای منتشرشده:{" "}
                    <span className="font-black text-ink">
                      {toFaDigits(stats.data.quorumRate)}٪
                    </span>
                  </p>
                )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCards({
  stats,
  loading,
}: {
  stats?: AdminStats;
  loading: boolean;
}) {
  const items = [
    { label: "کاربران", value: stats?.usersTotal, icon: Users },
    { label: "تورهای باز", value: stats?.toursOpen, icon: Compass },
    {
      label: "در انتظار بررسی",
      value: stats?.toursPendingReview,
      icon: ClipboardCheck,
    },
    {
      label: "درخواست‌های ۷ روز اخیر",
      value: stats?.joinRequestsLast7Days,
      icon: UserRound,
    },
    { label: "گزارش‌های باز", value: stats?.openReports, icon: Flag },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-panel border border-line bg-surface p-4 shadow-card sm:p-5"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-tint-mint text-forest-700 dark:text-forest-200">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            {loading ? (
              <Skeleton className="h-6 w-10" />
            ) : (
              <span className="block text-2xl font-black">
                {value === null || value === undefined
                  ? "—"
                  : toFaDigits(value)}
              </span>
            )}
            <span className="block truncate text-xs text-ink-muted">
              {label}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Accessible funnel: horizontal bars plus a data table for screen readers. */
function Funnel({ data }: { data: AdminStats["funnel"] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="mt-6">
      <ol className="space-y-3" aria-hidden="true">
        {data.map((d, i) => {
          const prev = i > 0 ? data[i - 1]?.count : undefined;
          const drop = prev
            ? Math.round(((prev - d.count) / prev) * 100)
            : null;
          return (
            <li key={d.stage}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-ink">
                  {FUNNEL_LABELS[d.stage]}
                </span>
                <span className="text-ink-muted">
                  {toFaDigits(d.count)}
                  {drop !== null && drop > 0 && (
                    <span className="ms-2 font-bold text-coral-500">
                      ریزش {toFaDigits(drop)}٪
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-1.5 h-7 overflow-hidden rounded-lg bg-surface-muted">
                <div
                  className={cn(
                    "h-full rounded-lg transition-all duration-700",
                    i === data.length - 1 ? "bg-coral-500" : "bg-forest-600",
                  )}
                  style={{
                    width: `${Math.max(4, (d.count / max) * 100)}%`,
                    opacity: 1 - i * 0.12,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <table className="sr-only">
        <caption>قیف ساخت تور</caption>
        <thead>
          <tr>
            <th>مرحله</th>
            <th>تعداد</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.stage}>
              <td>{FUNNEL_LABELS[d.stage]}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewRow({ tour }: { tour: AdminTour }) {
  const review = useReviewTour();
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const status = STATUS_META[tour.status];

  const decide = (decision: "approve" | "reject") =>
    review.mutate(
      {
        tourId: tour.id,
        body: { decision, reason: reason.trim() || undefined },
      },
      {
        onSuccess: () => {
          setRejecting(false);
          toast.success(
            decision === "approve" ? "تور تأیید و منتشر شد." : "تور رد شد.",
          );
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-line p-4 sm:flex-row sm:items-center">
      <img
        src={tour.coverImageUrl}
        alt=""
        className="h-20 w-full rounded-xl object-cover sm:w-28"
      />
      <div className="min-w-0 flex-1">
        <Link
          to={`/tours/${tour.id}`}
          className="font-black hover:text-coral-500"
        >
          {tour.title}
        </Link>
        <p className="mt-1 text-xs text-ink-muted">
          {tour.creatorName} · {tour.province} · {formatDate(tour.startDate)} ·{" "}
          {formatToman(tour.priceToman)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          {tour.submittedAt && (
            <span className="text-[11px] text-ink-soft">
              ارسال: {formatDateTime(tour.submittedAt)}
            </span>
          )}
        </div>
      </div>
      {tour.status === "pending_review" && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<Check className="size-4" />}
            loading={
              review.isPending && review.variables?.body.decision === "approve"
            }
            disabled={review.isPending}
            onClick={() => decide("approve")}
          >
            تأیید
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<X className="size-4" />}
            disabled={review.isPending}
            onClick={() => setRejecting(true)}
          >
            رد
          </Button>
        </div>
      )}
      <Modal
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="رد تور"
        description={tour.title}
        size="sm"
        dismissible={!review.isPending}
      >
        <TextArea
          label="دلیل رد (برای سازنده ارسال می‌شود)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          data-autofocus
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setRejecting(false)}
            disabled={review.isPending}
          >
            انصراف
          </Button>
          <Button
            variant="danger"
            loading={review.isPending}
            onClick={() => decide("reject")}
          >
            رد تور
          </Button>
        </div>
      </Modal>
    </li>
  );
}
