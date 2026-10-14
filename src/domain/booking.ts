import type { BookingStatus, SessionStatus, UserStatus } from "@/generated/prisma/client";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type BookingWindowSettings = { bookingWindowDays: number };

/**
 * Booking window (decision 9): a session can be booked once it is no more than `bookingWindowDays`
 * ahead of `now`, and until it starts. Both ends are instants, so a 7-day window opens at the same
 * clock time a week before the class.
 */
export function withinBookingWindow(
  session: { startsAt: Date },
  now: Date,
  settings: BookingWindowSettings,
): boolean {
  const start = session.startsAt.getTime();
  return start > now.getTime() && start <= bookingWindowEnd(now, settings).getTime();
}

/** The last instant a session may start at and still be bookable from `now`. */
export function bookingWindowEnd(now: Date, settings: BookingWindowSettings): Date {
  return new Date(now.getTime() + settings.bookingWindowDays * DAY_MS);
}

export type BookingRefusal = "inactive" | "no_plan" | "session_cancelled" | "already_booked" | "outside_window" | "full";

export type CanBookInput = {
  member: { status: UserStatus };
  /** The plan of the subscription covering today, or null when none does (A1). */
  plan: { weeklyClassQuota: number | null } | null;
  session: { startsAt: Date; status: SessionStatus; capacity: number };
  /** Rows with status BOOKED on the session; cancelled rows free the seat (decision 9). */
  bookedCount: number;
  /** Whether this member already holds a BOOKED row on the session. */
  alreadyBooked: boolean;
  now: Date;
  settings: BookingWindowSettings;
};

export type CanBookResult = { ok: true } | { ok: false; reason: BookingRefusal };

/**
 * Whether a member may book a session (decisions 9, A1, 7). Reasons are checked from the member
 * outwards, so the screen shows the most fundamental one. Overdue payment never blocks (decision 7).
 * The plan's weekly quota is accepted but not enforced yet: every plan books as unlimited until the
 * quota slice lands.
 */
export function canBook(input: CanBookInput): CanBookResult {
  const { member, plan, session } = input;
  if (member.status === "INACTIVE") return { ok: false, reason: "inactive" };
  // A pending account has no plan by definition: assigning one is the approval (decision 13, A1).
  if (member.status !== "ACTIVE" || plan === null) return { ok: false, reason: "no_plan" };
  if (session.status === "CANCELLED") return { ok: false, reason: "session_cancelled" };
  if (input.alreadyBooked) return { ok: false, reason: "already_booked" };
  if (!withinBookingWindow(session, input.now, input.settings)) return { ok: false, reason: "outside_window" };
  if (input.bookedCount >= session.capacity) return { ok: false, reason: "full" };
  return { ok: true };
}

export type CancelDeadlineSettings = { cancelDeadlineHours: number };

/** The instant `cancelDeadlineHours` before the session starts; cancelling from it on is late (decision 9). */
export function cancelDeadline(session: { startsAt: Date }, settings: CancelDeadlineSettings): Date {
  return new Date(session.startsAt.getTime() - settings.cancelDeadlineHours * HOUR_MS);
}

/**
 * The status a cancelled booking takes (decision 9): `CANCELLED` strictly before the deadline and
 * `LATE_CANCELLED` at or after it. Both free the seat, since capacity counts only `BOOKED` rows;
 * only the late one still counts against the weekly quota.
 */
export function cancellationStatus(
  session: { startsAt: Date },
  now: Date,
  settings: CancelDeadlineSettings,
): Extract<BookingStatus, "CANCELLED" | "LATE_CANCELLED"> {
  return now.getTime() < cancelDeadline(session, settings).getTime() ? "CANCELLED" : "LATE_CANCELLED";
}
