import { describe, expect, it } from "vitest";
import {
  EMPTY_DRAFT,
  draftReducer,
  firstInvalidStep,
  parseStoredDraft,
  serializeDraft,
  toCreateBody,
  validateStep,
  type TourDraft,
} from "./tour-draft";

const TODAY = "2026-11-11";

const valid: TourDraft = {
  ...EMPTY_DRAFT,
  title: "آخر هفته در جنگل ابر",
  destination: "جنگل ابر",
  province: "سمنان",
  categories: ["nature"],
  difficulty: "easy",
  description: "دو روز پیاده‌روی در جنگل ابر و تماشای دریای ابر هنگام طلوع.",
  startDate: "2026-11-20",
  durationDays: 2,
  capacity: 12,
  minParticipants: 6,
  priceToman: 2_500_000,
};

describe("planner validation", () => {
  it("requires name, description, destination, difficulty and travel style", () => {
    const e = validateStep(0, EMPTY_DRAFT, TODAY);
    expect(Object.keys(e).sort()).toEqual([
      "categories",
      "description",
      "destination",
      "difficulty",
      "province",
      "title",
    ]);
  });

  it("rejects names without letters", () => {
    expect(
      validateStep(0, { ...valid, title: "12345" }, TODAY).title,
    ).toBeDefined();
  });

  it("requires a start date after today and within a year", () => {
    expect(
      validateStep(1, { ...valid, startDate: "" }, TODAY).startDate,
    ).toBeDefined();
    expect(
      validateStep(1, { ...valid, startDate: TODAY }, TODAY).startDate,
    ).toBeDefined();
    expect(
      validateStep(1, { ...valid, startDate: "2028-01-01" }, TODAY).startDate,
    ).toBeDefined();
    expect(validateStep(1, valid, TODAY).startDate).toBeUndefined();
  });

  it("never lets the quorum exceed capacity", () => {
    const e = validateStep(
      1,
      { ...valid, capacity: 8, minParticipants: 9 },
      TODAY,
    );
    expect(e.minParticipants).toContain("ظرفیت");
    expect(
      validateStep(1, { ...valid, capacity: 8, minParticipants: 8 }, TODAY)
        .minParticipants,
    ).toBeUndefined();
  });

  it("requires a positive budget", () => {
    expect(
      validateStep(1, { ...valid, priceToman: null }, TODAY).priceToman,
    ).toBeDefined();
    expect(
      validateStep(1, { ...valid, priceToman: 0 }, TODAY).priceToman,
    ).toBeDefined();
  });

  it("validates itinerary items of every day", () => {
    let d = draftReducer(valid, { type: "addItem", day: 2 });
    expect(firstInvalidStep(d, TODAY).step).toBe(2);
    const key = d.days[2]?.items[0]?.key ?? "";
    d = draftReducer(d, {
      type: "updateItem",
      day: 2,
      key,
      patch: { title: "برپایی کمپ" },
    });
    expect(firstInvalidStep(d, TODAY).step).toBe(-1);
  });

  it("maps the draft to the API body with one entry per day", () => {
    const body = toCreateBody(valid, false);
    expect(body.submit).toBe(false);
    expect(body.itinerary.map((x) => x.dayNumber)).toEqual([1, 2]);
  });
});

describe("local draft storage", () => {
  it("round-trips a draft", () => {
    const raw = serializeDraft(
      valid,
      1,
      null,
      new Date("2026-11-11T08:00:00Z"),
    );
    const parsed = parseStoredDraft(raw);
    expect(parsed?.draft).toEqual(valid);
    expect(parsed?.step).toBe(1);
  });

  it("ignores corrupted or foreign data", () => {
    expect(parseStoredDraft("{oops")).toBeNull();
    expect(parseStoredDraft(JSON.stringify({ version: 2 }))).toBeNull();
    expect(parseStoredDraft(null)).toBeNull();
  });
});
