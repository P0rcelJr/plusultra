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
