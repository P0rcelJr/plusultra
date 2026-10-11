"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SETTINGS_LIMITS, windowFitsHorizon } from "@/domain/settings";
import { fill, t } from "@/i18n";
import type { ActionState } from "@/lib/action-state";
import { requireRole } from "@/lib/session";
import { saveSettings } from "@/lib/settings";
import { firstIssue, formValues } from "@/lib/validation";

function boundedInt({ min, max }: { min: number; max: number }) {
  const error = fill(t.validation.intRange, { min, max });
  return z.coerce.number({ error }).int({ error }).min(min, { error }).max(max, { error });
}

const settingsSchema = z
  .object({
    bookingWindowDays: boundedInt(SETTINGS_LIMITS.bookingWindowDays),
    cancelDeadlineHours: boundedInt(SETTINGS_LIMITS.cancelDeadlineHours),
    materializeHorizonWeeks: boundedInt(SETTINGS_LIMITS.materializeHorizonWeeks),
  })
  .refine(windowFitsHorizon, { error: t.settings.windowPastHorizon });

/** Gym-wide booking and scheduling settings (decisions 9, A4). */
export async function updateSettings(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = settingsSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await saveSettings(parsed.data);
  revalidatePath("/admin/settings");
  redirect("/admin/settings?notice=settingsSaved");
}
