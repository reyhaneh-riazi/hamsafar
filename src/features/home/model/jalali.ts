import { toFaDigits } from "@/shared/lib/digits";

/**
 * Small Jalali (Solar Hijri) helpers for the home-page date picker and tour cards.
 * Every Date here is a calendar day pinned to 12:00 UTC, so no timezone can move it to another day.
 */

const DAY_MS = 86_400_000;

const partsFormat = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
});
const monthNameFormat = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  month: "long",
  timeZone: "UTC",
});

export interface JalaliParts {
  year: number;
  month: number;
  day: number;
}

export function jalaliParts(date: Date): JalaliParts {
  const parts = partsFormat.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: pick("year"), month: pick("month"), day: pick("day") };
}

/** Today (in the visitor's local calendar) as a noon-UTC day. */
export function today(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12),
  );
}

export function fromIsoDate(isoDate: string): Date {
  return new Date(`${isoDate.slice(0, 10)}T12:00:00Z`);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

export function isSameDay(a: Date | null, b: Date | null): boolean {
  return Boolean(a && b && daysBetween(a, b) === 0);
}

export function startOfJalaliMonth(date: Date): Date {
  return addDays(date, 1 - jalaliParts(date).day);
}

/** First day of the Jalali month `offset` months after the month containing `date`. */
export function shiftJalaliMonth(date: Date, offset: number): Date {
  let first = startOfJalaliMonth(date);
  for (let i = 0; i < Math.abs(offset); i++) {
    first =
      offset > 0
        ? startOfJalaliMonth(addDays(first, 32))
        : startOfJalaliMonth(addDays(first, -1));
  }
  return first;
}

/** All days of the Jalali month that starts at `first`. */
export function monthDays(first: Date): Date[] {
  const { month } = jalaliParts(first);
  const days: Date[] = [];
  for (let d = first; jalaliParts(d).month === month; d = addDays(d, 1))
    days.push(d);
  return days;
}

/** Column in a Saturday-first week (0 = شنبه … 6 = جمعه). */
export function weekColumn(date: Date): number {
  return (date.getUTCDay() + 1) % 7;
}

export function monthName(date: Date): string {
  return monthNameFormat.format(date);
}

/** «مهر ۱۴۰۵» */
export function monthLabel(date: Date): string {
  return `${monthName(date)} ${toFaDigits(jalaliParts(date).year)}`;
}

/** «۲۹ مهر ۱۴۰۵» */
export function dayLabel(date: Date): string {
  const { day, year } = jalaliParts(date);
  return `${toFaDigits(day)} ${monthName(date)} ${toFaDigits(year)}`;
}

export function seasonOf(date: Date): string {
  const { month } = jalaliParts(date);
  if (month <= 3) return "بهار";
  if (month <= 6) return "تابستان";
  if (month <= 9) return "پاییز";
  return "زمستان";
}

export function jalaliYear(date: Date = today()): number {
  return jalaliParts(date).year;
}

/** Tour card dates: «۱۱ تا ۱۳ شهریور» or «۲۸ مرداد تا ۲ شهریور». */
export function shortDateRange(startIso: string, endIso: string): string {
  const start = fromIsoDate(startIso);
  const end = fromIsoDate(endIso);
  const s = jalaliParts(start);
  const e = jalaliParts(end);
  if (s.month === e.month && s.year === e.year)
    return `${toFaDigits(s.day)} تا ${toFaDigits(e.day)} ${monthName(end)}`;
  return `${toFaDigits(s.day)} ${monthName(start)} تا ${toFaDigits(e.day)} ${monthName(end)}`;
}
