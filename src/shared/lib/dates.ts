/**
 * Helpers for date-only values ("YYYY-MM-DD"). They are calendar days, not instants, so all
 * arithmetic happens at noon UTC where no timezone offset can move the day.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function atNoonUtc(isoDate: string): Date {
  return new Date(`${isoDate.slice(0, 10)}T12:00:00Z`);
}

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = atNoonUtc(value);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Today's calendar date in the user's own timezone. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(isoDate: string, days: number): string {
  const d = atNoonUtc(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (atNoonUtc(to).getTime() - atNoonUtc(from).getTime()) / 86_400_000,
  );
}

export type DayState = "past" | "today" | "upcoming";

export function dayState(
  isoDate: string,
  today: string = todayIso(),
): DayState {
  if (isoDate === today) return "today";
  return isoDate < today ? "past" : "upcoming";
}
