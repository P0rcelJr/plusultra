import { describe, expect, it } from "vitest";
import { weekBoundsFor } from "./time";

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
