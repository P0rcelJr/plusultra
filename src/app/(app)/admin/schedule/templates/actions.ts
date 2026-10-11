"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CLASS_TYPE_LIMITS } from "@/domain/class-types";
import { isWeekday, parseTimeOfDay } from "@/domain/schedule";
import { t } from "@/i18n";
import type { ActionState } from "@/lib/action-state";
import { db } from "@/lib/db";
import { materializeSessions } from "@/lib/schedule";
import { requireRole } from "@/lib/session";
import { boundedInt, dateField, firstIssue, formValues } from "@/lib/validation";

/** Template fields (decision 8). Duration and capacity start as the class type's defaults (A20). */
const templateSchema = z.object({
  classTypeId: z.string({ error: t.validation.required }).min(1, { error: t.validation.required }),
  coachId: z.string({ error: t.validation.required }).min(1, { error: t.validation.required }),
  startTime: z
    .string({ error: t.validation.time })
    .refine((value) => parseTimeOfDay(value) !== null, { error: t.validation.time }),
  durationMinutes: boundedInt(CLASS_TYPE_LIMITS.durationMinutes),
  capacity: boundedInt(CLASS_TYPE_LIMITS.capacity),
  startsOn: dateField,
});

/** One template row per checked weekday, then the sessions are materialized up to the horizon (A4). */
export async function createTemplates(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = templateSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const weekdays = [...new Set(formData.getAll("weekday").map(Number))].filter(isWeekday);
  if (weekdays.length === 0) return { error: t.validation.weekdays };

  const { classTypeId, coachId, ...fields } = parsed.data;
  const [classType, coach] = await Promise.all([
    db.classType.findUnique({ where: { id: classTypeId } }),
    db.user.findUnique({ where: { id: coachId } }),
  ]);
  if (!classType?.active) return { error: t.errors.classTypeInactive };
  if (!coach || coach.status !== "ACTIVE" || (coach.role !== "COACH" && coach.role !== "ADMIN")) {
    return { error: t.errors.coachInvalid };
  }

  await db.scheduleTemplate.createMany({
    data: weekdays.map((weekday) => ({ classTypeId, coachId, weekday, ...fields })),
  });
  await materializeSessions();
  revalidatePath("/admin/schedule", "layout");
  redirect("/admin/schedule/templates?notice=templateSaved");
}
