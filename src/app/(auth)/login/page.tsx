import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { Notice } from "@/components/notice";
import { t } from "@/i18n";
import { safeRedirectTarget } from "@/lib/routes";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: t.auth.loginTitle };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeRedirectTarget(params.next, "");

  return (
    <AuthCard
      title={t.auth.loginTitle}
      footer={
        <>
          <p>
            {t.auth.noAccount}{" "}
            <Link href="/signup" className="underline underline-offset-4">
              {t.auth.signupLink}
            </Link>
          </p>
          <Link href="/forgot" className="underline underline-offset-4">
            {t.auth.forgotLink}
          </Link>
          <Link href="/verify/resend" className="underline underline-offset-4">
            {t.auth.resendLink}
          </Link>
        </>
      }
    >
      <Notice notice={params.notice} error={params.error} />
      <LoginForm next={next || undefined} />
    </AuthCard>
  );
}
