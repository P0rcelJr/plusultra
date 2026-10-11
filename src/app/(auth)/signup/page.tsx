import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { t } from "@/i18n";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: t.auth.signup.title };

export default function SignupPage() {
  return (
    <AuthCard
      title={t.auth.signup.title}
      footer={
        <p>
          {t.auth.haveAccount}{" "}
          <Link href="/login" className="underline underline-offset-4">
            {t.auth.loginLink}
          </Link>
        </p>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
