/** Joins truthy class names. Classes stay complete strings so Tailwind can discover them. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
