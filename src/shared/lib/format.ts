import { toFaDigits } from "./digits";

const numberFormat = new Intl.NumberFormat("fa-IR");

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Amounts in the API are integer Toman (see docs/api-contract.md). */
export function formatToman(value: number): string {
  return `${formatNumber(value)} تومان`;
}

export function formatTomanShort(value: number): string {
  if (value >= 1_000_000) {
    const millions = Math.round((value / 1_000_000) * 10) / 10;
    return `${formatNumber(millions)} میلیون`;
  }
  return formatNumber(value);
}

export function formatDays(days: number): string {
  return `${toFaDigits(days)} روز`;
}

export function formatRating(value: number): string {
  return toFaDigits(value.toFixed(1));
}

/**
 * Date-only values ("2026-11-14") are calendar dates, not instants: format them at noon UTC
 * in the persian calendar so no timezone can shift the day.
 */
function dateOnly(isoDate: string): Date {
  return new Date(`${isoDate.slice(0, 10)}T12:00:00Z`);
}

const jalaliLong = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const jalaliShort = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const jalaliMonth = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  month: "long",
  timeZone: "UTC",
});
const dateTime = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(isoDate: string, withYear = true): string {
  if (!isoDate || isoDate.length < 10) return "—";
  try {
    const d = dateOnly(isoDate);
    if (isNaN(d.getTime())) return "—";
    return (withYear ? jalaliLong : jalaliShort).format(d);
  } catch {
    return "—";
  }
}

export function formatMonth(isoDate: string): string {
  if (!isoDate || isoDate.length < 7) return "—";
  try {
    const d = dateOnly(isoDate);
    if (isNaN(d.getTime())) return "—";
    return jalaliMonth.format(d);
  } catch {
    return "—";
  }
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start, false)} تا ${formatDate(end)}`;
}

/** Timestamps (ISO instants, e.g. lastActiveAt) in the user's local time. */
export function formatDateTime(isoInstant: string): string {
  if (!isoInstant) return "—";
  try {
    const d = new Date(isoInstant);
    if (isNaN(d.getTime())) return "—";
    return dateTime.format(d);
  } catch {
    return "—";
  }
}

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return toFaDigits(`${mm}:${ss}`);
}

const jalaliWeekday = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  weekday: "long",
  timeZone: "UTC",
});

/** "شنبه" for a date-only value. */
export function formatWeekday(isoDate: string): string {
  return jalaliWeekday.format(dateOnly(isoDate));
}

const jalaliDayOnly = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  timeZone: "UTC",
});

/** Compact range for cards: «۱۴ تا ۱۶ مرداد», or «۲۹ آبان تا ۲ آذر» across months. */
export function formatDateRangeShort(start: string, end: string): string {
  if (formatMonth(start) === formatMonth(end))
    return `${jalaliDayOnly.format(dateOnly(start))} تا ${formatDate(end, false)}`;
  return `${formatDate(start, false)} تا ${formatDate(end, false)}`;
}
