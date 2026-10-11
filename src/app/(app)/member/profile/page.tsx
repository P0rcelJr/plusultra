import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { accountState, canFillIntake } from "@/domain/account";
import { IntakeForm } from "@/components/intake-form";
import { Notice } from "@/components/notice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";
import { intakeFormValues } from "@/lib/intake";
import { currentUser } from "@/lib/session";
import { submitMyIntake } from "../actions";

export const metadata: Metadata = { title: t.intake.profileTitle };

/** Members can edit their intake later from here (decision 21). */
export default async function MemberProfilePage({ searchParams }: PageProps<"/member/profile">) {
  const params = await searchParams;
  const user = await currentUser();
  const state = accountState(user, user.profile);
  if (!canFillIntake(state)) redirect("/member");

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Notice notice={params.notice} error={params.error} />
      <Card>
        <CardHeader>
          <CardTitle>{t.intake.profileTitle}</CardTitle>
          <CardDescription>{t.intake.profileDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <IntakeForm
            action={submitMyIntake}
            initial={intakeFormValues(user.profile)}
            photoUrl={user.profile?.photoFilename ? `/api/photos/${user.id}` : null}
            submitLabel={t.intake.update}
          />
        </CardContent>
      </Card>
    </div>
  );
}
