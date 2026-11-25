const FA = "۰۱۲۳۴۵۶۷۸۹";
const AR = "٠١٢٣٤٥٦٧٨٩";

/** Converts Persian and Arabic-Indic digits to ASCII digits. */
export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
}

export function toFaDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => FA[Number(d)] ?? d);
}
