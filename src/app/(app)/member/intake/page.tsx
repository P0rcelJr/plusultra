import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { accountState, canFillIntake } from "@/domain/account";
import { IntakeForm } from "@/components/intake-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";
import { intakeFormValues } from "@/lib/intake";
import { currentUser } from "@/lib/session";
import { submitMyIntake } from "../actions";

export const metadata: Metadata = { title: t.intake.title };

/** First-time intake (decision 21). Reachable only after email verification. */
export default async function IntakePage() {
  const user = await currentUser();
  const state = accountState(user, user.profile);
  if (!canFillIntake(state)) redirect("/member");
  if (user.profile?.intakeCompletedAt) redirect("/member/profile");

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{t.intake.title}</CardTitle>
        <CardDescription>{t.intake.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <IntakeForm
          action={submitMyIntake}
          initial={intakeFormValues(user.profile)}
          photoUrl={user.profile?.photoFilename ? `/api/photos/${user.id}` : null}
          submitLabel={t.intake.submit}
        />
      </CardContent>
    </Card>
  );
}
