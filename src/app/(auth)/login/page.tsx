import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";
import { safeRedirectTarget } from "@/lib/routes";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: t.auth.loginTitle };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeRedirectTarget(params.next, "");

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t.app.name}</CardTitle>
          <CardDescription>{t.auth.loginTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={next || undefined} />
        </CardContent>
      </Card>
    </main>
  );
}
