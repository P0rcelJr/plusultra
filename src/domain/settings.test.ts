import { describe, expect, it } from "vitest";
import { windowFitsHorizon } from "./settings";

describe("windowFitsHorizon", () => {
  it("accepts a window up to the full horizon", () => {
    expect(windowFitsHorizon({ bookingWindowDays: 7, materializeHorizonWeeks: 4 })).toBe(true);
    expect(windowFitsHorizon({ bookingWindowDays: 28, materializeHorizonWeeks: 4 })).toBe(true);
  });

  it("rejects a window that reaches past the horizon", () => {
    expect(windowFitsHorizon({ bookingWindowDays: 29, materializeHorizonWeeks: 4 })).toBe(false);
    expect(windowFitsHorizon({ bookingWindowDays: 8, materializeHorizonWeeks: 1 })).toBe(false);
  });
});
