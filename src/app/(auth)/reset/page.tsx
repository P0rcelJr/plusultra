import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { t } from "@/i18n";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: t.auth.reset.title };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset">) {
  const { token } = await searchParams;
  const tokenValue = typeof token === "string" ? token : "";

  return (
    <AuthCard
      title={t.auth.reset.title}
      footer={
        <Link href="/forgot" className="underline underline-offset-4">
          {t.auth.forgot.title}
        </Link>
      }
    >
      {tokenValue ? (
        <ResetForm token={tokenValue} />
      ) : (
        <Alert variant="destructive">
          <AlertDescription>{t.auth.reset.invalid}</AlertDescription>
        </Alert>
      )}
    </AuthCard>
  );
}
