/* Figma «تکمیل عضویت در تور» (checkout) with success / failure / cancel modals.
 * TEST GATEWAY ONLY: card fields are fixed demo values (read-only) and are never sent to the API.
 * The request carries seats, discount code and the chosen simulated outcome; totals come from the server. */
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FlaskConical,
  KeyRound,
  Lock,
  MapPin,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { useSession } from "@/features/auth/hooks";
import { displayName } from "@/features/auth/api/auth-schemas";
import { ApiError, errorMessage } from "@/shared/api/errors";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { toFaDigits } from "@/shared/lib/digits";
import { formatDateRange, formatToman } from "@/shared/lib/format";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Container } from "@/shared/ui/Container";
import { Modal } from "@/shared/ui/Modal";
import { EmptyState, ErrorState, Skeleton } from "@/shared/ui/StateViews";
import type { CheckoutResult, Discount, TourDetail } from "../api/tour-schemas";
import { useCheckout, useTourDetail, useValidateDiscount } from "../hooks";
import { spotsLeft } from "../model/labels";

export function CheckoutPage() {
  const { tourId = "" } = useParams();
  const {
    data: tour,
    isPending,
    isError,
    error,
    refetch,
  } = useTourDetail(tourId);
  useDocumentTitle("تکمیل عضویت در تور");
  if (isPending)
    return (
      <Container
        className="grid gap-6 py-10 lg:grid-cols-[1fr_24rem]"
        aria-busy="true"
      >
        <Skeleton className="h-[30rem]" />
        <Skeleton className="h-96" />
      </Container>
    );
  if (isError || !tour) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Container className="py-16">
        {notFound ? (
          <EmptyState
            title="این تور پیدا نشد"
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
  return <CheckoutView tour={tour} />;
}

const TEST_CARD = {
  number: "6037 **** **** 1234",
  expiry: "06/1408",
  otp: "123456",
};

function CheckoutView({ tour }: { tour: TourDetail }) {
  const { user } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const left = spotsLeft(tour);
  const seats = Math.max(1, Math.min(4, Number(params.get("seats")) || 1));
  const code = params.get("code");
  const [discount, setDiscount] = useState<Discount | null>(null);
  const validate = useValidateDiscount(tour.id);
  const checkout = useCheckout(tour.id);
  const [otpSent, setOtpSent] = useState(false);
  const [outcome, setOutcome] = useState<"success" | "fail">("success");
  const [accepted, setAccepted] = useState(false);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    if (code) validate.mutate(code, { onSuccess: setDiscount });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- validate once per code
  }, [code]);

  const subtotal = tour.priceToman * seats;
  const off = discount ? Math.round((subtotal * discount.percent) / 100) : 0;
  const detailUrl = `/tours/${tour.id}`;

  if (!result && !tour.viewer.canRequestJoin) {
    return (
      <Container className="py-16">
        <EmptyState
          title={
            tour.viewer.membership
              ? "شما قبلاً برای این تور درخواست داده‌اید"
              : "این تور فعلاً عضو جدید نمی‌پذیرد"
          }
          text={
            tour.viewer.isCreator
              ? "شما برگزارکننده این تور هستید."
              : "وضعیت درخواست را در صفحه تور یا «سفرهای من» ببینید."
          }
          action={<ButtonLink to={detailUrl}>بازگشت به جزئیات تور</ButtonLink>}
        />
      </Container>
    );
  }

  const pay = () => {
    setFailure(null);
    checkout.mutate(
      { seats, discountCode: discount?.code ?? null, simulate: outcome },
      {
        onSuccess: setResult,
        onError: (err) => {
          if (err instanceof ApiError && err.code === "PROFILE_INCOMPLETE") {
            navigate(
              `/auth?step=profile&next=${encodeURIComponent(location.pathname + location.search)}`,
            );
            return;
          }
          setFailure(errorMessage(err));
        },
      },
    );
  };
  const canPay = otpSent && accepted && seats <= left && !checkout.isPending;

  return (
    <div className="bg-[#f6f3ee] py-8 dark:bg-transparent sm:py-12">
      <Container>
        <button
          type="button"
          onClick={() => setCancelOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-coral-600 dark:text-ink-muted"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
          بازگشت به جزئیات تور
        </button>
        <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-coral-50 px-3 py-1 text-xs font-extrabold text-coral-600 dark:bg-coral-500/15">
          <FlaskConical className="size-3.5" aria-hidden="true" />
          پرداخت آزمایشی و امن
        </p>
        <h1 className="mt-3 text-2xl font-black text-[#1c3c34] dark:text-ink sm:text-3xl">
          تکمیل عضویت در تور
        </h1>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_24rem]">
          <section
            className="rounded-panel border border-line bg-surface p-5 shadow-card sm:p-7"
            aria-labelledby="pay-title"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="pay-title" className="text-lg font-black">
                اطلاعات پرداخت بانکی
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-tint-mint px-3 py-1 text-[11px] font-extrabold text-forest-800 dark:text-forest-100">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                درگاه شاپرک امن · نسخه آزمایشی
              </span>
            </div>
            <p
              role="note"
              className="mt-4 rounded-2xl border border-dashed border-coral-300 bg-coral-50/60 p-3 text-xs leading-6 text-coral-700 dark:bg-coral-500/10 dark:text-coral-200"
            >
              این درگاه شبیه‌سازی است: اطلاعات کارت ثابت و نمایشی است، هیچ داده
              بانکی واقعی دریافت یا ارسال نمی‌شود و مبلغی کسر نمی‌گردد.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ReadOnlyField
                label="نام دارنده کارت"
                value={user ? displayName(user) : "—"}
              />
              <ReadOnlyField
                label="شماره کارت آزمایشی"
                value={toFaDigits(TEST_CARD.number)}
                ltr
              />
              <ReadOnlyField
                label="تاریخ انقضا"
                value={toFaDigits(TEST_CARD.expiry)}
                ltr
              />
              <div>
                <span className="text-xs font-bold text-ink-soft">
                  رمز دوم پویا
                </span>
                <div className="mt-1.5 flex gap-2">
                  <output
                    aria-label="رمز دوم پویا"
                    dir="ltr"
                    className="flex min-h-11 min-w-0 flex-1 items-center rounded-xl border border-line bg-surface-muted px-3 text-sm font-bold tracking-widest text-ink"
                  >
                    {otpSent ? toFaDigits(TEST_CARD.otp) : "——————"}
                  </output>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<KeyRound className="size-4" />}
                    onClick={() => setOtpSent(true)}
                    disabled={otpSent}
                  >
                    {otpSent ? "ارسال شد" : "دریافت رمز"}
                  </Button>
                </div>
                {otpSent && (
                  <p className="mt-1 text-[11px] text-ink-soft">
                    رمز آزمایشی به‌صورت خودکار وارد شد.
                  </p>
                )}
              </div>
            </div>

            <fieldset className="mt-6 rounded-2xl bg-surface-muted p-4">
              <legend className="px-1 text-xs font-bold text-ink-soft">
                نتیجه شبیه‌سازی پرداخت (فقط محیط آزمایشی)
              </legend>
              <div className="flex flex-wrap gap-4 text-sm">
                {(
                  [
                    ["success", "پرداخت موفق"],
                    ["fail", "پرداخت ناموفق"],
                  ] as const
                ).map(([v, label]) => (
                  <label key={v} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="simulate"
                      value={v}
                      checked={outcome === v}
                      onChange={() => setOutcome(v)}
                      className="accent-[#e8604c]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mt-5 flex items-start gap-2.5 text-sm leading-7 text-ink">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1.5 size-4 accent-[#e8604c]"
              />
              <span>
                <Link
                  to="/rules#refund"
                  className="font-bold text-coral-600 underline-offset-4 hover:underline"
                >
                  قوانین پرداخت، شرایط کنسلی و استرداد
                </Link>{" "}
                و تعهدات سفرهای گروهی همسفر را مطالعه کرده و می‌پذیرم.
              </span>
            </label>

            {seats > left && (
              <p className="mt-3 text-xs text-danger">
                فقط {toFaDigits(left)} جای خالی باقی مانده است؛ تعداد را در صفحه
                تور کم کنید.
              </p>
            )}
            {failure &&
              !checkout.isPending &&
              checkout.error instanceof ApiError &&
              checkout.error.code !== "PAYMENT_FAILED" && (
                <p
                  role="alert"
                  className="mt-3 rounded-xl bg-danger/10 p-3 text-xs text-danger"
                >
                  {failure}
                </p>
              )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button variant="ghost" onClick={() => setCancelOpen(true)}>
                انصراف
              </Button>
              <Button
                size="lg"
                onClick={pay}
                loading={checkout.isPending}
                disabled={!canPay}
                icon={<Lock className="size-4" />}
              >
                پرداخت آزمایشی و ثبت عضویت
              </Button>
            </div>
            {!otpSent && (
              <p className="mt-2 text-end text-[11px] text-ink-soft">
                برای فعال شدن پرداخت، رمز پویا را دریافت و قوانین را بپذیرید.
              </p>
            )}
          </section>

          <aside
            className="overflow-hidden rounded-panel border border-line bg-surface shadow-card lg:sticky lg:top-24"
            aria-label="خلاصه سفارش"
          >
            <img
              src={tour.coverImageUrl}
              alt=""
              className="aspect-[16/9] w-full object-cover"
            />
            <div className="p-5">
              <h2 className="text-base font-black">{tour.title}</h2>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
                <MapPin className="size-3.5" aria-hidden="true" />
                {tour.destination}، {tour.province}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {formatDateRange(tour.startDate, tour.endDate)}
              </p>
              <dl className="mt-5 space-y-3 border-t border-line pt-4 text-sm">
                <Row
                  label={`سهم شما (${toFaDigits(seats)} نفر)`}
                  value={formatToman(subtotal)}
                />
                {code && (
                  <Row
                    label={discount ? `کد تخفیف ${discount.code}` : "کد تخفیف"}
                    value={
                      discount
                        ? `− ${formatToman(off)}`
                        : validate.isPending
                          ? "…"
                          : "نامعتبر"
                    }
                    tone={discount ? "text-success" : "text-danger"}
                  />
                )}
                <Row label="کارمزد خدمات همسفر" value="رایگان (۰ تومان)" />
                <Row label="مالیات و عوارض" value="۰ تومان" />
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <dt className="font-black">مبلغ نهایی پرداخت</dt>
                  <dd className="text-lg font-black text-coral-500">
                    {formatToman(subtotal - off)}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 flex items-start gap-2 rounded-2xl bg-surface-muted p-3 text-[11px] leading-6 text-ink-muted">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-forest-600"
                  aria-hidden="true"
                />
                وجه واریزی تا زمان تأیید پذیرش در حساب امن امانت می‌ماند.
              </p>
            </div>
          </aside>
        </div>
      </Container>

      {/* Success — shown only after the server confirms (201). */}
      <Modal
        open={result !== null}
        onClose={() => navigate("/")}
        title={
          result?.requestStatus === "approved"
            ? "عضویت با موفقیت ثبت شد!"
            : "درخواست و پیش‌پرداخت ثبت شد!"
        }
        size="sm"
      >
        {result && (
          <div className="text-center">
            <CheckCircle2
              className="mx-auto size-14 text-success"
              aria-hidden="true"
            />
            <p className="mt-4 text-sm leading-7 text-ink-muted">
              درخواست پیوستن شما به تور «{tour.title}» ثبت شد. اطلاعات تکمیلی و
              لینک گروه هماهنگی پیامک خواهد شد.
              {result.requestStatus === "pending" &&
                " عضویت پس از تأیید برگزارکننده قطعی می‌شود."}
            </p>
            <dl className="mt-4 space-y-1.5 rounded-2xl bg-surface-muted p-3 text-xs">
              <Row
                label="مبلغ پیش‌پرداخت (آزمایشی)"
                value={formatToman(result.totalToman)}
              />
              <Row
                label="کد پیگیری"
                value={<span dir="ltr">{result.paymentRef}</span>}
              />
            </dl>
            <div className="mt-6 flex flex-col gap-2">
              <ButtonLink to="/" data-autofocus>
                بازگشت به صفحه اصلی
              </ButtonLink>
              <ButtonLink to="/profile?tab=trips" variant="ghost">
                مشاهده سفرهای من
              </ButtonLink>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={
          failure !== null &&
          checkout.error instanceof ApiError &&
          checkout.error.code === "PAYMENT_FAILED"
        }
        onClose={() => setFailure(null)}
        title="تراکنش ناموفق بود"
        size="sm"
      >
        <div className="text-center">
          <XCircle className="mx-auto size-14 text-danger" aria-hidden="true" />
          <p className="mt-4 text-sm leading-7 text-ink-muted">{failure}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={() => {
                setFailure(null);
                setOutcome("success");
              }}
              data-autofocus
            >
              تلاش مجدد برای پرداخت
            </Button>
            <ButtonLink to={detailUrl} variant="ghost">
              بازگشت به مشخصات تور
            </ButtonLink>
          </div>
        </div>
      </Modal>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="آیا از انصراف اطمینان دارید؟"
        size="sm"
      >
        <p className="text-sm leading-7 text-ink-muted">
          جایگاه شما در تور «{tour.title}» رزرو موقت است و در صورت خروج ممکن است
          ظرفیت تکمیل شود.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="danger" onClick={() => navigate(detailUrl)}>
            بله، خروج از درگاه
          </Button>
          <Button onClick={() => setCancelOpen(false)} data-autofocus>
            ادامه ثبت‌نام
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div>
      <span className="text-xs font-bold text-ink-soft">{label}</span>
      <output
        aria-label={label}
        dir={ltr ? "ltr" : undefined}
        className="mt-1.5 flex min-h-11 items-center rounded-xl border border-line bg-surface-muted px-3 text-sm font-bold text-ink"
      >
        {value}
      </output>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={`font-bold ${tone ?? "text-ink"}`}>{value}</dd>
    </div>
  );
}
