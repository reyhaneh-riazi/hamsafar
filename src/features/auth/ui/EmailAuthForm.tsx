import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import { ApiError, errorMessage } from "@/shared/api/errors";
import { cn } from "@/shared/lib/cn";
import { toLatinDigits } from "@/shared/lib/digits";
import { Button } from "@/shared/ui/Button";
import { TextField } from "@/shared/ui/Field";
import { RequestFeedback } from "@/shared/ui/RequestFeedback";
import type { User } from "../api/auth-schemas";
import { useEmailLogin, useRegister } from "../hooks";
import {
  normalizeEmail,
  passwordChecks,
  validateCredentials,
  type CredentialErrors,
} from "../model/credentials";

interface EmailAuthFormProps {
  /** Called after a successful sign-in / sign-up (user may still need profile completion). */
  onSignedIn: (user: User, isNewUser: boolean) => void;
}

function PasswordField({
  label,
  value,
  onChange,
  error,
  autoComplete,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete: string;
  onBlur?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextField
        label={label}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(toLatinDigits(e.target.value))}
        onBlur={onBlur}
        error={error}
        required
        dir="ltr"
        autoComplete={autoComplete}
        className="pr-12 text-left"
        maxLength={64}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "پنهان کردن رمز" : "نمایش رمز"}
        aria-pressed={visible}
        className="absolute right-2 top-[2.1rem] inline-flex size-9 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-muted hover:text-ink"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/**
 * Email + password sign-in and sign-up (v0.6). Covers field validation, password confirmation,
 * duplicate-email error (409 EMAIL_TAKEN), wrong credentials (401) and the success state.
 */
export function EmailAuthForm({ onSignedIn }: EmailAuthFormProps) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<CredentialErrors & { form?: string }>(
    {},
  );
  const [touched, setTouched] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [created, setCreated] = useState<{
    user: User;
    isNewUser: boolean;
  } | null>(null);
  const register = useRegister();
  const login = useEmailLogin();
  const busy = register.isPending || login.isPending;
  const checks = passwordChecks(password);

  const switchMode = (next: "login" | "register") => {
    setMode(next);
    setErrors({});
    setTouched(false);
    setDuplicate(false);
    register.reset();
    login.reset();
  };

  const revalidate = (patch: {
    email?: string;
    password?: string;
    confirm?: string;
  }) => {
    if (!touched) return;
    const next = validateCredentials(
      { email, password, confirm, ...patch },
      mode,
    );
    setErrors(next);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setDuplicate(false);
    const local = validateCredentials({ email, password, confirm }, mode);
    setErrors(local);
    if (Object.keys(local).length) return;
    const body = { email: normalizeEmail(email), password };
    const onError = (err: unknown) => {
      if (err instanceof ApiError && err.code === "EMAIL_TAKEN") {
        setDuplicate(true);
        setErrors({
          email: err.fieldErrors.email ?? "این ایمیل قبلاً ثبت شده است.",
        });
      } else if (
        err instanceof ApiError &&
        err.code === "INVALID_CREDENTIALS"
      ) {
        setErrors({ form: err.message });
      } else if (
        err instanceof ApiError &&
        Object.keys(err.fieldErrors).length
      ) {
        setErrors(err.fieldErrors);
      } else setErrors({ form: errorMessage(err) });
    };
    if (mode === "register")
      register.mutate(body, { onSuccess: (res) => setCreated(res), onError });
    else
      login.mutate(body, {
        onSuccess: (res) => onSignedIn(res.user, res.isNewUser),
        onError,
      });
  };

  if (created) {
    return (
      <div className="mt-6 space-y-4" data-testid="register-success">
        <RequestFeedback
          status="success"
          successText={`حساب کاربری با ایمیل ${created.user.email ?? ""} ساخته شد و وارد شدید.`}
        />
        <p className="text-sm leading-7 text-ink-muted">
          یک قدم مانده: نام‌تان را وارد کنید تا همسفرها شما را بشناسند.
        </p>
        <Button
          size="lg"
          fullWidth
          iconEnd={<ArrowLeft className="size-5" />}
          onClick={() => onSignedIn(created.user, created.isNewUser)}
        >
          ادامه و تکمیل پروفایل
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-4 space-y-4">
      <TextField
        label="ایمیل"
        type="email"
        required
        dir="ltr"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setDuplicate(false);
          revalidate({ email: e.target.value });
        }}
        error={errors.email}
        placeholder="name@example.com"
        className="text-left placeholder:text-right"
        maxLength={120}
        autoFocus
      />
      {duplicate && (
        <p className="-mt-2 text-xs text-ink-muted">
          اگر این ایمیل مال شماست،{" "}
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="font-bold text-coral-500 hover:text-coral-600"
          >
            با همین ایمیل وارد شوید
          </button>
          .
        </p>
      )}
      <PasswordField
        label="رمز عبور"
        value={password}
        onChange={(v) => {
          setPassword(v);
          revalidate({ password: v });
        }}
        error={errors.password}
        autoComplete={mode === "register" ? "new-password" : "current-password"}
      />
      {mode === "register" && (
        <>
          <ul
            className="-mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px]"
            aria-label="شرایط رمز عبور"
          >
            {[
              { ok: checks.length, label: "حداقل ۸ کاراکتر" },
              { ok: checks.letter, label: "شامل حرف" },
              { ok: checks.digit, label: "شامل عدد" },
            ].map((r) => (
              <li
                key={r.label}
                className={cn(
                  "flex items-center gap-1",
                  r.ok ? "text-success" : "text-ink-soft",
                )}
              >
                <Check
                  className={cn("size-3.5", !r.ok && "opacity-30")}
                  aria-hidden="true"
                />
                {r.label}
                <span className="sr-only">
                  {r.ok ? "(رعایت شده)" : "(رعایت نشده)"}
                </span>
              </li>
            ))}
          </ul>
          <PasswordField
            label="تکرار رمز عبور"
            value={confirm}
            onChange={(v) => {
              setConfirm(v);
              revalidate({ confirm: v });
            }}
            error={errors.confirm}
            autoComplete="new-password"
          />
        </>
      )}
      {errors.form && (
        <RequestFeedback
          status="error"
          error={new ApiError(400, "FORM", errors.form)}
        />
      )}
      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={busy}
        iconEnd={<ArrowLeft className="size-5" />}
      >
        {mode === "register" ? "ساخت حساب کاربری" : "ورود"}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        {mode === "register" ? "قبلاً ثبت‌نام کرده‌اید؟ " : "حساب ندارید؟ "}
        <button
          type="button"
          onClick={() => switchMode(mode === "register" ? "login" : "register")}
          className="font-bold text-coral-500 hover:text-coral-600"
        >
          {mode === "register" ? "ورود با ایمیل" : "ثبت‌نام با ایمیل"}
        </button>
      </p>
    </form>
  );
}
