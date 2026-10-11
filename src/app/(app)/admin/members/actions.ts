"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { gymToday } from "@/domain/time";
import type { Role } from "@/generated/prisma/client";
import { t } from "@/i18n";
import type { ActionState } from "@/lib/action-state";
import { db } from "@/lib/db";
import { sendPasswordEmail } from "@/lib/email";
import { saveIntake } from "@/lib/intake";
import { requireRole } from "@/lib/session";
import { assignPlan, closeOpenSubscriptions } from "@/lib/subscriptions";
import { issueToken } from "@/lib/tokens";
import { dateField, emailField, firstIssue, formValues, nameField, optionalText } from "@/lib/validation";

const ROLES: Role[] = ["MEMBER", "COACH", "ADMIN"];

function detailPath(userId: string, key: string, kind: "notice" | "error" = "notice") {
  return `/admin/members/${userId}?${kind}=${key}`;
}

function revalidateMembers(userId: string) {
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/approvals");
}

const createSchema = z.object({
  name: nameField,
  email: emailField,
  phone: optionalText,
  planId: z.string().default(""),
  startsOn: dateField,
});

/**
 * Admin creates a member directly (decisions 13, A2). The email counts as verified and the member gets a
 * set-your-password link; with a plan the account is ACTIVE at once, otherwise PENDING.
 */
export async function createMember(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = createSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { name, email, phone, planId, startsOn } = parsed.data;

  const taken = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) return { error: t.members.emailTaken };

  if (planId) {
    const plan = await db.membershipPlan.findUnique({ where: { id: planId }, select: { active: true } });
    if (!plan?.active) return { error: t.errors.planInactive };
  }

  // Nobody knows this password; the member sets their own through the emailed link.
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
  const user = await db.user.create({
    data: { name, email, phone, passwordHash, status: "PENDING", emailVerifiedAt: new Date() },
    select: { id: true, name: true, email: true },
  });
  if (planId) await assignPlan(user.id, planId, startsOn);

  const token = await issueToken(user.id, "PASSWORD_RESET");
  await sendPasswordEmail(user, token, "set");
  revalidateMembers(user.id);
  redirect(detailPath(user.id, "memberCreated"));
}

const accountSchema = z.object({
  userId: z.string().min(1),
  name: nameField,
  email: emailField,
  phone: optionalText,
});

export async function updateMemberAccount(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = accountSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { userId, ...data } = parsed.data;
  const taken = await db.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (taken && taken.id !== userId) return { error: t.members.emailTaken };
  const updated = await db.user.updateMany({ where: { id: userId }, data });
  if (updated.count === 0) return { error: t.errors.notFound };
  revalidateMembers(userId);
  redirect(detailPath(userId, "accountSaved"));
}

/** Staff edit of the intake from the member detail page (decision 21). */
export async function saveMemberIntake(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return { error: t.errors.notFound };
  const exists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!exists) return { error: t.errors.notFound };
  const result = await saveIntake(userId, formData, { staff: true });
  if (result.error) return { error: result.error };
  revalidateMembers(userId);
  redirect(detailPath(userId, "intakeSaved"));
}

const changePlanSchema = z.object({ userId: z.string().min(1), planId: z.string().min(1), startsOn: dateField });

export async function changeMemberPlan(formData: FormData) {
  await requireRole("ADMIN");
  const parsed = changePlanSchema.safeParse(formValues(formData));
  if (!parsed.success) redirect("/admin/members?error=planRequired");
  const { userId, planId, startsOn } = parsed.data;
  const assigned = await assignPlan(userId, planId, startsOn);
  if (!assigned) redirect(detailPath(userId, "planInactive", "error"));
  revalidateMembers(userId);
  redirect(detailPath(userId, "subscriptionChanged"));
}

const cancelSchema = z.object({ userId: z.string().min(1), endsOn: dateField });

export async function cancelMemberSubscription(formData: FormData) {
  await requireRole("ADMIN");
  const parsed = cancelSchema.safeParse(formValues(formData));
  if (!parsed.success) redirect("/admin/members?error=notFound");
  const { userId, endsOn } = parsed.data;
  const closed = await closeOpenSubscriptions(userId, endsOn);
  if (closed === 0) redirect(detailPath(userId, "noActiveSubscription", "error"));
  revalidateMembers(userId);
  redirect(detailPath(userId, "subscriptionCancelled"));
}

export async function reactivateMember(formData: FormData) {
  await requireRole("ADMIN");
  const userId = String(formData.get("userId") ?? "");
  await db.user.updateMany({ where: { id: userId, status: "INACTIVE" }, data: { status: "ACTIVE" } });
  revalidateMembers(userId);
  redirect(detailPath(userId, "reactivated"));
}

/** Deactivation blocks login (see authorize in src/lib/auth.ts) and closes the running subscription today. */
export async function deactivateMember(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const userId = String(formData.get("userId") ?? "");
  if (userId === admin.id) redirect(detailPath(userId, "ownAccount", "error"));
  await db.user.updateMany({ where: { id: userId }, data: { status: "INACTIVE" } });
  await closeOpenSubscriptions(userId, gymToday());
  revalidateMembers(userId);
  redirect(detailPath(userId, "deactivated"));
}

/** Role changes apply on the next login because the JWT carries the role (decision A5). */
export async function changeMemberRole(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (userId === admin.id) redirect(detailPath(userId, "ownAccount", "error"));
  if (!ROLES.includes(role as Role)) redirect(detailPath(userId, "notFound", "error"));
  await db.user.updateMany({ where: { id: userId }, data: { role: role as Role } });
  revalidateMembers(userId);
  redirect(detailPath(userId, "roleChanged"));
}

export async function sendPasswordLink(formData: FormData) {
  await requireRole("ADMIN");
  const userId = String(formData.get("userId") ?? "");
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } });
  if (!user) redirect("/admin/members?error=notFound");
  const token = await issueToken(user.id, "PASSWORD_RESET");
  await sendPasswordEmail(user, token, "set");
  redirect(detailPath(userId, "passwordLinkSent"));
}
