import { useState, type FormEvent } from "react";
import {
  BedDouble,
  Bus,
  CircleDollarSign,
  CreditCard,
  Lock,
  Package,
  Plus,
  Trash2,
  Utensils,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { ApiError, errorMessage } from "@/shared/api/errors";
import { cn } from "@/shared/lib/cn";
import { toFaDigits, toLatinDigits } from "@/shared/lib/digits";
import { formatDateTime, formatToman } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { SelectField, TextField } from "@/shared/ui/Field";
import { Modal } from "@/shared/ui/Modal";
import { ErrorState, Skeleton } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import type { ExpenseCategory } from "../api/trip-schemas";
import { useAddExpense, useDeleteExpense, useExpenses, usePay } from "../hooks";

export const EXPENSE_META: Record<
  ExpenseCategory,
  { label: string; icon: LucideIcon }
> = {
  accommodation: { label: "اقامت", icon: BedDouble },
  transport: { label: "حمل‌ونقل", icon: Bus },
  food: { label: "غذا", icon: Utensils },
  activity: { label: "بازدید و تفریح", icon: Ticket },
  other: { label: "متفرقه", icon: Package },
};

const PAY_STATUS = {
  paid: { label: "تسویه‌شده", tone: "brand" },
  pending: { label: "در انتظار پرداخت", tone: "amber" },
  refunded: { label: "بازگشت داده‌شده", tone: "info" },
} as const;

/**
 * Expenses & settlement (FS 6). Members see the split and pay their share through the internal
 * test gateway; only the tour leader can add or remove expenses (enforced by the API).
 */
export function ExpensesPanel({ tourId }: { tourId: string }) {
  const { data, isPending, isError, refetch } = useExpenses(tourId);
  const [adding, setAdding] = useState(false);
  const [paying, setPaying] = useState(false);
  const remove = useDeleteExpense(tourId);
  const toast = useToast();

  if (isPending) return <Skeleton className="h-64" />;
  if (isError || !data)
    return (
      <ErrorState
        text="دریافت هزینه‌ها ممکن نشد."
        onRetry={() => void refetch()}
      />
    );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="جمع هزینه‌ها" value={formatToman(data.totalToman)} />
        <Stat
          label="سهم هر نفر"
          value={formatToman(data.sharePerMemberToman)}
          hint={`بین ${toFaDigits(data.members.length)} نفر`}
        />
        <div className="flex flex-col justify-center gap-2 rounded-panel border border-line bg-surface p-5">
          <Button
            icon={<CreditCard className="size-4" />}
            onClick={() => setPaying(true)}
          >
            پرداخت سهم من
          </Button>
          <p className="text-center text-[11px] text-ink-soft">
            درگاه آزمایشی داخلی — پول واقعی جابه‌جا نمی‌شود.
          </p>
        </div>
      </div>

      <section
        className="rounded-panel border border-line bg-surface p-5 sm:p-6"
        aria-labelledby="exp-title"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="exp-title" className="text-base font-black">
            هزینه‌های ثبت‌شده
          </h2>
          {data.canEdit ? (
            <Button
              size="sm"
              icon={<Plus className="size-4" />}
              onClick={() => setAdding(true)}
            >
              ثبت هزینه
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-soft">
              <Lock className="size-3.5" aria-hidden="true" />
              فقط تورلیدر هزینه ثبت یا حذف می‌کند
            </span>
          )}
        </div>
        {data.items.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            هنوز هزینه‌ای ثبت نشده است.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {data.items.map((e) => {
              const meta = EXPENSE_META[e.category];
              const Icon = meta.icon;
              return (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tint-mint text-forest-700 dark:text-forest-200">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{e.title}</p>
                    <p className="text-[11px] text-ink-soft">
                      {meta.label} · پرداخت توسط {e.paidBy.displayName} ·{" "}
                      {formatDateTime(e.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-black">
                    {formatToman(e.amountToman)}
                  </span>
                  {data.canEdit && (
                    <button
                      type="button"
                      aria-label={`حذف ${e.title}`}
                      disabled={remove.isPending}
                      onClick={() =>
                        remove.mutate(e.id, {
                          onError: (err) => toast.error(errorMessage(err)),
                          onSuccess: () => toast.success("هزینه حذف شد."),
                        })
                      }
                      className="inline-flex size-9 items-center justify-center rounded-lg text-danger transition hover:bg-danger/10 disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        className="rounded-panel border border-line bg-surface p-5 sm:p-6"
        aria-labelledby="settle-title"
      >
        <h2 id="settle-title" className="text-base font-black">
          وضعیت تسویه اعضا
        </h2>
        {/* Phones: one card per member instead of a horizontally scrolling table. */}
        <ul className="mt-4 space-y-3 sm:hidden">
          {data.members.map((m) => (
            <li key={m.person.id} className="rounded-2xl bg-surface-muted p-3">
              <div className="flex items-center gap-2">
                <Avatar
                  name={m.person.displayName}
                  src={m.person.avatarUrl}
                  size="sm"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-bold">
                  {m.person.displayName}
                </span>
                {m.isLeader && (
                  <span className="rounded bg-forest-700 px-1 text-[9px] text-white">
                    تورلیدر
                  </span>
                )}
                <Badge tone={PAY_STATUS[m.paymentStatus].tone}>
                  {PAY_STATUS[m.paymentStatus].label}
                </Badge>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-ink-soft">سهم</dt>
                  <dd className="mt-0.5 font-bold">
                    {formatToman(m.shareToman)}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-soft">پرداختی</dt>
                  <dd className="mt-0.5 font-bold">
                    {formatToman(m.paidToman)}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-soft">
                    {m.balanceToman > 0
                      ? "بدهکار"
                      : m.balanceToman < 0
                        ? "طلبکار"
                        : "مانده"}
                  </dt>
                  <dd
                    className={cn(
                      "mt-0.5 font-bold",
                      m.balanceToman > 0
                        ? "text-danger"
                        : m.balanceToman < 0
                          ? "text-success"
                          : "text-ink-muted",
                    )}
                  >
                    {m.balanceToman === 0
                      ? "تسویه"
                      : formatToman(Math.abs(m.balanceToman))}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <div className="mt-4 hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="text-start text-xs text-ink-soft">
                <th className="pb-2 text-start font-bold">عضو</th>
                <th className="pb-2 text-start font-bold">سهم</th>
                <th className="pb-2 text-start font-bold">پرداختی</th>
                <th className="pb-2 text-start font-bold">بدهی / طلب</th>
                <th className="pb-2 text-start font-bold">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.members.map((m) => (
                <tr key={m.person.id}>
                  <td className="py-3">
                    <span className="flex items-center gap-2">
                      <Avatar
                        name={m.person.displayName}
                        src={m.person.avatarUrl}
                        size="sm"
                      />
                      <span className="font-bold">{m.person.displayName}</span>
                      {m.isLeader && (
                        <span className="rounded bg-forest-700 px-1 text-[9px] text-white">
                          تورلیدر
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-3">{formatToman(m.shareToman)}</td>
                  <td className="py-3">{formatToman(m.paidToman)}</td>
                  <td
                    className={cn(
                      "py-3 font-bold",
                      m.balanceToman > 0
                        ? "text-danger"
                        : m.balanceToman < 0
                          ? "text-success"
                          : "text-ink-muted",
                    )}
                  >
                    {m.balanceToman > 0
                      ? `بدهکار ${formatToman(m.balanceToman)}`
                      : m.balanceToman < 0
                        ? `طلبکار ${formatToman(-m.balanceToman)}`
                        : "تسویه"}
                  </td>
                  <td className="py-3">
                    <Badge tone={PAY_STATUS[m.paymentStatus].tone}>
                      {PAY_STATUS[m.paymentStatus].label}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {data.canEdit && (
        <AddExpenseModal
          tourId={tourId}
          open={adding}
          onClose={() => setAdding(false)}
        />
      )}
      <PayModal
        tourId={tourId}
        open={paying}
        onClose={() => setPaying(false)}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-panel border border-line bg-surface p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-coral-50 text-coral-600 dark:bg-coral-700/15">
        <CircleDollarSign className="size-6" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-xs text-ink-muted">{label}</span>
        <span className="block text-lg font-black">{value}</span>
        {hint && (
          <span className="block text-[11px] text-ink-soft">{hint}</span>
        )}
      </span>
    </div>
  );
}

function AddExpenseModal({
  tourId,
  open,
  onClose,
}: {
  tourId: string;
  open: boolean;
  onClose: () => void;
}) {
  const add = useAddExpense(tourId);
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("accommodation");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(toLatinDigits(amount).replace(/[^\d]/g, ""));
    if (title.trim().length < 2 || !value)
      return setError("عنوان و مبلغ را وارد کنید.");
    setError(null);
    add.mutate(
      { title: title.trim(), category, amountToman: value },
      {
        onSuccess: () => {
          toast.success("هزینه ثبت شد و سهم اعضا به‌روز شد.");
          setTitle("");
          setAmount("");
          onClose();
        },
        onError: (err) =>
          setError(
            err instanceof ApiError && err.code === "NOT_TOUR_LEADER"
              ? err.message
              : errorMessage(err),
          ),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ثبت هزینه جدید"
      description="مبلغ به‌طور مساوی بین اعضای تأییدشده و تورلیدر تقسیم می‌شود."
      dismissible={!add.isPending}
    >
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField
          label="عنوان"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          data-autofocus
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="دسته"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            options={(Object.keys(EXPENSE_META) as ExpenseCategory[]).map(
              (c) => ({ value: c, label: EXPENSE_META[c].label }),
            )}
          />
          <TextField
            label="مبلغ (تومان)"
            required
            inputMode="numeric"
            value={
              amount
                ? Number(
                    toLatinDigits(amount).replace(/[^\d]/g, "") || 0,
                  ).toLocaleString("fa-IR")
                : ""
            }
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={add.isPending}>
            انصراف
          </Button>
          <Button type="submit" loading={add.isPending}>
            ثبت هزینه
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function PayModal({
  tourId,
  open,
  onClose,
}: {
  tourId: string;
  open: boolean;
  onClose: () => void;
}) {
  const pay = usePay(tourId);
  const toast = useToast();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const run = (simulate: "success" | "fail") => {
    setResult(null);
    pay.mutate(simulate, {
      onSuccess: (r) =>
        setResult({
          ok: true,
          text: `پرداخت ${formatToman(r.amountToman)} موفق بود. کد پیگیری: ${r.reference}`,
        }),
      onError: (err) => {
        setResult({ ok: false, text: errorMessage(err) });
        if (!(err instanceof ApiError)) toast.error(errorMessage(err));
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setResult(null);
        onClose();
      }}
      title="درگاه پرداخت آزمایشی"
      description="این درگاه شبیه‌سازی‌شده است و به هیچ بانکی وصل نیست؛ اطلاعات کارت وارد نکنید."
      size="sm"
      dismissible={!pay.isPending}
    >
      <div className="rounded-2xl bg-surface-muted p-4 text-sm leading-7 text-ink-muted">
        مبلغ بدهی شما طبق جدول تسویه محاسبه و پس از تأیید ثبت می‌شود. در صورت
        خطا، هیچ مبلغی ثبت نمی‌شود.
      </div>
      {result && (
        <p
          role="status"
          className={cn(
            "mt-4 rounded-xl p-3 text-sm font-bold",
            result.ok
              ? "bg-tint-mint text-success"
              : "bg-danger/10 text-danger",
          )}
        >
          {result.text}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          onClick={() => run("fail")}
          disabled={pay.isPending}
        >
          شبیه‌سازی پرداخت ناموفق
        </Button>
        <Button onClick={() => run("success")} loading={pay.isPending}>
          پرداخت آزمایشی
        </Button>
      </div>
    </Modal>
  );
}
