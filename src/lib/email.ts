import { Resend } from "resend";
import { fill, t } from "@/i18n";

/**
 * Transactional email via Resend (decision 17). With no RESEND_API_KEY the message is printed to
 * the server console instead, so every flow is testable locally. Only three emails exist in this
 * phase: verification, password reset/set, and account approved.
 */
type OutgoingEmail = { to: string; subject: string; text: string; link?: string };

const FROM = process.env.EMAIL_FROM ?? "Plus Ultra <onboarding@resend.dev>";

/** Absolute URL for links in emails. AUTH_URL is set in production; local dev falls back to port 3000. */
export function appUrl(path: string): string {
  const base = process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

async function deliver(email: OutgoingEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      [
        "---- email (RESEND_API_KEY is empty, not sent) ----",
        `to:      ${email.to}`,
        `subject: ${email.subject}`,
        email.link ? `link:    ${email.link}` : null,
        "",
        email.text,
        "---------------------------------------------------",
      ]
        .filter((line) => line !== null)
        .join("\n"),
    );
    return;
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: email.to,
    subject: email.subject,
    text: email.text,
  });
  if (error) {
    // Email failures must not break the user flow; the link can be re-requested.
    console.error("Resend error", error);
  }
}

export async function sendVerificationEmail(to: { name: string; email: string }, rawToken: string) {
  const link = appUrl(`/verify?token=${rawToken}`);
  await deliver({
    to: to.email,
    subject: t.email.verify.subject,
    text: fill(t.email.verify.body, { name: to.name, link }),
    link,
  });
}

/** Password reset for existing members and "set your password" for admin-created ones share a link. */
export async function sendPasswordEmail(
  to: { name: string; email: string },
  rawToken: string,
  mode: "reset" | "set",
) {
  const link = appUrl(`/reset?token=${rawToken}`);
  const copy = mode === "reset" ? t.email.reset : t.email.setPassword;
  await deliver({
    to: to.email,
    subject: copy.subject,
    text: fill(copy.body, { name: to.name, link }),
    link,
  });
}

export async function sendApprovedEmail(to: { name: string; email: string }, planName: string) {
  const link = appUrl("/member");
  await deliver({
    to: to.email,
    subject: t.email.approved.subject,
    text: fill(t.email.approved.body, { name: to.name, plan: planName, link }),
    link,
  });
}
