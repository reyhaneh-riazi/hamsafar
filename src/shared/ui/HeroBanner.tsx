import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface HeroBannerProps {
  image: string;
  title: string;
  subtitle?: string;
  /** Small pill above the title (Figma: «داستان همسفر», «پشتیبانی ۲۴/۷...»). */
  pill?: string;
  /** Red kicker line above the title (Figma tours banner). */
  kicker?: string;
  children?: ReactNode;
  className?: string;
}

/** Photo banner used at the top of inner pages in Figma (about, contact, rules, tours). */
export function HeroBanner({
  image,
  title,
  subtitle,
  pill,
  kicker,
  children,
  className,
}: HeroBannerProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-[#1c3c34] px-4 text-center",
        className ?? "py-16 sm:py-20",
      )}
    >
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(15,35,30,0.7)] via-[rgba(10,25,20,0.55)] to-[rgba(15,35,30,0.85)]" />
      <div className="relative mx-auto max-w-3xl">
        {pill && (
          <p className="inline-flex rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-800">
            {pill}
          </p>
        )}
        {kicker && <p className="text-xs font-bold text-[#e8604c]">{kicker}</p>}
        <h1 className="mt-3 text-3xl font-black leading-[1.35] text-white sm:text-[44px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
