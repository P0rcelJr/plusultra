import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { EmailRequestForm } from "@/components/email-request-form";
import { t } from "@/i18n";
import { requestPasswordReset } from "./actions";

export const metadata: Metadata = { title: t.auth.forgot.title };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title={t.auth.forgot.title}
      footer={
        <Link href="/login" className="underline underline-offset-4">
          {t.auth.loginLink}
        </Link>
      }
    >
      <EmailRequestForm
        action={requestPasswordReset}
        description={t.auth.forgot.description}
        submit={t.auth.forgot.submit}
        submitting={t.auth.forgot.submitting}
        done={t.auth.forgot.done}
      />
    </AuthCard>
  );
}
