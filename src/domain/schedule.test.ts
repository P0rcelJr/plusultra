import { describe, expect, it } from "vitest";
import { occurrencesFor, parseTimeOfDay, type WeeklyTemplate } from "./schedule";
import { fromDateKey } from "./time";

const day = (key: string) => fromDateKey(key) as Date;
const starts = (template: WeeklyTemplate, from: string, to: string) =>
  occurrencesFor(template, day(from), day(to)).map((o) => o.startsAt.toISOString());

const mondayAt19: WeeklyTemplate = {
  weekday: 1,
  startTime: "19:00",
  durationMinutes: 60,
  startsOn: day("2026-10-01"),
  endsOn: null,
};

describe("occurrencesFor", () => {
  it("places a 19:00 local class at 22:00Z and ends it after the duration", () => {
    const [occurrence] = occurrencesFor(mondayAt19, day("2026-10-12"), day("2026-10-13"));
    expect(occurrence.startsAt.toISOString()).toBe("2026-10-12T22:00:00.000Z");
    expect(occurrence.endsAt.toISOString()).toBe("2026-10-12T23:00:00.000Z");
  });

  it("yields one occurrence per week inside the half-open range", () => {
    // 2026-10-12 and 2026-11-02 are Mondays; the range ends before the second one.
    expect(starts(mondayAt19, "2026-10-12", "2026-11-02")).toEqual([
      "2026-10-12T22:00:00.000Z",
      "2026-10-19T22:00:00.000Z",
      "2026-10-26T22:00:00.000Z",
    ]);
  });

  it("skips the weekday that falls before a template starting mid-week", () => {
    // Starts Wednesday 2026-10-14, so Monday 2026-10-12 of that week is not included.
    const template = { ...mondayAt19, startsOn: day("2026-10-14") };
    expect(starts(template, "2026-10-12", "2026-10-27")).toEqual([
      "2026-10-19T22:00:00.000Z",
      "2026-10-26T22:00:00.000Z",
    ]);
  });

  it("includes the start day itself when it is the template's weekday", () => {
    const wednesday = { ...mondayAt19, weekday: 3, startsOn: day("2026-10-14") };
    expect(starts(wednesday, "2026-10-12", "2026-10-19")).toEqual(["2026-10-14T22:00:00.000Z"]);
  });

  it("stops before ends_on, which is exclusive like a subscription's", () => {
    const template = { ...mondayAt19, endsOn: day("2026-10-26") };
    expect(starts(template, "2026-10-12", "2026-11-30")).toEqual([
      "2026-10-12T22:00:00.000Z",
      "2026-10-19T22:00:00.000Z",
    ]);
  });

  it("is empty when the template ended before the range", () => {
    const template = { ...mondayAt19, endsOn: day("2026-10-05") };
    expect(starts(template, "2026-10-12", "2026-11-30")).toEqual([]);
  });

  it("keeps the local calendar day for a late class that is already tomorrow in UTC", () => {
    const sundayLate = { ...mondayAt19, weekday: 7, startTime: "22:30" };
    expect(starts(sundayLate, "2026-10-12", "2026-10-19")).toEqual(["2026-10-19T01:30:00.000Z"]);
  });
});

describe("parseTimeOfDay", () => {
  it("accepts 24-hour HH:MM and rejects anything else", () => {
    expect(parseTimeOfDay("07:05")).toEqual({ hours: 7, minutes: 5 });
    expect(parseTimeOfDay("23:59")).toEqual({ hours: 23, minutes: 59 });
    expect(parseTimeOfDay("24:00")).toBeNull();
    expect(parseTimeOfDay("7:05")).toBeNull();
    expect(parseTimeOfDay("19:00:00")).toBeNull();
  });
});
