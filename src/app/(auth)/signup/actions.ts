"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { t } from "@/i18n";
import type { ActionState } from "@/lib/action-state";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { issueToken } from "@/lib/tokens";
import { emailField, firstIssue, formValues, nameField, passwordField } from "@/lib/validation";

const schema = z.object({
  name: nameField,
  email: emailField,
  phone: z.string({ error: t.validation.required }).trim().min(6, { error: t.validation.required }),
  password: passwordField,
});

/** Public self-signup (decision 13). The account stays PENDING until an admin assigns a plan. */
export async function signup(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { name, email, phone, password } = parsed.data;

  // A taken email gets the same "check your inbox" screen so the form does not reveal who has an account.
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    console.log(`Signup attempted with an existing email: ${email}`);
    return { done: true };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  let user: { id: string; name: string; email: string };
  try {
    user = await db.user.create({
      data: { name, email, phone, passwordHash },
      select: { id: true, name: true, email: true },
    });
  } catch {
    // Lost a race with a concurrent signup for the same email: same generic outcome.
    return { done: true };
  }
  const token = await issueToken(user.id, "EMAIL_VERIFY");
  await sendVerificationEmail(user, token);
  return { done: true };
}
