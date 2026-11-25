/* Tour-detail modals from Figma: share (اشتراک‌گذاری سفر), organizer profile, join confirm (تأیید درخواست اولیه). */
import { useState } from "react";
import {
  BadgeCheck,
  Check,
  Copy,
  Link2,
  Minus,
  Plus,
  Send,
  Share2,
  Star,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { errorMessage } from "@/shared/api/errors";
import { toFaDigits, toLatinDigits } from "@/shared/lib/digits";
import { formatToman } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { useToast } from "@/shared/ui/Toast";
import type { Discount, TourDetail } from "../../api/tour-schemas";
import { useValidateDiscount } from "../../hooks";
import { spotsLeft } from "../../model/labels";

export function ShareModal({
  open,
  onClose,
  tour,
}: {
  open: boolean;
  onClose: () => void;
  tour: TourDetail;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const url =
    typeof window === "undefined"
      ? `/tours/${tour.id}`
      : `${window.location.origin}/tours/${tour.id}`;
  const text = encodeURIComponent(`${tour.title} — همسفر`);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("لینک تور کپی شد.");
    } catch {
      toast.info("لینک را انتخاب و دستی کپی کنید.");
    }
  };
  const native = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: tour.title, url });
      } catch {
        /* user dismissed the sheet */
      }
    } else void copy();
  };
  const targets = [
    {
      label: "واتساپ",
      href: `https://wa.me/?text=${text}%20${encodeURIComponent(url)}`,
      cls: "bg-[#25d366]/10 text-[#128c4a]",
    },
    {
      label: "تلگرام",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`,
      cls: "bg-[#229ed9]/10 text-[#1b7fb0]",
    },
  ];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="اشتراک‌گذاری سفر"
      description="این سفر هیجان‌انگیز را با دوستانت به اشتراک بگذار"
      size="sm"
    >
      <p className="text-xs font-bold text-ink-soft">لینک مستقیم تور</p>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-line bg-surface-muted p-2">
        <Link2
          className="ms-1 size-4 shrink-0 text-ink-soft"
          aria-hidden="true"
        />
        <input
          readOnly
          value={url}
          dir="ltr"
          aria-label="لینک تور"
          className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button
          size="sm"
          onClick={copy}
          icon={
            copied ? <Check className="size-4" /> : <Copy className="size-4" />
          }
          data-autofocus
        >
          {copied ? "کپی شد" : "کپی لینک"}
        </Button>
      </div>
      <p className="mt-5 text-xs font-bold text-ink-soft">ارسال مستقیم به:</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {targets.map((t) => (
          <a
            key={t.label}
            href={t.href}
            target="_blank"
            rel="noreferrer noopener"
            className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-xs font-bold transition hover:-translate-y-0.5 ${t.cls}`}
          >
            <Send className="size-5" aria-hidden="true" />
            {t.label}
          </a>
        ))}
        <button
          type="button"
          onClick={native}
          className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface-muted p-3 text-xs font-bold text-ink transition hover:-translate-y-0.5"
        >
          <Share2 className="size-5" aria-hidden="true" />
          سایر راه‌ها
        </button>
      </div>
    </Modal>
  );
}

export function OrganizerModal({
  open,
  onClose,
  tour,
  onJoin,
}: {
  open: boolean;
  onClose: () => void;
  tour: TourDetail;
  onJoin?: () => void;
}) {
  const c = tour.creator;
  const since = c.memberSince
    ? toFaDigits(
        new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", { year: "numeric" })
          .format(new Date(c.memberSince))
          .replace(/\D/g, ""),
      )
    : null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={c.displayName}
      description="پروفایل برگزارکننده"
      size="md"
    >
      <div className="flex items-center gap-4">
        <Avatar name={c.displayName} src={c.avatarUrl} size="lg" />
        <div className="space-y-1 text-xs">
          <p className="inline-flex items-center gap-1 rounded-full bg-tint-mint px-2.5 py-1 font-extrabold text-forest-800 dark:text-forest-100">
            <BadgeCheck className="size-3.5" aria-hidden="true" /> تأیید هویت
            شده
          </p>
          <p className="text-ink-muted">
            برگزارکننده {toFaDigits(c.toursLed)} تور
            {since ? ` · عضویت از سال ${since}` : ""}
          </p>
          {c.rating !== null && (
            <p className="flex items-center gap-1 font-bold text-coral-500">
              <Star className="size-3.5 fill-current" aria-hidden="true" />
              {toFaDigits(c.rating.toFixed(1))}{" "}
              <span className="font-normal text-ink-soft">
                ({toFaDigits(c.reviewCount)} تجربه)
              </span>
            </p>
          )}
        </div>
      </div>
      <h3 className="mt-6 text-sm font-black">درباره برگزارکننده</h3>
      <p className="mt-2 text-sm leading-7 text-ink-muted">
        {c.bio ?? "برگزارکننده هنوز معرفی‌نامه‌ای ننوشته است."}
      </p>
      {c.verifications.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-black">مدارک و مجوزهای تأییدشده</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {c.verifications.map((v) => (
              <li
                key={v}
                className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 text-xs font-bold text-ink"
              >
                <Check className="size-4 text-forest-600" aria-hidden="true" />
                {v}
              </li>
            ))}
          </ul>
        </>
      )}
      <h3 className="mt-6 text-sm font-black">نظرات همسفران</h3>
      {tour.leaderReviews.length === 0 ? (
        <p className="mt-2 text-xs text-ink-soft">
          هنوز نظری برای این برگزارکننده ثبت نشده است.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {tour.leaderReviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black">{r.authorName}</span>
                <span className="flex items-center gap-1 font-bold text-coral-500">
                  <Star className="size-3 fill-current" aria-hidden="true" />
                  {toFaDigits(r.rating)}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-6 text-ink-muted">
                {r.comment}
              </p>
              <p className="mt-1 text-[11px] text-ink-soft">{r.tourTitle}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onClose}>
          بستن
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to={`/users/${c.id}`}
            className="inline-flex items-center justify-center rounded-full border border-line px-4 py-2 text-sm font-bold hover:border-forest-400"
          >
            پروفایل کامل
          </Link>
          {onJoin && (
            <Button onClick={onJoin}>درخواست پیوستن به این تور</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/** Figma «تأیید درخواست اولیه». Only computes an estimate; the server decides the final amount at checkout. */
export function JoinConfirmModal({
  open,
  onClose,
  tour,
}: {
  open: boolean;
  onClose: () => void;
  tour: TourDetail;
}) {
  const navigate = useNavigate();
  const left = spotsLeft(tour);
  const max = Math.max(1, Math.min(4, left));
  const [seats, setSeats] = useState(1);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<Discount | null>(null);
  const validate = useValidateDiscount(tour.id);
  const subtotal = tour.priceToman * seats;
  const off = discount ? Math.round((subtotal * discount.percent) / 100) : 0;

  const apply = () => {
    const c = toLatinDigits(code).trim();
    if (!c) return;
    validate.mutate(c, {
      onSuccess: (d) => setDiscount(d),
      onError: () => setDiscount(null),
    });
  };
  const proceed = () => {
    const q = new URLSearchParams({ seats: String(seats) });
    if (discount) q.set("code", discount.code);
    onClose();
    navigate(`/tours/${tour.id}/checkout?${q.toString()}`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تأیید درخواست اولیه"
      description={`پیوستن به «${tour.title}»`}
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-surface-muted p-3">
          <span className="text-sm font-bold">تعداد همسفران شما</span>
          <div
            className="flex items-center gap-3"
            role="group"
            aria-label="تعداد همسفران"
          >
            <button
              type="button"
              aria-label="افزایش"
              disabled={seats >= max}
              onClick={() => setSeats((s) => Math.min(max, s + 1))}
              className="flex size-8 items-center justify-center rounded-full border border-line bg-surface disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
            <output
              aria-live="polite"
              className="w-6 text-center text-base font-black"
            >
              {toFaDigits(seats)}
            </output>
            <button
              type="button"
              aria-label="کاهش"
              disabled={seats <= 1}
              onClick={() => setSeats((s) => Math.max(1, s - 1))}
              className="flex size-8 items-center justify-center rounded-full border border-line bg-surface disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-2xl border border-line p-3">
            <dt className="text-ink-soft">هزینه هر نفر</dt>
            <dd className="mt-1 font-black">{formatToman(tour.priceToman)}</dd>
          </div>
          <div className="rounded-2xl border border-line p-3">
            <dt className="text-ink-soft">ظرفیت باقیمانده</dt>
            <dd className="mt-1 font-black">{toFaDigits(left)} نفر</dd>
          </div>
        </dl>
        <div>
          <label
            htmlFor="discount-code"
            className="text-xs font-bold text-ink-soft"
          >
            کد تخفیف (اختیاری)
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="discount-code"
              value={code}
              dir="ltr"
              onChange={(e) => {
                setCode(e.target.value);
                setDiscount(null);
                validate.reset();
              }}
              placeholder="HAMSAFAR10"
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-forest-500"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={apply}
              loading={validate.isPending}
              disabled={!code.trim()}
            >
              اعمال
            </Button>
          </div>
          {discount && (
            <p className="mt-1.5 text-xs font-bold text-success" role="status">
              {discount.label}
            </p>
          )}
          {validate.isError && (
            <p className="mt-1.5 text-xs text-danger" role="alert">
              {errorMessage(validate.error)}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm font-bold">مبلغ کل علی‌الحساب</span>
          <span className="text-lg font-black text-coral-500">
            {off > 0 && (
              <s className="me-2 text-xs font-bold text-ink-soft">
                {formatToman(subtotal)}
              </s>
            )}
            {formatToman(subtotal - off)}
          </span>
        </div>
        <p className="text-[11px] leading-5 text-ink-soft">
          مبلغ نهایی در صفحه پرداخت از سرور دریافت می‌شود. تا تأیید برگزارکننده
          جایی برای شما قطعی نیست.
        </p>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose}>
          انصراف
        </Button>
        <Button onClick={proceed} data-autofocus>
          ادامه و پرداخت پیش‌پرداخت امن
        </Button>
      </div>
    </Modal>
  );
}
