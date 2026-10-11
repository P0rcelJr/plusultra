import { describe, expect, it } from "vitest";
import { ageOn, dateKeyFor, fromDateKey, gymToday, toDateKey, weekBoundsFor } from "./time";

describe("weekBoundsFor", () => {
  it("starts the week on Monday 00:00 in Montevideo, not in UTC", () => {
    // Sunday 2026-10-11 23:30 in Montevideo (UTC-3) is already Monday 02:30 in UTC.
    const sundayNightLocal = new Date("2026-10-12T02:30:00Z");
    const { start, end } = weekBoundsFor(sundayNightLocal);
    expect(start.toISOString()).toBe("2026-10-05T03:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-12T03:00:00.000Z");
  });

  it("treats Monday 00:00 local as the first instant of the new week", () => {
    const mondayMidnightLocal = new Date("2026-10-12T03:00:00Z");
    const { start } = weekBoundsFor(mondayMidnightLocal);
    expect(start.toISOString()).toBe("2026-10-12T03:00:00.000Z");
  });

  it("returns a half-open interval of exactly seven days", () => {
    const { start, end } = weekBoundsFor(new Date("2026-10-14T15:00:00Z"));
    expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("dateKeyFor", () => {
  it("uses the gym-local calendar day, which lags UTC late at night", () => {
    expect(dateKeyFor(new Date("2026-10-12T02:30:00Z"))).toBe("2026-10-11");
    expect(dateKeyFor(new Date("2026-10-12T03:00:00Z"))).toBe("2026-10-12");
  });
});

describe("fromDateKey / toDateKey", () => {
  it("round-trips a calendar date through the 00:00 UTC representation", () => {
    const date = fromDateKey("2026-02-28");
    expect(date?.toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(toDateKey(date as Date)).toBe("2026-02-28");
  });

  it("rejects malformed and overflowing keys", () => {
    expect(fromDateKey("28/02/2026")).toBeNull();
    expect(fromDateKey("2026-02-31")).toBeNull();
    expect(fromDateKey("")).toBeNull();
  });
});

describe("gymToday", () => {
  it("is the DATE form of the gym-local day", () => {
    expect(gymToday(new Date("2026-10-12T02:30:00Z")).toISOString()).toBe("2026-10-11T00:00:00.000Z");
  });
});

describe("ageOn", () => {
  const dob = fromDateKey("2000-06-15") as Date;
  it("counts whole years and respects the birthday", () => {
    expect(ageOn(dob, fromDateKey("2026-06-14") as Date)).toBe(25);
    expect(ageOn(dob, fromDateKey("2026-06-15") as Date)).toBe(26);
    expect(ageOn(dob, fromDateKey("2026-10-10") as Date)).toBe(26);
  });
});
