import { addCalendarDays, gymInstant, isoWeekdayOf } from "./time";

/** ISO weekdays, 1 = Monday … 7 = Sunday, the order the admin screens list them in. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export function isWeekday(value: number): value is Weekday {
  return Number.isInteger(value) && value >= 1 && value <= 7;
}

const TIME_OF_DAY = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Hours and minutes of a local `HH:MM` string, or null when malformed. */
export function parseTimeOfDay(value: string): { hours: number; minutes: number } | null {
  const match = TIME_OF_DAY.exec(value);
  if (!match) return null;
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

/**
 * The parts of a `schedule_templates` row that decide when it happens (decision 8). `startsOn` and
 * `endsOn` are DATE-column values; like subscriptions, the template runs on [startsOn, endsOn) (A21).
 */
export type WeeklyTemplate = {
  weekday: number;
  startTime: string;
  durationMinutes: number;
  startsOn: Date;
  endsOn: Date | null;
};

export type Occurrence = { startsAt: Date; endsAt: Date };

/**
 * Instants at which a template happens on the calendar days [from, to), both DATE-column values.
 * The local `HH:MM` is resolved in the gym timezone, so a 19:00 class is 22:00Z in Montevideo.
 */
export function occurrencesFor(template: WeeklyTemplate, from: Date, to: Date): Occurrence[] {
  const time = parseTimeOfDay(template.startTime);
  if (!time || !isWeekday(template.weekday)) return [];

  const first = Math.max(from.getTime(), template.startsOn.getTime());
  const last = Math.min(to.getTime(), template.endsOn?.getTime() ?? Infinity);
  if (first >= last) return [];

  const start = new Date(first);
  const offset = (template.weekday - isoWeekdayOf(start) + 7) % 7;
  const occurrences: Occurrence[] = [];
  for (let day = addCalendarDays(start, offset); day.getTime() < last; day = addCalendarDays(day, 7)) {
    const startsAt = gymInstant(day, time.hours, time.minutes);
    const endsAt = new Date(startsAt.getTime() + template.durationMinutes * 60 * 1000);
    occurrences.push({ startsAt, endsAt });
  }
  return occurrences;
}
