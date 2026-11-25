import { describe, expect, it } from "vitest";
import { addDays, dayState, daysBetween, isIsoDate, todayIso } from "./dates";

describe("date-only helpers", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts whole days", () => {
    expect(daysBetween("2026-11-10", "2026-11-14")).toBe(4);
    expect(daysBetween("2026-11-14", "2026-11-10")).toBe(-4);
  });

  it("rejects impossible dates", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-2-3")).toBe(false);
    expect(isIsoDate("2026-11-14")).toBe(true);
  });

  it("classifies a day relative to today", () => {
    expect(dayState("2026-11-10", "2026-11-11")).toBe("past");
    expect(dayState("2026-11-11", "2026-11-11")).toBe("today");
    expect(dayState("2026-11-12", "2026-11-11")).toBe("upcoming");
  });

  it("uses the local calendar day", () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});
