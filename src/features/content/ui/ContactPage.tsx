import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  CircleCheck,
  Mail,
  MapPin,
  Phone,
  Send,
  TriangleAlert,
} from "lucide-react";
import { useLocation, useSearchParams } from "react-router";
import wideImage from "@/assets/images/hero-lake-road.webp";
import { ApiError } from "@/shared/api/errors";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { cn } from "@/shared/lib/cn";
import { toLatinDigits } from "@/shared/lib/digits";
import { isValidMobile, normalizeMobile } from "@/shared/lib/phone";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { SelectField, TextArea, TextField } from "@/shared/ui/Field";
import { HeroBanner } from "@/shared/ui/HeroBanner";
import { Modal } from "@/shared/ui/Modal";
import { RequestFeedback } from "@/shared/ui/RequestFeedback";
import {
  contactSubjectSchema,
  type ContactSubject,
} from "../api/content-schemas";
import { useSendContact } from "../hooks";

/* Figma Contact (129:3999 light / 212:1841 dark / 217:5422 mobile). */
const SUBJECTS: Record<ContactSubject, string> = {
  create_tour: "راهنمایی ثبت و ایجاد تور",
  buy_tour: "پرسش درباره خرید تور",
  payment_refund: "پرداخت و بازگشت وجه",
  report: "گزارش تخلف",
  suggestion: "پیشنهاد و انتقاد",
  other: "سایر موارد",
};

export const FAQ = [
  {
    q: "در صورت نرسیدن به حد نصاب تور، سرنوشت وجه پرداختی چه می‌شود؟",
    a: "اگر تور تا ۲۴ ساعت قبل از حرکت به حد نصاب نرسد، لغو شده و ۱۰۰٪ مبلغ پرداختی بدون کسر هیچ‌گونه کارمزدی بلافاصله به کیف پول یا شماره شبای شما واریز خواهد شد.",
  },
  {
    q: "چگونه می‌توانم به عنوان برگزارکننده (لیدر) در همسفر تور ایجاد کنم؟",
    a: "با کلیک روی گزینه «ساخت تور»، مشخصات اولیه سفر را ثبت کنید. تیم کارشناسی همسفر ظرف چند ساعت مدارک شما را بررسی و بعد از تأیید، صفحه تور برای عموم فعال می‌شود.",
  },
  {
    q: "آیا امکان کنسلی سفر پس از ثبت‌نام وجود دارد؟",
    a: "بله؛ تا ۷۲ ساعت قبل از آغاز سفر با کسر ۵٪ کارمزد بانکی امکان بازگشت وجه وجود دارد. برای مشاهده جزئیات بازه‌های زمانی به بخش قوانین و مقررات مراجعه فرمایید.",
  },
];

function InfoCard({
  icon,
  title,
  children,
  tone = "default",
  badge,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  tone?: "default" | "alert";
  badge?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-4 rounded-3xl border p-5",
        tone === "alert"
          ? "border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10"
          : "border-slate-200/80 bg-white dark:border-line dark:bg-surface",
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-2xl",
          tone === "alert"
            ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20"
            : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/80",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={cn(
              "text-sm font-black",
              tone === "alert"
                ? "text-rose-700 dark:text-rose-300"
                : "text-slate-900 dark:text-white",
            )}
          >
            {title}
          </h3>
          {badge && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {badge}
            </span>
          )}
        </div>
        <div className="mt-1.5 text-xs leading-6 text-slate-600 dark:text-ink-muted">
          {children}
        </div>
      </div>
    </div>
  );
}

const EMPTY = {
  name: "",
  phone: "",
  subject: "create_tour" as ContactSubject,
  message: "",
};

export function ContactPage() {
  useDocumentTitle("ارتباط با ما و پشتیبانی");
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const initialSubject = contactSubjectSchema.safeParse(
    params.get("subject"),
  ).data;
  const [form, setForm] = useState({
    ...EMPTY,
    subject: initialSubject ?? EMPTY.subject,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ticket, setTicket] = useState<string | null>(null);
  const send = useSendContact();
  const set =
    (k: "name" | "phone" | "message") => (e: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (hash)
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const phone = normalizeMobile(toLatinDigits(form.phone));
    const local: Record<string, string> = {};
    if (form.name.trim().length < 2)
      local.name = "نام و نام خانوادگی را وارد کنید.";
    if (!phone) local.phone = "شماره موبایل را وارد کنید.";
    else if (!isValidMobile(phone))
      local.phone = "شماره موبایل معتبر نیست (مثل ۰۹۱۲۳۴۵۶۷۸۹).";
    if (form.message.trim().length < 10)
      local.message = "متن پیام باید حداقل ۱۰ حرف باشد.";
    setErrors(local);
    if (Object.keys(local).length) return;
    send.mutate(
      {
        name: form.name.trim(),
        phone,
        subject: form.subject,
        message: form.message.trim(),
      },
      {
        onSuccess: (res) => {
          setTicket(res.ticketId ?? null);
          setForm(EMPTY);
          setErrors({});
        },
        onError: (err) =>
          setErrors(err instanceof ApiError ? err.fieldErrors : {}),
      },
    );
  };

  return (
    <div className="bg-[#f6f3ee] pb-16 dark:bg-canvas">
      <HeroBanner
        image={wideImage}
        pill="پشتیبانی ۲۴/۷ و صدای همسفر"
        title="ارتباط با ما و پشتیبانی"
        subtitle="پرسش، گزارش سفر، پیشنهاد یا نیاز به پیگیری فوری دارید؟ تیم پشتیبانی همسفر در تمام روزهای هفته آماده پاسخگویی و همراهی است."
      />

      <div className="mx-auto mt-10 grid max-w-page gap-6 px-4 sm:px-6 lg:grid-cols-[1.45fr_1fr] lg:px-8">
        <section
          className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8 dark:border-line dark:bg-surface"
          aria-labelledby="contact-form"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2
                id="contact-form"
                className="text-lg font-black text-slate-900 dark:text-white"
              >
                ارسال پیام به پشتیبانی
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-ink-muted">
                فرم زیر را تکمیل نمایید؛ کارشناسان در کمتر از ۲ ساعت پاسخگو
                خواهند بود.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              پاسخگویی سریع
            </span>
          </div>
          <form
            onSubmit={submit}
            noValidate
            className="mt-6 grid gap-5 sm:grid-cols-2"
          >
            <TextField
              wrapperClassName="sm:col-span-2"
              label="نام و نام خانوادگی"
              required
              value={form.name}
              onChange={set("name")}
              error={errors.name}
              placeholder="مثال: ریحانه ریاضی"
              autoComplete="name"
              maxLength={60}
            />
            <TextField
              label="شماره موبایل"
              required
              value={form.phone}
              onChange={set("phone")}
              error={errors.phone}
              placeholder="۰۹۱۲..."
              inputMode="tel"
              dir="ltr"
              className="text-left placeholder:text-right"
              autoComplete="tel"
              maxLength={16}
            />
            <SelectField
              label="موضوع پیام"
              value={form.subject}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  subject: contactSubjectSchema.parse(e.target.value),
                }))
              }
              options={contactSubjectSchema.options.map((s) => ({
                value: s,
                label: SUBJECTS[s],
              }))}
            />
            <div className="sm:col-span-2">
              <TextArea
                label="متن پیام شما"
                required
                value={form.message}
                onChange={set("message")}
                error={errors.message}
                maxLength={1000}
                rows={5}
                placeholder="جزئیات درخواست، کد پیگیری تور یا سوال خود را اینجا بنویسید..."
              />
            </div>
            {send.isError && !Object.keys(errors).length && (
              <RequestFeedback
                className="sm:col-span-2"
                status="error"
                error={send.error}
              />
            )}
            <div className="sm:col-span-2">
              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={send.isPending}
                className="bg-[#e8604c]"
                icon={<Send className="size-4 -scale-x-100" />}
              >
                ارسال پیام به کارشناسان همسفر
              </Button>
            </div>
          </form>
        </section>

        <aside className="space-y-4" aria-label="راه‌های ارتباطی">
          <InfoCard
            tone="alert"
            icon={<TriangleAlert className="size-5" />}
            title="خط اضطراری حین سفر"
          >
            در صورتی که هم‌اکنون در یکی از تورها حضور دارید و با شرایط
            پیش‌بینی‌نشده یا اضطراری مواجه شده‌اید، مستقیماً تماس بگیرید.
            <a
              href="tel:02191012341"
              className="ltr-island mt-2 inline-flex rounded-full border border-rose-200 bg-white px-3 py-1 font-bold text-rose-700 dark:border-rose-500/30 dark:bg-transparent"
            >
              ۰۲۱-۹۱۰۱۲۳۴ (داخلی ۱)
            </a>
          </InfoCard>
          <InfoCard
            icon={<MapPin className="size-5" />}
            title="دفتر مرکزی همسفر"
          >
            تهران، میدان انقلاب، دانشگاه تهران، دانشکده فنی، ساختمان تیم Frog
            Software
            <span className="mt-1 block text-[11px] text-slate-400">
              مراجعات حضوری با هماهنگی قبلی
            </span>
          </InfoCard>
          <InfoCard
            icon={<Phone className="size-5" />}
            title="مرکز تماس و پشتیبانی"
            badge="پاسخگو"
          >
            <a
              href="tel:02191012340"
              className="ltr-island font-black text-slate-900 dark:text-white"
            >
              ۰۲۱-۹۱۰۱۲۳۴
            </a>
            <span className="mt-1 block text-[11px] text-slate-400">
              ساعات کاری: همه‌روزه از ساعت ۸:۰۰ تا ۲۲:۰۰
            </span>
          </InfoCard>
          <InfoCard
            icon={<Mail className="size-5" />}
            title="ایمیل رسمی و امور اداری"
          >
            <a
              href="mailto:hello@hamsafar.ir"
              className="ltr-island font-mono text-slate-900 dark:text-white"
            >
              hello@hamsafar.ir
            </a>
            <span className="mt-1 block text-[11px] text-slate-400">
              پاسخ به مکاتبات رسمی ظرف ۲۴ ساعت کاری
            </span>
          </InfoCard>
        </aside>
      </div>

      <section
        id="faq"
        className="mx-auto mt-10 max-w-page scroll-mt-24 px-4 sm:px-6 lg:px-8"
        aria-labelledby="faq-title"
      >
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8 dark:border-line dark:bg-surface">
          <p className="text-xs font-bold text-[#e8604c]">
            پاسخ به سوالات پرتکرار
          </p>
          <h2
            id="faq-title"
            className="mt-1 text-2xl font-black text-slate-900 dark:text-white"
          >
            پرسش‌های متداول همسفران
          </h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl bg-slate-50 p-5 dark:bg-surface-muted"
                open
              >
                <summary className="cursor-pointer list-none text-sm font-black text-slate-900 dark:text-white">
                  {f.q}
                </summary>
                <p className="mt-2 text-xs leading-7 text-slate-600 dark:text-ink-muted">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Modal
        open={ticket !== null}
        onClose={() => setTicket(null)}
        title="پیام شما با موفقیت ثبت شد"
        size="sm"
      >
        <div className="flex flex-col items-center text-center">
          <CircleCheck
            className="size-14 text-emerald-500"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-ink-muted">
            کارشناسان پشتیبانی همسفر در اسرع وقت (حداکثر تا ۲ ساعت آینده) پیام
            شما را بررسی کرده و پاسخ می‌دهند.
          </p>
          {ticket && (
            <p className="mt-2 text-xs text-slate-500">
              کد پیگیری:{" "}
              <span className="ltr-island font-black text-slate-900 dark:text-white">
                {ticket}
              </span>
            </p>
          )}
          <div className="mt-5 flex w-full gap-3">
            <Button variant="ghost" fullWidth onClick={() => setTicket(null)}>
              ارسال پیام دیگر
            </Button>
            <ButtonLink to="/" className="w-full">
              بازگشت به خانه
            </ButtonLink>
          </div>
        </div>
      </Modal>
    </div>
  );
}
