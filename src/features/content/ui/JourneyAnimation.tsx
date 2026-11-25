import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Images,
  Search,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";

interface Step {
  icon: LucideIcon;
  title: string;
  text: string;
}

const STEPS: Step[] = [
  {
    icon: Search,
    title: "همسفریابی",
    text: "تور مناسب را با جست‌وجوی توصیفی پیدا کن یا تور خودت را بساز و همسفر جمع کن.",
  },
  {
    icon: UsersRound,
    title: "حد نصاب",
    text: "با رسیدن اعضای تأییدشده به حد نصاب، تور قطعی و گفت‌وگوی گروه باز می‌شود.",
  },
  {
    icon: CalendarDays,
    title: "برنامه روزانه",
    text: "تورلیدر برنامه را روز به روز می‌چیند؛ اعضا نظر می‌دهند و هر تغییر ثبت می‌شود.",
  },
  {
    icon: Wallet,
    title: "دنگ و تسویه",
    text: "هزینه‌های مشترک ثبت و سهم هر نفر خودکار حساب و پرداخت می‌شود.",
  },
  {
    icon: Images,
    title: "خاطره و آلبوم",
    text: "عکس‌ها در آلبوم مشترک می‌مانند و بعد از سفر به همسفرها امتیاز می‌دهید.",
  },
];

/** Stations sit on a wave from right to left (RTL reading order); x/y in the 1000×200 viewBox. */
const STATIONS = STEPS.map((_, i) => ({
  x: 900 - i * 200,
  y: i % 2 === 0 ? 140 : 60,
}));
const PATH =
  "M900,140 C800,140 800,60 700,60 S600,140 500,140 S400,60 300,60 S200,140 100,140";
const TRAVEL_MS = 11000;
const HOLD_MS = 1800;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * "مسیر یک سفر در همسفر": a paper plane flies along a dashed route, lighting up the five stages of a trip.
 * Pauses off-screen / in background tabs; static (all stages lit) under prefers-reduced-motion.
 */
export function JourneyAnimation() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(() =>
    prefersReducedMotion() ? STEPS.length - 1 : 0,
  );
  const offsetRef = useRef(0); // ms into the cycle
  const [reduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const path = pathRef.current;
    if (!path || typeof path.getTotalLength !== "function") return;
    const len = path.getTotalLength();
    const paint = (p: number) => {
      const pt = path.getPointAtLength(p * len);
      const ahead = path.getPointAtLength(Math.min(len, p * len + 1));
      const behind = path.getPointAtLength(Math.max(0, p * len - 1));
      const angle =
        (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
      planeRef.current?.setAttribute(
        "transform",
        `translate(${pt.x} ${pt.y}) rotate(${angle})`,
      );
      if (trailRef.current) {
        trailRef.current.style.strokeDasharray = `${len}`;
        trailRef.current.style.strokeDashoffset = `${len * (1 - p)}`;
      }
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${p})`;
      const idx = Math.min(
        STEPS.length - 1,
        Math.floor(p * (STEPS.length - 1) + 0.02),
      );
      setActive((cur) => (cur === idx ? cur : idx));
    };
    if (reduced) {
      paint(1);
      return;
    }

    let raf = 0;
    let last = performance.now();
    let visible = true;
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (visible && !document.hidden)
        offsetRef.current = (offsetRef.current + dt) % (TRAVEL_MS + HOLD_MS);
      const p = Math.min(1, offsetRef.current / TRAVEL_MS);
      // ease-in-out so the plane lingers a little near each end
      paint(p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const io =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(([e]) => (visible = !!e?.isIntersecting))
        : null;
    if (io && rootRef.current) io.observe(rootRef.current);
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [reduced]);

  const jump = (i: number) => {
    offsetRef.current = (i / (STEPS.length - 1)) * TRAVEL_MS;
    setActive(i);
  };

  return (
    <div
      ref={rootRef}
      className="relative overflow-hidden rounded-panel border border-line bg-gradient-to-b from-tint-mint/70 to-surface p-5 shadow-card sm:p-8"
    >
      {/* soft drifting clouds */}
      <span
        aria-hidden="true"
        className="journey-cloud pointer-events-none absolute top-6 size-24 rounded-full bg-white/60 blur-2xl dark:bg-white/5"
      />
      <span
        aria-hidden="true"
        className="journey-cloud pointer-events-none absolute top-24 size-16 rounded-full bg-white/50 blur-xl [animation-delay:-9s] [animation-duration:26s] dark:bg-white/5"
      />

      {/* Desktop / tablet: wave route */}
      <div className="relative hidden md:block">
        <div className="relative aspect-[5/1]">
          <svg
            viewBox="0 0 1000 200"
            className="absolute inset-0 size-full overflow-visible"
            aria-hidden="true"
          >
            <path
              ref={pathRef}
              d={PATH}
              fill="none"
              className="stroke-forest-200 dark:stroke-line"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="2 12"
            />
            <path
              d={PATH}
              fill="none"
              className="journey-dash stroke-forest-300/60 dark:stroke-forest-700"
              strokeWidth="1.5"
              strokeDasharray="10 14"
            />
            <path
              ref={trailRef}
              d={PATH}
              fill="none"
              className="stroke-coral-400"
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{ strokeDasharray: 2000, strokeDashoffset: 2000 }}
            />
            <g
              ref={planeRef}
              transform={`translate(${STATIONS[0]?.x ?? 0} ${STATIONS[0]?.y ?? 0})`}
              className={cn(reduced && "hidden")}
            >
              <circle r="20" className="fill-coral-400/15" />
              <path
                d="M15,0 L-11,-10 L-5,0 L-11,10 Z"
                className="fill-coral-500"
              />
              <path d="M15,0 L-5,0 L-11,10 Z" className="fill-coral-600" />
            </g>
          </svg>
          {STATIONS.map((s, i) => {
            const step = STEPS[i];
            if (!step) return null;
            const Icon = step.icon;

            const on = i <= active;
            return (
              <button
                key={i}
                type="button"
                onClick={() => jump(i)}
                aria-label={`مرحله ${toFaDigits(i + 1)}: ${step.title}`}
                aria-current={i === active ? "step" : undefined}
                style={{ left: `${s.x / 10}%`, top: `${s.y / 2}%` }}
                className={cn(
                  "absolute flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 transition-all duration-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral-300",
                  on
                    ? "border-surface bg-forest-700 text-white shadow-lg dark:bg-forest-500"
                    : "border-surface bg-surface-muted text-ink-soft",
                  i === active && "scale-110 ring-4 ring-coral-300/50",
                )}
              >
                <Icon className="size-6" aria-hidden="true" />
                {i === active && !reduced && (
                  <span
                    className="absolute inset-0 animate-ping rounded-full bg-coral-400/25"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
        <ol className="mt-6 grid grid-cols-5 gap-4">
          {STEPS.map((st, i) => (
            <li
              key={st.title}
              className={cn(
                "rounded-2xl p-3 text-center transition-all duration-500",
                i === active ? "bg-surface shadow-card" : "opacity-60",
              )}
            >
              <p className="text-[11px] font-black text-coral-500">
                مرحله {toFaDigits(i + 1)}
              </p>
              <h3 className="mt-1 text-sm font-black text-forest-800 dark:text-white">
                {st.title}
              </h3>
              <p className="mt-1.5 text-xs leading-6 text-ink-muted">
                {st.text}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* Mobile: vertical timeline with a filling rail */}
      <ol className="relative space-y-4 md:hidden">
        <span
          aria-hidden="true"
          className="absolute inset-y-6 start-[26px] w-1 rounded-full bg-forest-100 dark:bg-line"
        />
        <span
          ref={fillRef}
          aria-hidden="true"
          className="absolute inset-y-6 start-[26px] w-1 origin-top rounded-full bg-coral-400"
          style={{ transform: "scaleY(0)" }}
        />
        {STEPS.map((st, i) => {
          const Icon = st.icon;
          const on = i <= active;
          return (
            <li key={st.title} className="relative flex gap-4">
              <span
                className={cn(
                  "relative z-[1] flex size-14 shrink-0 items-center justify-center rounded-full border-4 border-surface transition-all duration-500",
                  on
                    ? "bg-forest-700 text-white dark:bg-forest-500"
                    : "bg-surface-muted text-ink-soft",
                  i === active && "scale-105 ring-4 ring-coral-300/50",
                )}
              >
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <div
                className={cn(
                  "flex-1 rounded-2xl p-3 transition-all duration-500",
                  i === active ? "bg-surface shadow-card" : "opacity-70",
                )}
              >
                <p className="text-[11px] font-black text-coral-500">
                  مرحله {toFaDigits(i + 1)}
                </p>
                <h3 className="text-sm font-black text-forest-800 dark:text-white">
                  {st.title}
                </h3>
                <p className="mt-1 text-xs leading-6 text-ink-muted">
                  {st.text}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
