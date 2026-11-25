import { toLatinDigits } from "./digits";

export const MOBILE_PATTERN = /^09[0-9]{9}$/;

/**
 * Normalises user input to the canonical 09xxxxxxxxx form.
 * Accepts Persian/Arabic digits, spaces, dashes and the +98 / 0098 / 98 prefixes.
 * Blank input stays blank (it must fail validation, never become a sample number).
 */
export function normalizeMobile(input: string): string {
  let value = toLatinDigits(input).replace(/[\s\-()]/g, "");
  if (value.startsWith("+98")) value = `0${value.slice(3)}`;
  else if (value.startsWith("0098")) value = `0${value.slice(4)}`;
  else if (value.startsWith("98") && value.length === 12)
    value = `0${value.slice(2)}`;
  else if (value.startsWith("9") && value.length === 10) value = `0${value}`;
  return value;
}

export function isValidMobile(input: string): boolean {
  return MOBILE_PATTERN.test(normalizeMobile(input));
}

/** 09123456789 -> 0912 345 6789 (for display only) */
export function formatMobile(mobile: string): string {
  const m = normalizeMobile(mobile);
  if (!MOBILE_PATTERN.test(m)) return m;
  return `${m.slice(0, 4)} ${m.slice(4, 7)} ${m.slice(7)}`;
}
