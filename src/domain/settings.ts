/** The three gym-wide knobs (decisions 9, A4). Defaults match the `gym_settings` column defaults. */
export type GymSettingsValues = {
  bookingWindowDays: number;
  cancelDeadlineHours: number;
  materializeHorizonWeeks: number;
};

/** Inclusive bounds accepted by /admin/settings (A19). */
export const SETTINGS_LIMITS = {
  bookingWindowDays: { min: 1, max: 60 },
  cancelDeadlineHours: { min: 0, max: 72 },
  materializeHorizonWeeks: { min: 1, max: 12 },
} as const satisfies Record<keyof GymSettingsValues, { min: number; max: number }>;

/**
 * Members can only book sessions that already exist, so the booking window must not reach past
 * the materialized horizon (A19). A window of exactly `weeks * 7` days fits.
 */
export function windowFitsHorizon(values: Pick<GymSettingsValues, "bookingWindowDays" | "materializeHorizonWeeks">) {
  return values.bookingWindowDays <= values.materializeHorizonWeeks * 7;
}
