import { useState } from "react";
import { Ban, Flag, Search, UserCheck } from "lucide-react";
import { Link } from "react-router";
import { errorMessage } from "@/shared/api/errors";
import { toFaDigits } from "@/shared/lib/digits";
import { formatDate, formatDateTime } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { SelectField, TextArea } from "@/shared/ui/Field";
import { Modal } from "@/shared/ui/Modal";
import { EmptyState, ErrorState, Skeleton } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import type { AdminReport } from "../api/admin-schemas";
import {
  useAdminReports,
  useAdminUsers,
  useDecideReport,
  useSetUserBlocked,
} from "../hooks";

/** FS 8: user list with search, block / unblock. */
export function UsersSection() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const { data, isPending, isError, refetch } = useAdminUsers(query);
  const setBlocked = useSetUserBlocked();
  const toast = useToast();
  return (
    <section
      className="rounded-panel border border-line bg-surface p-6 shadow-card"
      aria-labelledby="users-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="users-title" className="text-lg font-black">
          کاربران
        </h2>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(q.trim());
          }}
          className="relative w-full sm:w-72"
        >
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="نام، شماره یا شهر..."
            aria-label="جست‌وجوی کاربران"
            className="h-10 w-full rounded-xl border border-line bg-surface ps-9 pe-3 text-sm outline-none focus:border-forest-400"
          />
        </form>
      </div>
      <div className="mt-5 overflow-x-auto">
        {isPending && <Skeleton className="h-40" />}
        {isError && (
          <ErrorState
            text="دریافت کاربران ممکن نشد."
            onRetry={() => void refetch()}
          />
        )}
        {data && data.length === 0 && (
          <EmptyState
            title="کاربری یافت نشد"
            text="هیچ کاربری با این مشخصات ثبت نشده است."
          />
        )}
        {data && data.length > 0 && (
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="text-xs text-ink-soft">
                <th className="pb-2 text-start font-bold">کاربر</th>
                <th className="pb-2 text-start font-bold">موبایل</th>
                <th className="pb-2 text-start font-bold">عضویت</th>
                <th className="pb-2 text-start font-bold">تور ساخته</th>
                <th className="pb-2 text-start font-bold">گزارش علیه</th>
                <th className="pb-2 text-start font-bold">وضعیت</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((u) => (
                <tr key={u.id}>
                  <td className="py-3">
                    <Link
                      to={`/users/${u.id}`}
                      className="flex items-center gap-2 font-bold hover:text-coral-500"
                    >
                      <Avatar name={u.displayName} size="sm" />
                      {u.displayName}
                      {u.role === "admin" && <Badge tone="coral">مدیر</Badge>}
                    </Link>
                  </td>
                  <td className="ltr-island py-3 text-end text-xs">
                    {u.phone}
                  </td>
                  <td className="py-3 text-xs text-ink-muted">
                    {formatDate(u.createdAt.slice(0, 10))}
                  </td>
                  <td className="py-3">{toFaDigits(u.toursLed)}</td>
                  <td className="py-3">
                    {u.reportsAgainst ? (
                      <Badge tone="danger">
                        {toFaDigits(u.reportsAgainst)}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3">
                    {u.blocked ? (
                      <Badge tone="danger">مسدود</Badge>
                    ) : (
                      <Badge tone="brand">فعال</Badge>
                    )}
                  </td>
                  <td className="py-3 text-end">
                    {u.role !== "admin" && (
                      <Button
                        size="sm"
                        variant={u.blocked ? "outline" : "ghost"}
                        className={u.blocked ? undefined : "text-danger"}
                        icon={
                          u.blocked ? (
                            <UserCheck className="size-4" />
                          ) : (
                            <Ban className="size-4" />
                          )
                        }
                        loading={
                          setBlocked.isPending &&
                          setBlocked.variables?.userId === u.id
                        }
                        onClick={() =>
                          setBlocked.mutate(
                            { userId: u.id, blocked: !u.blocked },
                            {
                              onSuccess: () =>
                                toast.success(
                                  u.blocked
                                    ? "کاربر آزاد شد."
                                    : "کاربر مسدود شد.",
                                ),
                              onError: (e) => toast.error(errorMessage(e)),
                            },
                          )
                        }
                      >
                        {u.blocked ? "آزادسازی" : "مسدودسازی"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

const TARGET_LABEL = { user: "کاربر", tour: "تور", comment: "نظر" } as const;
const STATUS = {
  open: { label: "باز", tone: "amber" },
  resolved: { label: "رسیدگی‌شده", tone: "brand" },
  dismissed: { label: "ردشده", tone: "neutral" },
} as const;

/** FS 8: report queue with decision + decision history. */
export function ReportsSection() {
  const [status, setStatus] = useState<"open" | "all">("open");
  const { data, isPending, isError, refetch } = useAdminReports(status);
  const [deciding, setDeciding] = useState<AdminReport | null>(null);
  return (
    <section
      className="rounded-panel border border-line bg-surface p-6 shadow-card"
      aria-labelledby="reports-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="reports-title" className="text-lg font-black">
          گزارش‌های تخلف
        </h2>
        <div className="flex gap-2">
          <Chip selected={status === "open"} onClick={() => setStatus("open")}>
            صف بررسی
          </Chip>
          <Chip selected={status === "all"} onClick={() => setStatus("all")}>
            تاریخچه تصمیم‌ها
          </Chip>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {isPending && <Skeleton className="h-28" />}
        {isError && (
          <ErrorState
            text="دریافت گزارش‌ها ممکن نشد."
            onRetry={() => void refetch()}
          />
        )}
        {data?.length === 0 && (
          <EmptyState
            icon={<Flag className="size-7" />}
            title="گزارشی برای بررسی نیست"
          />
        )}
        {data?.map((r) => (
          <article key={r.id} className="rounded-2xl border border-line p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{TARGET_LABEL[r.targetType]}</Badge>
              <span className="text-sm font-black">
                {r.targetType === "tour" ? (
                  <Link
                    to={`/tours/${r.targetId}`}
                    className="hover:text-coral-500"
                  >
                    {r.targetLabel}
                  </Link>
                ) : r.targetType === "user" ? (
                  <Link
                    to={`/users/${r.targetId}`}
                    className="hover:text-coral-500"
                  >
                    {r.targetLabel}
                  </Link>
                ) : (
                  `«${r.targetLabel}»`
                )}
              </span>
              <Badge tone={STATUS[r.status].tone} className="ms-auto">
                {STATUS[r.status].label}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-7 text-ink-muted">{r.reason}</p>
            <p className="mt-1 text-[11px] text-ink-soft">
              گزارش‌دهنده: {r.reporterName} · {formatDateTime(r.createdAt)}
            </p>
            {r.status === "open" ? (
              <Button size="sm" className="mt-3" onClick={() => setDeciding(r)}>
                بررسی و تصمیم
              </Button>
            ) : (
              <p className="mt-3 rounded-xl bg-surface-muted p-3 text-xs leading-6">
                تصمیم {r.decidedByName ?? "مدیر"} (
                {r.decidedAt ? formatDateTime(r.decidedAt) : ""}):{" "}
                {r.decisionNote}
              </p>
            )}
          </article>
        ))}
      </div>
      {deciding && (
        <DecisionModal report={deciding} onClose={() => setDeciding(null)} />
      )}
    </section>
  );
}

function DecisionModal({
  report,
  onClose,
}: {
  report: AdminReport;
  onClose: () => void;
}) {
  const decide = useDecideReport();
  const toast = useToast();
  const [note, setNote] = useState("");
  const [action, setAction] = useState<"none" | "block_user" | "remove_tour">(
    "none",
  );
  const [error, setError] = useState<string | null>(null);
  const actions = [
    { value: "none", label: "بدون اقدام اجرایی" },
    ...(report.targetType === "user"
      ? [{ value: "block_user", label: "مسدودسازی کاربر" }]
      : []),
    ...(report.targetType === "tour"
      ? [{ value: "remove_tour", label: "حذف (لغو) تور" }]
      : []),
    ...(report.targetType === "comment"
      ? [{ value: "remove_tour", label: "حذف نظر" }]
      : []),
  ];
  const run = (decision: "resolve" | "dismiss") => {
    if (note.trim().length < 3) return setError("توضیح تصمیم را بنویسید.");
    decide.mutate(
      {
        reportId: report.id,
        body: {
          decision,
          note: note.trim(),
          action: decision === "dismiss" ? "none" : action,
        },
      },
      {
        onSuccess: () => {
          toast.success("تصمیم ثبت شد.");
          onClose();
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="تصمیم درباره گزارش"
      description={report.reason}
      dismissible={!decide.isPending}
    >
      <SelectField
        label="اقدام"
        value={action}
        onChange={(e) => setAction(e.target.value as typeof action)}
        options={actions}
      />
      <div className="mt-4">
        <TextArea
          label="توضیح تصمیم (در تاریخچه ثبت می‌شود)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          error={error ?? undefined}
        />
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          onClick={() => run("dismiss")}
          disabled={decide.isPending}
        >
          رد گزارش
        </Button>
        <Button onClick={() => run("resolve")} loading={decide.isPending}>
          رسیدگی و ثبت
        </Button>
      </div>
    </Modal>
  );
}
