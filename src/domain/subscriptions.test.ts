import { describe, expect, it } from "vitest";
import { planChangeEffects, subscriptionCovering, subscriptionCovers } from "./subscriptions";
import { fromDateKey } from "./time";

const d = (key: string) => fromDateKey(key) as Date;

describe("subscriptionCovers", () => {
  it("includes the start day and excludes the end day", () => {
    const sub = { startsOn: d("2026-10-01"), endsOn: d("2026-11-01") };
    expect(subscriptionCovers(sub, d("2026-09-30"))).toBe(false);
    expect(subscriptionCovers(sub, d("2026-10-01"))).toBe(true);
    expect(subscriptionCovers(sub, d("2026-10-31"))).toBe(true);
    expect(subscriptionCovers(sub, d("2026-11-01"))).toBe(false);
  });

  it("treats a null end as open-ended", () => {
    const sub = { startsOn: d("2026-10-01"), endsOn: null };
    expect(subscriptionCovers(sub, d("2030-01-01"))).toBe(true);
  });
});

describe("subscriptionCovering", () => {
  const rows = [
    { id: "a", startsOn: d("2026-01-01"), endsOn: d("2026-03-01") },
    { id: "b", startsOn: d("2026-04-01"), endsOn: null },
  ];

  it("returns the row covering the day", () => {
    expect(subscriptionCovering(rows, d("2026-02-10"))?.id).toBe("a");
    expect(subscriptionCovering(rows, d("2026-05-10"))?.id).toBe("b");
  });

  it("returns undefined inside a gap (a pause) or before any row", () => {
    expect(subscriptionCovering(rows, d("2026-03-15"))).toBeUndefined();
    expect(subscriptionCovering(rows, d("2025-12-31"))).toBeUndefined();
    expect(subscriptionCovering([], d("2026-01-01"))).toBeUndefined();
  });
});

describe("planChangeEffects", () => {
  it("closes the running row and removes rows that had not started", () => {
    const rows = [
      { id: "past", startsOn: d("2025-01-01"), endsOn: d("2025-06-01") },
      { id: "current", startsOn: d("2026-01-01"), endsOn: null },
      { id: "future", startsOn: d("2026-12-01"), endsOn: null },
    ];
    const { close, remove } = planChangeEffects(rows, d("2026-10-10"));
    expect(close.map((r) => r.id)).toEqual(["current"]);
    expect(remove.map((r) => r.id)).toEqual(["future"]);
  });

  it("leaves rows that already ended before the new start untouched", () => {
    const rows = [{ id: "ended", startsOn: d("2026-01-01"), endsOn: d("2026-10-10") }];
    const { close, remove } = planChangeEffects(rows, d("2026-10-10"));
    expect(close).toEqual([]);
    expect(remove).toEqual([]);
  });
});
