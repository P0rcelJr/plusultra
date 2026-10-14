import { describe, expect, it } from "vitest";
import { canBook, cancelDeadline, cancellationStatus, withinBookingWindow, type CanBookInput } from "./booking";

const now = new Date("2026-10-12T12:00:00.000Z");
const settings = { bookingWindowDays: 7 };
const hours = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);

describe("withinBookingWindow", () => {
  it("refuses a session that already started", () => {
    expect(withinBookingWindow({ startsAt: now }, now, settings)).toBe(false);
    expect(withinBookingWindow({ startsAt: hours(-1) }, now, settings)).toBe(false);
  });

  it("accepts up to exactly the window length ahead", () => {
    expect(withinBookingWindow({ startsAt: hours(1) }, now, settings)).toBe(true);
    expect(withinBookingWindow({ startsAt: hours(7 * 24) }, now, settings)).toBe(true);
  });

  it("refuses a session 8 days out with a 7-day window", () => {
    expect(withinBookingWindow({ startsAt: hours(7 * 24 + 1) }, now, settings)).toBe(false);
    expect(withinBookingWindow({ startsAt: hours(8 * 24) }, now, settings)).toBe(false);
  });
});

describe("canBook", () => {
  const base: CanBookInput = {
    member: { status: "ACTIVE" },
    plan: { weeklyClassQuota: 3 },
    session: { startsAt: hours(24), status: "SCHEDULED", capacity: 2 },
    bookedCount: 0,
    alreadyBooked: false,
    now,
    settings,
  };

  it("allows an active member with a plan to book an open session", () => {
    expect(canBook(base)).toEqual({ ok: true });
  });

  it("refuses an inactive member", () => {
    expect(canBook({ ...base, member: { status: "INACTIVE" } })).toEqual({ ok: false, reason: "inactive" });
  });

  it("refuses a member without a plan, including a pending one (A1)", () => {
    expect(canBook({ ...base, plan: null })).toEqual({ ok: false, reason: "no_plan" });
    expect(canBook({ ...base, member: { status: "PENDING" }, plan: null })).toEqual({ ok: false, reason: "no_plan" });
  });

  it("refuses a cancelled session", () => {
    expect(canBook({ ...base, session: { ...base.session, status: "CANCELLED" } })).toEqual({
      ok: false,
      reason: "session_cancelled",
    });
  });

  it("refuses a second booking of the same session", () => {
    expect(canBook({ ...base, alreadyBooked: true })).toEqual({ ok: false, reason: "already_booked" });
  });

  it("refuses a session outside the booking window", () => {
    expect(canBook({ ...base, session: { ...base.session, startsAt: hours(8 * 24) } })).toEqual({
      ok: false,
      reason: "outside_window",
    });
  });

  it("refuses a full session", () => {
    expect(canBook({ ...base, bookedCount: 2 })).toEqual({ ok: false, reason: "full" });
  });

  it("treats the quota as unlimited for now", () => {
    expect(canBook({ ...base, plan: { weeklyClassQuota: 0 } })).toEqual({ ok: true });
  });
});

describe("cancellationStatus", () => {
  const session = { startsAt: hours(5) };
  const deadline = { cancelDeadlineHours: 2 };
  const fromDeadline = (ms: number) => new Date(hours(3).getTime() + ms);

  it("puts the deadline cancelDeadlineHours before the start", () => {
    expect(cancelDeadline(session, deadline)).toEqual(hours(3));
  });

  it("is a free cancel up to the millisecond before the deadline", () => {
    expect(cancellationStatus(session, now, deadline)).toBe("CANCELLED");
    expect(cancellationStatus(session, fromDeadline(-1), deadline)).toBe("CANCELLED");
  });

  it("is late at the exact deadline instant and after it", () => {
    expect(cancellationStatus(session, fromDeadline(0), deadline)).toBe("LATE_CANCELLED");
    expect(cancellationStatus(session, fromDeadline(1), deadline)).toBe("LATE_CANCELLED");
  });

  it("turns late when the deadline is raised past now", () => {
    expect(cancellationStatus(session, now, { cancelDeadlineHours: 4 })).toBe("CANCELLED");
    expect(cancellationStatus(session, now, { cancelDeadlineHours: 5 })).toBe("LATE_CANCELLED");
  });
});
