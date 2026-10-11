import type { GymSettings } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/** The single settings row has a fixed primary key (decision 1: one gym). */
const SETTINGS_ID = 1;

/**
 * Gym-wide settings (decisions 9, A4). The row is created with the column defaults on first read,
 * so callers never deal with a missing row.
 */
export async function getSettings(): Promise<GymSettings> {
  return db.gymSettings.upsert({ where: { id: SETTINGS_ID }, create: { id: SETTINGS_ID }, update: {} });
}

export async function saveSettings(
  values: Pick<GymSettings, "bookingWindowDays" | "cancelDeadlineHours" | "materializeHorizonWeeks">,
): Promise<GymSettings> {
  return db.gymSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...values },
    update: values,
  });
}
