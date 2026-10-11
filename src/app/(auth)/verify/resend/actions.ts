"use server";

import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { issueToken } from "@/lib/tokens";
import { emailField, firstIssue, formValues } from "@/lib/validation";

const schema = z.object({ email: emailField });

/** Always reports success so the form does not reveal which emails are registered. */
export async function resendVerification(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true, emailVerifiedAt: true },
  });
  if (user && user.emailVerifiedAt === null) {
    const token = await issueToken(user.id, "EMAIL_VERIFY");
    await sendVerificationEmail(user, token);
  }
  return { done: true };
}
