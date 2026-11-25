import type { MenuOption } from "@/shared/ui/OptionMenu";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "./labels";

/** Date windows offered in the quick search. Resolved to ISO dates at submit time. */
export const DATE_WINDOWS = [
  { value: "", label: "هر زمان" },
  { value: "7", label: "هفت روز آینده" },
  { value: "14", label: "دو هفته آینده" },
  { value: "30", label: "یک ماه آینده" },
  { value: "60", label: "دو ماه آینده" },
] as const satisfies readonly MenuOption[];

export const BUDGET_OPTIONS = [
  { value: "", label: "بدون محدودیت" },
  { value: "3000000", label: "تا ۳ میلیون تومان" },
  { value: "5000000", label: "تا ۵ میلیون تومان" },
  { value: "8000000", label: "تا ۸ میلیون تومان" },
  { value: "12000000", label: "تا ۱۲ میلیون تومان" },
] as const satisfies readonly MenuOption[];

export const CATEGORY_OPTIONS: readonly MenuOption[] = [
  { value: "", label: "همه سبک‌ها" },
  ...CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
];

export const SORT_OPTIONS = [
  { value: "relevance", label: "پیشنهاد همسفر" },
  { value: "soonest", label: "نزدیک‌ترین تاریخ" },
  { value: "newest", label: "تازه‌ترین" },
  { value: "spots", label: "بیشترین جای خالی" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
  { value: "rating", label: "بیشترین امتیاز" },
] as const satisfies readonly MenuOption[];

export function dateWindowToRange(days: string): {
  from?: string;
  to?: string;
} {
  const n = Number(days);
  if (!n) return {};
  const today = new Date();
  const from = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 12),
  );
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + n);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function labelOf(
  options: readonly MenuOption[],
  value: string,
): string | undefined {
  return options.find((o) => o.value === value)?.label;
}
