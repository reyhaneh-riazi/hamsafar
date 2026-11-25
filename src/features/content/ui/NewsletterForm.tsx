import { useState, type FormEvent } from "react";
import { errorMessage } from "@/shared/api/errors";
import { useToast } from "@/shared/ui/Toast";
import { Spinner } from "@/shared/ui/Spinner";
import { useSubscribeNewsletter } from "../hooks";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterForm({
  variant = "default",
}: {
  variant?: "default" | "footer";
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const subscribe = useSubscribeNewsletter();
  const toast = useToast();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setError("ایمیل معتبر وارد کنید.");
      return;
    }
    setError(null);
    subscribe.mutate(value, {
      onSuccess: () => {
        toast.success("عضویت شما در خبرنامه همسفر ثبت شد.");
        setEmail("");
      },
      onError: (err) => setError(errorMessage(err)),
    });
  };

  return (
    <form onSubmit={submit} noValidate className="w-full">
      <label htmlFor="newsletter-email" className="sr-only">
        ایمیل برای عضویت در خبرنامه
      </label>
      <div
        className={
          variant === "footer"
            ? "flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 p-1 ps-3"
            : "flex items-center gap-2 rounded-xl bg-white p-1.5 ps-4 shadow-sm"
        }
      >
        <input
          id="newsletter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={
            variant === "footer"
              ? "ایمیل برای پیشنهادهای سفر"
              : "ایمیل خود را وارد کنید"
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "newsletter-error" : undefined}
          className={
            variant === "footer"
              ? "min-w-0 flex-1 bg-transparent text-end text-xs text-white outline-none placeholder:text-right placeholder:text-white/50"
              : "min-w-0 flex-1 bg-transparent text-end text-sm text-forest-900 outline-none placeholder:text-right placeholder:text-stone-400"
          }
        />
        <button
          type="submit"
          disabled={subscribe.isPending}
          className={
            variant === "footer"
              ? "inline-flex h-8 shrink-0 items-center gap-2 rounded-lg bg-[#e8604c] px-4 text-xs font-bold text-white transition hover:bg-coral-600 disabled:opacity-70"
              : "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-coral-500 px-5 text-sm font-bold text-white transition hover:bg-coral-600 disabled:opacity-70"
          }
        >
          {subscribe.isPending && <Spinner className="size-4" />}
          عضویت
        </button>
      </div>
      {error && (
        <p
          id="newsletter-error"
          role="alert"
          className="mt-2 text-xs font-medium text-coral-300"
        >
          {error}
        </p>
      )}
    </form>
  );
}
