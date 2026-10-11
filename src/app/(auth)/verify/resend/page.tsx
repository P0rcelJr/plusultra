import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { EmailRequestForm } from "@/components/email-request-form";
import { t } from "@/i18n";
import { resendVerification } from "./actions";

export const metadata: Metadata = { title: t.auth.resend.title };

export default function ResendVerificationPage() {
  return (
    <AuthCard
      title={t.auth.resend.title}
      footer={
        <Link href="/login" className="underline underline-offset-4">
          {t.auth.loginLink}
        </Link>
      }
    >
      <EmailRequestForm
        action={resendVerification}
        description={t.auth.resend.description}
        submit={t.auth.resend.submit}
        submitting={t.auth.resend.submitting}
        done={t.auth.resend.done}
      />
    </AuthCard>
  );
}
