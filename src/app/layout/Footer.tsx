import { Link } from "react-router";
import { NewsletterForm } from "@/features/content/ui/NewsletterForm";

/* Figma «MainFooter» (154:308): dark green, brand + 3 link columns, newsletter, bottom bar. */
const QUICK = [
  { to: "/tours", label: "کشف و خرید تور" },
  { to: "/planner", label: "ساخت تور جدید" },
  { to: "/profile", label: "داشبورد من" },
  { to: "/about", label: "داستان همسفر" },
  { to: "/contact", label: "مرکز پشتیبانی" },
];

const TRUST = [
  { to: "/rules", label: "قوانین و شرایط استفاده" },
  { to: "/rules#refund", label: "پرداخت و بازگشت وجه" },
  { to: "/rules#safety", label: "قوانین امنیت سفر" },
  { to: "/contact?subject=report", label: "گزارش تخلف" },
  { to: "/contact#faq", label: "پرسش‌های متداول" },
  { to: "/ui-kit", label: "کتابخانه کامپوننت‌ها" },
];

const PILLS = [
  "خرید سریع و شفاف",
  "تورهای تاییدشده",
  "همسفرهای واقعی",
  "برنامه سفر یکپارچه",
];

function Column({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="text-sm font-black text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="text-[13px] text-white/70 transition hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto bg-[#1c3c34] text-white dark:bg-[#0b1d18]">
      <div className="mx-auto max-w-page px-4 pb-6 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2.5"
              aria-label="همسفر — صفحه اصلی"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-sm font-black">
                هـ
              </span>
              <span className="text-lg font-black">همسفر</span>
            </Link>
            <p className="mt-4 max-w-xs text-[13px] leading-7 text-white/75">
              جایی برای پیدا کردن همسفر، ساختن یک برنامه دقیق و تبدیل ایده سفر
              به تجربه‌ای واقعی و امن.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {PILLS.map((p) => (
                <li
                  key={p}
                  className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <Column title="دسترسی سریع" links={QUICK} />
          <Column title="راهنما و اعتماد" links={TRUST} />
          <div>
            <h2 className="text-sm font-black">با ما در ارتباط باشید</h2>
            <address className="mt-4 space-y-1.5 text-[13px] not-italic leading-6 text-white/75">
              <p>تهران، دانشگاه — تیم Frog Software</p>
              <p className="ltr-island">۰۲۱-۹۱۰۱۲۳۴</p>
              <p>
                <a
                  href="mailto:hello@hamsafar.ir"
                  className="ltr-island hover:text-white"
                >
                  hello@hamsafar.ir
                </a>
              </p>
              <p>پشتیبانی: هر روز ۸ تا ۲۲</p>
            </address>
            <div className="mt-5">
              <NewsletterForm variant="footer" />
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col-reverse items-center justify-between gap-3 border-t border-white/10 pt-6 text-[12px] text-white/60 sm:flex-row">
          <p>© ۱۴۰۵ همسفر — همه حقوق محفوظ است.</p>
          <p>طراحی‌شده برای سفرهای امن‌تر و به‌یادماندنی‌تر</p>
        </div>
      </div>
    </footer>
  );
}
