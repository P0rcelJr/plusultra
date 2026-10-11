import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";

/** Centered card used by every public screen (login, signup, verification, password reset). */
export function AuthCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t.app.name}</CardTitle>
          <CardDescription>{title}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">{children}</CardContent>
        {footer ? <CardFooter className="flex flex-col items-start gap-1 text-sm">{footer}</CardFooter> : null}
      </Card>
    </main>
  );
}
