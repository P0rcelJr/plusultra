"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CLASS_TYPE_LIMITS } from "@/domain/class-types";
import { t } from "@/i18n";
import type { ActionState } from "@/lib/action-state";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { boundedInt, firstIssue, formValues, nameField, optionalText } from "@/lib/validation";

/** Class type fields (A20). Duration and capacity are defaults copied onto templates and sessions. */
const classTypeSchema = z.object({
  name: nameField,
  description: optionalText,
  durationMinutes: boundedInt(CLASS_TYPE_LIMITS.durationMinutes),
  capacity: boundedInt(CLASS_TYPE_LIMITS.capacity),
});

export async function createClassType(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = classTypeSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await db.classType.create({ data: parsed.data });
  revalidatePath("/admin/classes");
  redirect("/admin/classes?notice=classTypeSaved");
}

export async function updateClassType(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const id = formData.get("id");
  if (typeof id !== "string") return { error: t.errors.notFound };
  const parsed = classTypeSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const updated = await db.classType.updateMany({ where: { id }, data: parsed.data });
  if (updated.count === 0) return { error: t.errors.notFound };
  revalidatePath("/admin/classes");
  redirect("/admin/classes?notice=classTypeSaved");
}

/** Archiving keeps the type on existing templates and sessions but hides it from new ones (A20). */
export async function setClassTypeActive(formData: FormData) {
  await requireRole("ADMIN");
  const id = formData.get("id");
  const active = formData.get("active") === "true";
  if (typeof id !== "string") redirect("/admin/classes?error=notFound");
  await db.classType.updateMany({ where: { id }, data: { active } });
  revalidatePath("/admin/classes");
  redirect(`/admin/classes?notice=${active ? "classTypeRestored" : "classTypeArchived"}`);
}
