"use server";

import { redirect } from "next/navigation";
import { accountState, canFillIntake } from "@/domain/account";
import { t } from "@/i18n";
import type { ActionState } from "@/lib/action-state";
import { sendVerificationEmail } from "@/lib/email";
import { saveIntake } from "@/lib/intake";
import { currentUser } from "@/lib/session";
import { issueToken } from "@/lib/tokens";

export async function resendMyVerification() {
  const user = await currentUser();
  if (user.emailVerifiedAt === null) {
    const token = await issueToken(user.id, "EMAIL_VERIFY");
    await sendVerificationEmail(user, token);
  }
  redirect("/member?notice=resent");
}

/** First intake submission and later edits from /member/profile go through the same action. */
export async function submitMyIntake(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await currentUser();
  const state = accountState(user, user.profile);
  if (!canFillIntake(state)) return { error: t.errors.unverified };

  const firstTime = user.profile?.intakeCompletedAt == null;
  const result = await saveIntake(user.id, formData, { staff: false });
  if (result.error) return { error: result.error };
  redirect(firstTime ? "/member?notice=intakeSaved" : "/member/profile?notice=intakeSaved");
}
