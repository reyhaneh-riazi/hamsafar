import { CalendarCheck2, Eye, Leaf, ShieldCheck, Workflow } from "lucide-react";
import hikerImage from "@/assets/images/inspire-hiker.webp";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { ButtonLink } from "@/shared/ui/Button";
import { HeroBanner } from "@/shared/ui/HeroBanner";
import { JourneyAnimation } from "./JourneyAnimation";

/* Figma About (129:3243 light / 213:2738 dark / 217:5029 mobile). */
const GOALS = [
  {
    icon: Eye,
    title: "برنامه شفاف",
    text: "هر فعالیت، هزینه و تغییر در دسترس اعضاست.",
  },
  {
    icon: Workflow,
    title: "ابزار یکپارچه",
    text: "از حد نصاب و چت تا هزینه و آلبوم تصاویر.",
  },
  {
    icon: CalendarCheck2,
    title: "ثبت و پیگیری",
    text: "تصمیم‌ها و گزارش‌ها گم نمی‌شوند.",
  },
];

const VALUES = [
  {
    icon: Eye,
    tone: "bg-emerald-50 text-emerald-600",
    title: "شفافیت بی‌قیدوشرط",
    text: "برنامه‌ها، هزینه‌ها، مشخصات اقامتگاه‌ها و سوابق افراد برای همه واضح و در دسترس است.",
  },
  {
    icon: Leaf,
    tone: "bg-emerald-50 text-emerald-600",
    title: "احترام به بومیان و محیط‌زیست",
    text: "ما در سفرهایمان کمترین ردپا را در طبیعت به‌جا می‌گذاریم و از اقتصاد جوامع محلی حمایت می‌کنیم.",
  },
  {
    icon: ShieldCheck,
    tone: "bg-amber-50 text-amber-600",
    title: "امنیت و اصالت هویت",
    text: "تأیید مدارک برگزارکنندگان و سیستم امتیازدهی پس از سفر تضمین‌کننده آرامش همسفران است.",
  },
];

const TEAM = [
  {
    initial: "س",
    tone: "bg-emerald-50 text-emerald-700",
    role: "طراح تجربه محصول",
    text: "پژوهش، معماری اطلاعات و طراحی رابط",
  },
  {
    initial: "ر",
    tone: "bg-amber-50 text-amber-700",
    role: "توسعه محصول",
    text: "پیاده‌سازی، معماری و کیفیت نرم‌افزار",
  },
  {
    initial: "م",
    tone: "bg-sky-50 text-sky-700",
    role: "جامعه و عملیات",
    text: "اعتماد، محتوا و پشتیبانی سفرها",
  },
];

function Heading({
  kicker,
  title,
  text,
  id,
}: {
  kicker: string;
  title: string;
  text?: string;
  id: string;
}) {
  return (
    <div className="text-center">
      <p className="text-xs font-bold text-[#e8604c]">{kicker}</p>
      <h2
        id={id}
        className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl dark:text-white"
      >
        {title}
      </h2>
      {text && (
        <p className="mt-2 text-sm text-slate-500 dark:text-ink-muted">
          {text}
        </p>
      )}
    </div>
  );
}

export function AboutPage() {
  useDocumentTitle("درباره ما");
  return (
    <div className="bg-[#f6f3ee] pb-16 dark:bg-canvas">
      <HeroBanner
        image={hikerImage}
        pill="داستان همسفر"
        title="سفر وقتی بهتر است که تنها نباشد"
        subtitle="همسفر از یک مسئله ساده شروع شد: آدم مناسب برای سفر کجاست و چطور می‌شود قبل از حرکت به برنامه و گروه اعتماد کرد؟"
        className="py-20 sm:py-24"
      />

      <section
        className="mx-auto max-w-page px-4 pt-14 sm:px-6 lg:px-8"
        aria-labelledby="why-title"
      >
        <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-xs font-bold text-[#e8604c]">چرا همسفر؟</p>
            <h2
              id="why-title"
              className="mt-2 text-2xl font-black leading-[1.5] text-slate-900 sm:text-3xl dark:text-white"
            >
              برای سفرهایی منظم‌تر، امن‌تر و انسانی‌تر
            </h2>
            <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-ink-muted">
              در بسیاری از سفرهای گروهی، برنامه‌ها میان پیام‌ها گم می‌شوند، حد
              نصاب روشن نیست و شناختی از همسفران وجود ندارد. ما همه این بخش‌ها
              را در یک تجربه یکپارچه جمع کرده‌ایم: از ساخت پروفایل و جست‌وجوی
              تور تا برنامه روزانه، رأی‌گیری، هزینه‌ها و نظر بعد از سفر.
            </p>
            <p className="mt-3 text-sm leading-8 text-slate-600 dark:text-ink-muted">
              هدف ما جایگزین کردن ارتباط انسانی نیست؛ هدف این است که ابزارهای
              درست، فرصت آشنایی و اعتماد را ساده‌تر کنند.
            </p>
            <ButtonLink to="/tours" className="mt-6 bg-[#e8604c]">
              اولین سفر را پیدا کن
            </ButtonLink>
          </div>
          <aside
            className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-line dark:bg-surface"
            aria-labelledby="goals-title"
          >
            <h3
              id="goals-title"
              className="border-b border-slate-100 pb-4 text-center text-base font-black text-slate-900 dark:border-line dark:text-white"
            >
              آنچه برایش تلاش می‌کنیم
            </h3>
            <ul className="mt-4 space-y-3">
              {GOALS.map(({ icon: Icon, title, text }) => (
                <li
                  key={title}
                  className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-surface-muted"
                >
                  <Icon
                    className="mt-0.5 size-5 shrink-0 text-forest-600 dark:text-forest-300"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block text-sm font-black text-slate-900 dark:text-white">
                      {title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-6 text-slate-500 dark:text-ink-muted">
                      {text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section
        className="mx-auto mt-16 max-w-page border-t border-slate-200 px-4 pt-14 sm:px-6 lg:px-8 dark:border-line"
        aria-labelledby="values-title"
      >
        <Heading
          id="values-title"
          kicker="ارزش‌های ما"
          title="چه چیزی مسیر ما را می‌سازد؟"
          text="اصولی که هر روز برای ساخت تجربه‌ای امن‌تر و انسانی‌تر دنبال می‌کنیم."
        />
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {VALUES.map(({ icon: Icon, tone, title, text }) => (
            <li
              key={title}
              className="rounded-3xl border border-slate-200/80 bg-white p-7 text-center shadow-card dark:border-line dark:bg-surface"
            >
              <span
                className={`mx-auto flex size-12 items-center justify-center rounded-2xl ${tone} dark:bg-white/10`}
              >
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-ink-muted">
                {text}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="mx-auto mt-16 max-w-page px-4 sm:px-6 lg:px-8"
        aria-label="مسیر یک سفر در همسفر"
        id="journey"
      >
        <JourneyAnimation />
      </section>

      <section
        className="mx-auto mt-16 max-w-page border-t border-slate-200 px-4 pt-14 sm:px-6 lg:px-8 dark:border-line"
        aria-labelledby="team-title"
        id="stories"
      >
        <Heading
          id="team-title"
          kicker="تیم پروژه"
          title="Frog Software"
          text="تیمی متعهد به تجربه کاربری روان، زیرساخت امن و گردشگری مسئولانه"
        />
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {TEAM.map((m) => (
            <li
              key={m.role}
              className="rounded-3xl border border-slate-200/80 bg-white p-7 text-center shadow-card dark:border-line dark:bg-surface"
            >
              <span
                className={`mx-auto flex size-14 items-center justify-center rounded-full text-xl font-black ${m.tone} dark:bg-white/10`}
              >
                {m.initial}
              </span>
              <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">
                {m.role}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-ink-muted">
                {m.text}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
