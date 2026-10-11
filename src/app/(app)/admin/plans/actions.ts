"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { t } from "@/i18n";
import type { ActionState } from "@/lib/action-state";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { firstIssue, formValues, nameField } from "@/lib/validation";

/** Membership plan fields (decision 4). Price is whole UYU; an empty quota means unlimited. */
const planSchema = z.object({
  name: nameField,
  monthlyPrice: z.coerce.number({ error: t.validation.price }).int({ error: t.validation.price }).min(0, {
    error: t.validation.price,
  }),
  weeklyClassQuota: z
    .string()
    .trim()
    .default("")
    .transform((value, ctx) => {
      if (value === "") return null;
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1) {
        ctx.addIssue({ code: "custom", message: t.validation.quota });
        return z.NEVER;
      }
      return n;
    }),
  includesTrainingPlan: z
    .string()
    .optional()
    .transform((value) => value === "on"),
});

export async function createPlan(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = planSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  await db.membershipPlan.create({ data: parsed.data });
  revalidatePath("/admin/plans");
  redirect("/admin/plans?notice=planSaved");
}

export async function updatePlan(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const id = formData.get("id");
  if (typeof id !== "string") return { error: t.errors.notFound };
  const parsed = planSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const updated = await db.membershipPlan.updateMany({ where: { id }, data: parsed.data });
  if (updated.count === 0) return { error: t.errors.notFound };
  revalidatePath("/admin/plans");
  redirect("/admin/plans?notice=planSaved");
}

/** Archiving keeps the plan on existing subscriptions but hides it from new assignments (decision 4). */
export async function setPlanActive(formData: FormData) {
  await requireRole("ADMIN");
  const id = formData.get("id");
  const active = formData.get("active") === "true";
  if (typeof id !== "string") redirect("/admin/plans?error=notFound");
  await db.membershipPlan.updateMany({ where: { id }, data: { active } });
  revalidatePath("/admin/plans");
  redirect(`/admin/plans?notice=${active ? "planRestored" : "planArchived"}`);
}
