import type { Metadata } from "next";
import Link from "next/link";
import { accountState } from "@/domain/account";
import { subscriptionCovering } from "@/domain/subscriptions";
import { gymToday } from "@/domain/time";
import { Notice } from "@/components/notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fill, t } from "@/i18n";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { currentUser } from "@/lib/session";
import { resendMyVerification } from "./actions";

export const metadata: Metadata = { title: t.home.member };

const STATE_BADGE = {
  unverified: "outline",
  intake_pending: "outline",
  awaiting_approval: "secondary",
  active: "default",
  inactive: "destructive",
} as const;

/** Member home: status (from the database row, not the JWT) and current plan. Schedule arrives in phase 2. */
export default async function MemberHomePage({ searchParams }: PageProps<"/member">) {
  const params = await searchParams;
  const user = await currentUser();
  const state = accountState(user, user.profile);

  const subscriptions = await db.subscription.findMany({
    where: { userId: user.id },
    include: { plan: true },
  });
  const current = subscriptionCovering(subscriptions, gymToday());

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Notice notice={params.notice} error={params.error} />
      <Card>
        <CardHeader>
          <CardTitle>{t.home.member}</CardTitle>
          <CardDescription>{fill(t.home.greeting, { name: user.name })}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">{t.member.statusLabel}</dt>
            <dd>
              <Badge variant={STATE_BADGE[state]}>{t.accountState[state]}</Badge>
            </dd>
            <dt className="text-muted-foreground">{t.member.planLabel}</dt>
            <dd>
              {current ? (
                <>
                  <span className="font-medium">{current.plan.name}</span>{" "}
                  <span className="text-muted-foreground">
                    {fill(t.member.planSince, { date: formatDate(current.startsOn) })}
                    {current.endsOn ? `, ${fill(t.member.planUntil, { date: formatDate(current.endsOn) })}` : ""}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">{t.member.noPlan}</span>
              )}
            </dd>
          </dl>

          {state === "unverified" ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{t.member.unverifiedBody}</p>
              <form action={resendMyVerification}>
                <Button type="submit" variant="outline" size="sm">
                  {t.member.resendVerification}
                </Button>
              </form>
            </div>
          ) : null}

          {state === "intake_pending" ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{t.member.intakePendingBody}</p>
              <Button render={<Link href="/member/intake" />} size="sm" className="self-start">
                {t.member.goToIntake}
              </Button>
            </div>
          ) : null}

          {state === "awaiting_approval" ? (
            <p className="text-sm text-muted-foreground">{t.member.awaitingApprovalBody}</p>
          ) : null}
          {state === "active" ? <p className="text-sm text-muted-foreground">{t.member.activeBody}</p> : null}
          {state === "inactive" ? <p className="text-sm text-muted-foreground">{t.member.inactiveBody}</p> : null}

          {state !== "unverified" && state !== "intake_pending" ? (
            <Link href="/member/profile" className="text-sm underline underline-offset-4">
              {t.member.editProfile}
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
