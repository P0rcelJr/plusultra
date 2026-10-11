"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { t } from "@/i18n";
import type { ActionState } from "@/lib/action-state";
import { db } from "@/lib/db";
import { consumeToken } from "@/lib/tokens";
import { firstIssue, formValues, passwordField } from "@/lib/validation";

const schema = z.object({
  token: z.string(),
  password: passwordField,
  passwordConfirm: z.string(),
});

/**
 * Sets a new password from a reset or set-password link. Reaching the link proves control of the
 * inbox, so an unverified email (admin-created member) is marked verified here too.
 */
export async function resetPassword(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { token, password, passwordConfirm } = parsed.data;
  if (password !== passwordConfirm) return { error: t.auth.reset.mismatch };

  const result = await consumeToken(token, "PASSWORD_RESET");
  if (!result) return { error: t.auth.reset.invalid };

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  await db.$transaction([
    db.user.update({ where: { id: result.userId }, data: { passwordHash } }),
    db.user.updateMany({ where: { id: result.userId, emailVerifiedAt: null }, data: { emailVerifiedAt: now } }),
    db.authToken.deleteMany({ where: { userId: result.userId, type: "PASSWORD_RESET", usedAt: null } }),
  ]);
  redirect("/login?notice=reset");
}
