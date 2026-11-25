import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import wideImage from "@/assets/images/hero-lake-road.webp";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { HeroBanner } from "@/shared/ui/HeroBanner";

/* Figma «قوانین، مقررات و حریم خصوصی» (134:75 / 214:3616). */
export const RULES = [
  {
    id: "create",
    title: "۱. شرایط ایجاد و انتشار تور",
    text: "هر کاربر با تأیید شماره همراه و احراز هویت اولیه مجاز به پیشنهاد تور گروهی است. تمامی تورهای ایجادشده پیش از نمایش عمومی توسط کارشناسان پلتفرم همسفر بررسی و از نظر تناسب زمان‌بندی و ایمنی ارزیابی می‌شوند.",
  },
  {
    id: "refund",
    title: "۲. قوانین کنسلی و بازگشت وجه",
    text: "تا ۷۲ ساعت پیش از آغاز سفر، استرداد کامل وجه با کسر ۵٪ کارمزد بانکی انجام می‌شود. کنسلی بین ۷۲ تا ۲۴ ساعت پیش از حرکت مشمول ۵۰٪ استرداد و کمتر از ۲۴ ساعت مانده به سفر به دلیل هماهنگی‌های اقامتگاه و وسیله نقلیه غیرقابل استرداد خواهد بود.",
  },
  {
    id: "safety",
    title: "۳. مسئولیت و ایمنی همسفران",
    text: "رعایت اخلاق جمعی، احترام به فرهنگ بومی مناطق و حفظ محیط زیست وظیفه همگانی همسفران است. برگزارکننده در صورت بروز رفتارهای آسیب‌زننده حق گزارش به پشتیبانی و ممانعت از ادامه حضور فرد در برنامه را داراست.",
  },
  {
    id: "privacy",
    title: "۴. حریم خصوصی",
    text: "شماره موبایل و اطلاعات تماس شما فقط برای ورود و هماهنگی سفر استفاده می‌شود و بدون اجازه شما در اختیار دیگران قرار نمی‌گیرد. نمایش علاقه‌مندی‌ها و جزئیات پروفایل عمومی در تنظیمات پروفایل قابل کنترل است.",
  },
];

export function RulesPage() {
  useDocumentTitle("قوانین و مقررات");
  const { hash } = useLocation();
  useEffect(() => {
    if (hash)
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <div className="bg-[#f6f3ee] pb-16 dark:bg-[#0b1d18]">
      <HeroBanner
        image={wideImage}
        title="قوانین، مقررات و حریم خصوصی"
        subtitle="چارچوب‌های شفاف برای حفظ سلامت و امنیت همسفران عزیز در تمامی تورها."
        className="py-14"
      />
      <div className="mx-auto mt-10 grid max-w-page gap-6 px-4 sm:px-6 lg:grid-cols-[17rem_1fr] lg:px-8">
        <nav
          aria-label="فهرست قوانین"
          className="h-fit rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card lg:sticky lg:top-28 dark:border-white/10 dark:bg-[#12291f]"
        >
          <p className="px-2 pb-2 text-xs font-extrabold text-[#e8604c]">
            فهرست
          </p>
          <ul className="space-y-1">
            {RULES.map((r) => (
              <li key={r.id}>
                <Link
                  to={`#${r.id}`}
                  replace
                  className={`block rounded-xl px-3 py-2 text-sm font-bold transition hover:bg-[#fff1ee] hover:text-[#e8604c] ${hash === `#${r.id}` ? "bg-[#fff1ee] text-[#e8604c]" : "text-slate-600 dark:text-white/70"}`}
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="space-y-8 rounded-3xl border border-slate-200/80 bg-white p-7 shadow-card sm:p-10 dark:border-white/10 dark:bg-[#12291f]">
          {RULES.map((r) => (
            <section
              key={r.id}
              id={r.id}
              className="scroll-mt-28"
              aria-labelledby={`rule-${r.id}`}
            >
              <h2
                id={`rule-${r.id}`}
                className="text-base font-black text-slate-900 dark:text-white"
              >
                {r.title}
              </h2>
              <p className="mt-2 text-sm leading-8 text-slate-600 dark:text-white/70">
                {r.text}
              </p>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
