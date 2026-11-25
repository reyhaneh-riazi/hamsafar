import { describe, expect, it } from "vitest";
import { ImageError, validateImage } from "./image";

const file = (name: string, type: string, bytes: number) =>
  new File([new Uint8Array(bytes)], name, { type });
const reason = (f: File) => {
  try {
    validateImage(f);
    return null;
  } catch (e) {
    return e instanceof ImageError ? e.message : "other";
  }
};

describe("validateImage", () => {
  it("accepts common photo formats", () => {
    expect(reason(file("a.jpg", "image/jpeg", 2000))).toBeNull();
    expect(reason(file("b.HEIC", "", 2000))).toBeNull();
  });
  it("rejects other file types", () => {
    expect(reason(file("doc.pdf", "application/pdf", 2000))).toContain("فرمت");
    expect(reason(file("x.svg", "image/svg+xml", 2000))).toContain("فرمت");
  });
  it("rejects empty and oversized files", () => {
    expect(reason(file("a.png", "image/png", 0))).toContain("خالی");
    expect(reason(file("a.png", "image/png", 11 * 1024 * 1024))).toContain(
      "حداکثر",
    );
  });
});
