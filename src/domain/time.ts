import { TZDate } from "@date-fns/tz";
import { addDays, startOfWeek } from "date-fns";

/** The gym operates in one fixed timezone (decision 18). Uruguay has had no DST since 2015. */
export const GYM_TIMEZONE = "America/Montevideo";

export type Interval = { start: Date; end: Date };

/**
 * The Monday-to-Sunday week that contains `at`, as a half-open [start, end) interval of instants,
 * computed in the gym's timezone. Weekly booking quotas (decision 9) count bookings inside this interval.
 */
export function weekBoundsFor(at: Date, timeZone: string = GYM_TIMEZONE): Interval {
  const local = new TZDate(at, timeZone);
  const start = startOfWeek(local, { weekStartsOn: 1 });
  const end = addDays(start, 7);
  return { start: new Date(start.getTime()), end: new Date(end.getTime()) };
}

/**
 * Calendar dates (date of birth, subscription bounds) are stored in DATE columns, which Prisma
 * reads and writes as JS Dates at 00:00 UTC. These helpers convert between that representation,
 * `YYYY-MM-DD` keys used by `<input type="date">`, and the gym-local calendar day of an instant.
 */
export type DateKey = string;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD` of the gym-local calendar day that contains `at`. */
export function dateKeyFor(at: Date, timeZone: string = GYM_TIMEZONE): DateKey {
  const local = new TZDate(at, timeZone);
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const d = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The DATE-column representation (00:00 UTC) of a `YYYY-MM-DD` key, or null when malformed. */
export function fromDateKey(key: string): Date | null {
  if (!DATE_KEY.test(key)) return null;
  const date = new Date(`${key}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Reject overflow such as 2026-02-31, which Date silently rolls into March.
  return date.toISOString().slice(0, 10) === key ? date : null;
}

/** `YYYY-MM-DD` of a DATE-column value. */
export function toDateKey(date: Date): DateKey {
  return date.toISOString().slice(0, 10);
}

/** Today's gym-local calendar day in DATE-column form, for comparing against DATE columns. */
export function gymToday(now: Date = new Date()): Date {
  return fromDateKey(dateKeyFor(now)) as Date;
}

/** Whole years between two DATE-column values. */
export function ageOn(dateOfBirth: Date, on: Date): number {
  let years = on.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const birthdayPassed =
    on.getUTCMonth() > dateOfBirth.getUTCMonth() ||
    (on.getUTCMonth() === dateOfBirth.getUTCMonth() && on.getUTCDate() >= dateOfBirth.getUTCDate());
  if (!birthdayPassed) years -= 1;
  return years;
}
