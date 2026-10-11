"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendApprovedEmail } from "@/lib/email";
import { requireRole } from "@/lib/session";
import { assignPlan } from "@/lib/subscriptions";
import { dateField, formValues, optionalText } from "@/lib/validation";

const approveSchema = z.object({ userId: z.string().min(1), planId: z.string().min(1), startsOn: dateField });
const rejectSchema = z.object({ userId: z.string().min(1), note: optionalText });

/** Approval = assigning a plan (decision 13). Creates the subscription, activates, emails (decision 17). */
export async function approveMember(formData: FormData) {
  await requireRole("ADMIN");
  const parsed = approveSchema.safeParse(formValues(formData));
  if (!parsed.success) redirect("/admin/approvals?error=planRequired");
  const { userId, planId, startsOn } = parsed.data;

  const user = await db.user.findUnique({ where: { id: userId }, select: { status: true, name: true, email: true } });
  if (!user) redirect("/admin/approvals?error=notFound");
  if (user.status !== "PENDING") redirect("/admin/approvals?error=notPending");

  const assigned = await assignPlan(userId, planId, startsOn);
  if (!assigned) redirect("/admin/approvals?error=planInactive");

  const plan = await db.membershipPlan.findUniqueOrThrow({ where: { id: planId }, select: { name: true } });
  await sendApprovedEmail(user, plan.name);
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/members");
  redirect("/admin/approvals?notice=approved");
}

/** Rejection deactivates the account; the note is kept in the staff notes of the profile. */
export async function rejectMember(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = rejectSchema.safeParse(formValues(formData));
  if (!parsed.success) redirect("/admin/approvals?error=notFound");
  const { userId, note } = parsed.data;

  const user = await db.user.findUnique({ where: { id: userId }, include: { profile: true } });
  if (!user) redirect("/admin/approvals?error=notFound");
  if (user.status !== "PENDING") redirect("/admin/approvals?error=notPending");

  const stamp = new Date().toISOString().slice(0, 10);
  const line = `[${stamp}] Rechazado por ${admin.name}${note ? `: ${note}` : ""}`;
  const staffNotes = [user.profile?.staffNotes, line].filter(Boolean).join("\n");
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { status: "INACTIVE" } }),
    db.memberProfile.upsert({
      where: { userId },
      create: { userId, staffNotes },
      update: { staffNotes },
    }),
  ]);
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/members");
  redirect("/admin/approvals?notice=rejected");
}
