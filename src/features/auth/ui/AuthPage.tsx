import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  House,
  MapPin,
  Moon,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Sun,
  Zap,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ApiError, errorMessage } from "@/shared/api/errors";
import { env } from "@/shared/config/env";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";
import { formatCountdown } from "@/shared/lib/format";
import {
  formatMobile,
  isValidMobile,
  normalizeMobile,
} from "@/shared/lib/phone";
import { Button } from "@/shared/ui/Button";
import { TextField } from "@/shared/ui/Field";
import { PageLoader } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import { useTheme } from "@/shared/theme/ThemeProvider";
import type { OtpRequestResponse } from "../api/auth-schemas";
import {
  useRequestOtp,
  useSession,
  useUpdateProfile,
  useVerifyOtp,
} from "../hooks";
import { safeNextPath } from "../RequireAuth";
import { EmailAuthForm } from "./EmailAuthForm";
import { OtpInput } from "./OtpInput";

type Step = "phone" | "otp" | "profile";

/** Counts down to zero once per second; resets whenever `seconds` changes identity via `key`. */
function useCountdown(seconds: number, key: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    if (seconds <= 0) return;
    const started = Date.now();
    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        seconds - Math.floor((Date.now() - started) / 1000),
      );
      setLeft(remaining);
      if (remaining === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds, key]);
  return left;
}

function ThemeSwitch() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "حالت روشن" : "حالت تیره"}
      className="inline-flex size-10 items-center justify-center rounded-xl border border-line text-ink-muted transition hover:border-coral-300 hover:text-ink"
    >
      {theme === "dark" ? (
        <Sun className="size-5" />
      ) : (
        <Moon className="size-5" />
      )}
    </button>
  );
}

export function AuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isLoading } = useSession();
  const next = safeNextPath(params.get("next"));
  const asAdmin = params.get("as") === "admin";
  useDocumentTitle(asAdmin ? "ورود مدیر" : "ورود یا ثبت‌نام");

  const [step, setStep] = useState<Step>(
    params.get("step") === "profile" ? "profile" : "phone",
  );
  const [method, setMethod] = useState<"mobile" | "email">(
    params.get("method") === "email" ? "email" : "mobile",
  );
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<OtpRequestResponse | null>(null);
  const [sentAt, setSentAt] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();
  const resendLeft = useCountdown(cooldown, sentAt);

  // Already signed in: finish profile if needed, otherwise go to the destination.
  useEffect(() => {
    // Only for users who arrive already signed in; a fresh login is routed by finish().
    // The email form shows its own success state first and then routes via onSignedIn.
    if (
      isLoading ||
      !user ||
      verifyOtp.isPending ||
      verifyOtp.isSuccess ||
      (method === "email" && step === "phone")
    )
      return;
    if (!user.profileComplete) setStep("profile");
    else if (step !== "profile") navigate(next, { replace: true });
  }, [
    isLoading,
    user,
    step,
    next,
    navigate,
    verifyOtp.isPending,
    verifyOtp.isSuccess,
    method,
  ]);

  const finish = (role: "user" | "admin") => {
    if (asAdmin && role !== "admin") {
      toast.error("این حساب دسترسی مدیر ندارد؛ به حساب کاربری عادی وارد شدید.");
      navigate("/", { replace: true });
      return;
    }
    toast.success("ورود شما با موفقیت انجام شد.");
    navigate(next, { replace: true });
  };

  const sendCode = (target: string) => {
    setPhoneError(null);
    setOtpError(null);
    requestOtp.mutate(target, {
      onSuccess: (res) => {
        setChallenge(res);
        setCooldown(res.resendInSec);
        setSentAt(Date.now());
        setOtp("");
        setStep("otp");
      },
      onError: (err) => {
        const message =
          err instanceof ApiError &&
          err.code === "RATE_LIMITED" &&
          err.retryAfterSec
            ? `برای ارسال دوباره ${toFaDigits(err.retryAfterSec)} ثانیه صبر کنید.`
            : (err instanceof ApiError && err.fieldErrors.phone) ||
              errorMessage(err);
        if (
          err instanceof ApiError &&
          err.code === "RATE_LIMITED" &&
          err.retryAfterSec
        ) {
          // The server is still holding the previous code — show the OTP step with the real wait time.
          setCooldown(err.retryAfterSec);
          setSentAt(Date.now());
          if (challenge?.phone === target) setStep("otp");
        }
        if (step === "otp") setOtpError(message);
        else setPhoneError(message);
      },
    });
  };

  const submitPhone = (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeMobile(phone);
    if (!normalized) return setPhoneError("شماره موبایل را وارد کنید.");
    if (!isValidMobile(normalized))
      return setPhoneError("شماره را درست وارد کنید (مثل ۰۹۱۲۳۴۵۶۷۸۹).");
    setPhone(normalized);
    sendCode(normalized);
  };

  const submitOtp = (code: string) => {
    if (!challenge || verifyOtp.isPending) return;
    if (code.length !== challenge.codeLength)
      return setOtpError(
        `کد ${toFaDigits(challenge.codeLength)} رقمی را کامل وارد کنید.`,
      );
    setOtpError(null);
    verifyOtp.mutate(
      { phone: challenge.phone, code },
      {
        onSuccess: ({ user: u, isNewUser }) => {
          if (isNewUser || !u.profileComplete) {
            setStep("profile");
            toast.info("خوش آمدید! فقط نام‌تان را کامل کنید.");
          } else finish(u.role);
        },
        onError: (err) => {
          setOtp("");
          if (err instanceof ApiError && err.code === "INVALID_CODE") {
            const left = err.details.attemptsLeft;
            setOtpError(
              typeof left === "number"
                ? `کد تأیید نادرست است. ${toFaDigits(left)} تلاش دیگر باقی مانده.`
                : err.message,
            );
          } else setOtpError(errorMessage(err));
        },
      },
    );
  };

  if (isLoading) return <PageLoader />;

  const title =
    step === "phone"
      ? asAdmin
        ? "ورود مدیر سامانه"
        : "ورود یا ثبت‌نام"
      : step === "otp"
        ? "کد تأیید را وارد کنید"
        : "تکمیل پروفایل";

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[#f6f3ee] p-4 dark:bg-canvas sm:p-8 lg:p-12">
      <div className="relative z-10 grid w-full max-w-5xl animate-pop overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-float lg:grid-cols-[1fr_1.05fr]">
        {/* Photo on top for mobile (Figma 42:2) */}
        <AuthPhoto className="h-48 sm:h-60 lg:hidden" compact />
        {/* Form side (right in RTL) */}
        <div className="flex flex-col p-6 sm:p-10">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2.5"
              aria-label="همسفر — صفحه اصلی"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#1c3c34] text-white">
                <Zap className="size-5 fill-current" aria-hidden="true" />
              </span>
              <span className="leading-none">
                <span className="block text-xl font-black text-[#1c3c34] dark:text-white">
                  همسفر
                </span>
                <span className="mt-1 block text-[11px] text-ink-soft">
                  سفرهای گروهی بهتر
                </span>
              </span>
            </Link>
            <ThemeSwitch />
          </div>

          <div className="mt-10 min-h-[22rem] flex-1">
            <div key={step} className="animate-fade-up">
              <div className="flex items-center gap-2">
                {asAdmin && step === "phone" && (
                  <ShieldCheck
                    className="size-6 text-coral-500"
                    aria-hidden="true"
                  />
                )}
                <h1 className="text-2xl font-black text-ink">{title}</h1>
              </div>

              {step === "phone" && !asAdmin && (
                <div
                  role="tablist"
                  aria-label="روش ورود"
                  className="mt-4 grid grid-cols-2 rounded-xl bg-surface-muted p-1"
                >
                  {(
                    [
                      { id: "mobile", label: "شماره موبایل" },
                      { id: "email", label: "ایمیل و رمز عبور" },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="tab"
                      aria-selected={method === m.id}
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        "rounded-lg py-2 text-sm font-bold transition",
                        method === m.id
                          ? "bg-surface text-forest-800 shadow-sm dark:text-white"
                          : "text-ink-muted hover:text-ink",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}

              {step === "phone" && method === "email" && !asAdmin && (
                <EmailAuthForm
                  onSignedIn={(u, isNewUser) => {
                    if (isNewUser || !u.profileComplete) {
                      setStep("profile");
                      toast.success(
                        "حساب شما ساخته شد؛ فقط نام‌تان را کامل کنید.",
                      );
                    } else finish(u.role);
                  }}
                />
              )}

              {step === "phone" && (method === "mobile" || asAdmin) && (
                <form onSubmit={submitPhone} noValidate className="mt-3">
                  <p className="text-sm leading-7 text-ink-muted">
                    {asAdmin
                      ? "با شماره موبایل ثبت‌شده برای حساب مدیریت وارد شوید."
                      : "برای آغاز ماجراجویی و پیوستن به سفرهای گروهی، شماره موبایل خودت رو وارد کن."}
                  </p>
                  <TextField
                    wrapperClassName="mt-6"
                    label="شماره موبایل"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError(null);
                    }}
                    error={phoneError ?? undefined}
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                    placeholder="09xx xxx xxxx"
                    maxLength={16}
                    autoFocus
                    className="text-left text-base tracking-wider placeholder:text-right"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    className="mt-6"
                    loading={requestOtp.isPending}
                    iconEnd={<ArrowLeft className="size-5" />}
                  >
                    دریافت کد تأیید
                  </Button>
                </form>
              )}

              {step === "otp" && challenge && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitOtp(otp);
                  }}
                  noValidate
                  className="mt-3"
                >
                  <p className="text-sm leading-7 text-ink-muted">
                    کد {toFaDigits(challenge.codeLength)} رقمی به شماره زیر
                    ارسال شد
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="ltr-island text-base font-black tracking-wider text-ink">
                      {formatMobile(challenge.phone)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("phone");
                        setOtpError(null);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-coral-500 hover:text-coral-600"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      ویرایش شماره
                    </button>
                  </div>
                  <div className="mt-7">
                    <OtpInput
                      length={challenge.codeLength}
                      value={otp}
                      onChange={(v) => {
                        setOtp(v);
                        if (otpError) setOtpError(null);
                      }}
                      onComplete={submitOtp}
                      invalid={Boolean(otpError)}
                      disabled={verifyOtp.isPending}
                      autoFocus
                    />
                  </div>
                  <p
                    role="alert"
                    className={cn(
                      "mt-3 min-h-5 text-center text-xs font-medium text-danger",
                    )}
                  >
                    {otpError}
                  </p>
                  {env.apiMode === "mock" && (
                    <p className="mt-1 text-center text-xs text-ink-soft">
                      نسخه نمایشی: کد{" "}
                      <span className="ltr-island font-black text-ink">
                        12345
                      </span>{" "}
                      را وارد کنید
                    </p>
                  )}
                  <div
                    className="mt-4 flex items-center justify-center text-sm"
                    aria-live="polite"
                  >
                    {resendLeft > 0 ? (
                      <span className="text-ink-muted">
                        ارسال دوباره کد تا{" "}
                        <span className="font-bold text-ink">
                          {formatCountdown(resendLeft)}
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => sendCode(challenge.phone)}
                        disabled={requestOtp.isPending}
                        className="inline-flex items-center gap-1.5 font-bold text-forest-700 hover:text-coral-500 disabled:opacity-60 dark:text-forest-200"
                      >
                        <RotateCcw className="size-4" aria-hidden="true" />
                        ارسال مجدد کد
                      </button>
                    )}
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    className="mt-6"
                    loading={verifyOtp.isPending}
                    iconEnd={<ArrowLeft className="size-5" />}
                  >
                    ورود
                  </Button>
                </form>
              )}

              {step === "profile" && (
                <ProfileStep onDone={(role) => finish(role)} />
              )}
            </div>
          </div>

          <div className="mt-8 space-y-4 text-center text-xs text-ink-soft">
            <p>
              با ورود به همسفر،{" "}
              <Link
                to="/rules"
                className="font-bold text-forest-700 underline-offset-4 hover:underline dark:text-forest-200"
              >
                شرایط استفاده
              </Link>{" "}
              و{" "}
              <Link
                to="/rules#privacy"
                className="font-bold text-forest-700 underline-offset-4 hover:underline dark:text-forest-200"
              >
                حریم خصوصی
              </Link>{" "}
              را می‌پذیرید.
            </p>
            <Link
              to="/"
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-line py-3 text-sm font-bold text-ink transition hover:border-coral-300 hover:text-coral-600"
            >
              <House className="size-4" aria-hidden="true" />
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>

        {/* Photo side (left in RTL) */}
        <AuthPhoto className="hidden min-h-[560px] lg:block" />
      </div>
      <p className="mt-6 text-xs text-ink-soft">
        © ۱۴۰۳ همسفر. تمامی حقوق محفوظ است.
      </p>
    </div>
  );
}

/** Figma: Qeshm coast photo, location pill and quote with a coral rule. */
function AuthPhoto({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <img
        src="/images/tours/tour-persian-gulf.webp"
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
      <span className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-extrabold text-[#1c3c34]">
        <MapPin className="size-3.5 text-coral-500" aria-hidden="true" />
        جزیره قشم، خلیج فارس ایران
      </span>
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 text-white",
          compact ? "p-5" : "p-10",
        )}
      >
        <span
          className="block h-1 w-12 rounded-full bg-[#e8604c]"
          aria-hidden="true"
        />
        <p
          className={cn(
            "mt-3 max-w-sm font-black",
            compact ? "text-base leading-7" : "text-xl leading-9",
          )}
        >
          هر سفر خوب، قبل از حرکت با آدم‌ها و یک برنامه روشن شروع می‌شود.
        </p>
      </div>
    </div>
  );
}

function ProfileStep({ onDone }: { onDone: (role: "user" | "admin") => void }) {
  const { user } = useSession();
  const update = useUpdateProfile();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (firstName.trim().length < 2) local.firstName = "نام را وارد کنید.";
    if (lastName.trim().length < 2)
      local.lastName = "نام خانوادگی را وارد کنید.";
    setErrors(local);
    if (Object.keys(local).length) return;
    update.mutate(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        city: city.trim() || null,
      },
      {
        onSuccess: (u) => onDone(u.role),
        onError: (err) =>
          setErrors(
            err instanceof ApiError
              ? { ...err.fieldErrors, form: err.message }
              : { form: errorMessage(err) },
          ),
      },
    );
  };

  return (
    <form onSubmit={submit} noValidate className="mt-3">
      <p className="text-sm leading-7 text-ink-muted">
        برای اینکه همسفرها بشناسنت، نام و شهرت رو وارد کن.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <TextField
          label="نام"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          error={errors.firstName}
          autoComplete="given-name"
          autoFocus
        />
        <TextField
          label="نام خانوادگی"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          error={errors.lastName}
          autoComplete="family-name"
        />
      </div>
      <TextField
        wrapperClassName="mt-4"
        label="شهر"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        hint="اختیاری"
        autoComplete="address-level2"
      />
      {errors.form && (
        <p role="alert" className="mt-3 text-xs font-medium text-danger">
          {errors.form}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        fullWidth
        className="mt-6"
        loading={update.isPending}
        iconEnd={<ArrowLeft className="size-5" />}
      >
        ذخیره و ادامه
      </Button>
    </form>
  );
}
