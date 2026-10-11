import { GYM_TIMEZONE, toDateKey } from "@/domain/time";

const LOCALE = "es-UY";

/**
 * DATE-column values are 00:00 UTC (see src/domain/time.ts), so they must be formatted in UTC;
 * formatting them in the gym timezone would show the previous day.
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", dateStyle: "medium" }).format(date);
}

/** Instants (timestamps) are shown in the gym timezone (decision 18). */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: GYM_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Whole UYU, no decimals (decision 18). */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Value for `<input type="date">` from a DATE-column value. */
export function dateInputValue(date: Date | null | undefined): string {
  return date ? toDateKey(date) : "";
}
