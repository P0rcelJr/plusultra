import type { Metadata } from "next";
import Link from "next/link";
import { parqFlagged, parseParq } from "@/domain/parq";
import { ageOn, dateKeyFor, gymToday } from "@/domain/time";
import { Notice } from "@/components/notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { fill, t } from "@/i18n";
import { db } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { approveMember, rejectMember } from "./actions";

export const metadata: Metadata = { title: t.approvals.title };

/** Pending members with a completed intake (decisions 13, 21). */
export default async function ApprovalsPage({ searchParams }: PageProps<"/admin/approvals">) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const [pending, plans] = await Promise.all([
    db.user.findMany({
      where: { status: "PENDING", profile: { intakeCompletedAt: { not: null } } },
      include: { profile: true },
      orderBy: { profile: { intakeCompletedAt: "asc" } },
    }),
    db.membershipPlan.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  const today = gymToday();
  const todayKey = dateKeyFor(new Date());

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <Notice notice={params.notice} error={params.error} />
      <div>
        <h1 className="text-lg font-medium">{t.approvals.title}</h1>
        <p className="text-sm text-muted-foreground">{t.approvals.description}</p>
      </div>
      {plans.length === 0 ? (
        <p className="text-sm text-destructive">
          {t.approvals.noPlans}{" "}
          <Link href="/admin/plans/new" className="underline underline-offset-4">
            {t.plans.new}
          </Link>
        </p>
      ) : null}
      {pending.length === 0 ? <p className="text-sm text-muted-foreground">{t.approvals.empty}</p> : null}
      {pending.map((user) => {
        const profile = user.profile;
        const parq = parseParq(profile?.healthQuestionnaire);
        const flagged = parq ? parqFlagged(parq) : false;
        return (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {user.name}
                {profile?.dateOfBirth ? (
                  <span className="text-sm font-normal text-muted-foreground">
                    {fill(t.intake.age, { age: ageOn(profile.dateOfBirth, today) })}
                  </span>
                ) : null}
                {flagged ? <Badge variant="destructive">{t.intake.parqFlagged}</Badge> : null}
              </CardTitle>
              <CardDescription className="flex flex-col gap-0.5">
                <span>
                  {user.email}
                  {user.phone ? ` · ${user.phone}` : ""}
                </span>
                <span>
                  {fill(t.approvals.signedUp, { date: formatDateTime(user.createdAt) })}
                  {profile?.intakeCompletedAt
                    ? ` · ${fill(t.approvals.intakeDone, { date: formatDateTime(profile.intakeCompletedAt) })}`
                    : ""}
                </span>
                <Link href={`/admin/members/${user.id}`} className="underline underline-offset-4">
                  {t.approvals.viewDetail}
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <form action={approveMember} className="flex flex-col gap-3">
                <input type="hidden" name="userId" value={user.id} />
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`plan-${user.id}`}>{t.approvals.plan}</Label>
                  <NativeSelect
                    className="w-full"
                    id={`plan-${user.id}`}
                    name="planId"
                    required
                    disabled={plans.length === 0}
                  >
                    {plans.map((plan) => (
                      <NativeSelectOption key={plan.id} value={plan.id}>
                        {plan.name} · {formatMoney(plan.monthlyPrice)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`start-${user.id}`}>{t.approvals.startsOn}</Label>
                  <Input id={`start-${user.id}`} name="startsOn" type="date" defaultValue={todayKey} required />
                </div>
                <Button type="submit" size="sm" className="self-start" disabled={plans.length === 0}>
                  {t.approvals.approve}
                </Button>
              </form>
              <form action={rejectMember} className="flex flex-col gap-3">
                <input type="hidden" name="userId" value={user.id} />
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`note-${user.id}`}>{t.approvals.rejectNote}</Label>
                  <Textarea id={`note-${user.id}`} name="note" placeholder={t.approvals.rejectNotePlaceholder} />
                </div>
                <Button type="submit" size="sm" variant="destructive" className="self-start">
                  {t.approvals.reject}
                </Button>
              </form>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
