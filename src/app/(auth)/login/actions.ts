"use server";

import { AuthError } from "next-auth";
import { t } from "@/i18n";
import { signIn } from "@/lib/auth";
import { safeRedirectTarget } from "@/lib/routes";

export type LoginState = { error?: string };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const redirectTo = safeRedirectTarget(formData.get("next"));
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: t.auth.invalidCredentials };
    }
    // On success signIn throws Next's redirect, which must propagate.
    throw error;
  }
}
