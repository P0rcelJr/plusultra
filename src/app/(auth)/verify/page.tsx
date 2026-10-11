import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { t } from "@/i18n";
import { db } from "@/lib/db";
import { consumeToken } from "@/lib/tokens";

export const metadata: Metadata = { title: t.auth.verify.title };

/** Email verification link target (decision 21). Single use, 24 h, then on to the intake form. */
export default async function VerifyPage({ searchParams }: PageProps<"/verify">) {
  const { token } = await searchParams;
  const result = await consumeToken(token, "EMAIL_VERIFY");

  if (result) {
    await db.user.updateMany({
      where: { id: result.userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });
    redirect("/login?notice=verified&next=/member/intake");
  }

  return (
    <AuthCard title={t.auth.verify.title}>
      <Alert variant="destructive">
        <AlertDescription>{t.auth.verify.invalid}</AlertDescription>
      </Alert>
      <p className="text-sm text-muted-foreground">
        {t.auth.verify.resendPrompt}{" "}
        <Link href="/verify/resend" className="underline underline-offset-4">
          {t.auth.resend.title}
        </Link>
        .
      </p>
    </AuthCard>
  );
}
