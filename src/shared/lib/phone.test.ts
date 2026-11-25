import { describe, expect, it } from "vitest";
import { formatMobile, isValidMobile, normalizeMobile } from "./phone";

describe("mobile number normalisation", () => {
  it("accepts Persian and Arabic digits", () => {
    expect(normalizeMobile("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
    expect(normalizeMobile("٠٩١٢٣٤٥٦٧٨٩")).toBe("09123456789");
  });

  it("converts international prefixes and strips separators", () => {
    expect(normalizeMobile("+98 912 345 6789")).toBe("09123456789");
    expect(normalizeMobile("0098-912-345-6789")).toBe("09123456789");
    expect(normalizeMobile("9123456789")).toBe("09123456789");
  });

  it("keeps blank input blank so it fails validation", () => {
    expect(normalizeMobile("")).toBe("");
    expect(isValidMobile("")).toBe(false);
  });

  it("validates against ^09[0-9]{9}$", () => {
    expect(isValidMobile("09123456789")).toBe(true);
    expect(isValidMobile("0912345678")).toBe(false);
    expect(isValidMobile("08123456789")).toBe(false);
  });

  it("formats for display only", () => {
    expect(formatMobile("09123456789")).toBe("0912 345 6789");
  });
});
