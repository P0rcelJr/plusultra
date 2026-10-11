import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { accountState } from "@/domain/account";
import { parqFlagged, parseParq } from "@/domain/parq";
import { ageOn, dateKeyFor, gymToday } from "@/domain/time";
import type { Role } from "@/generated/prisma/client";
import { IntakeForm } from "@/components/intake-form";
import { Notice } from "@/components/notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fill, t } from "@/i18n";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { intakeFormValues } from "@/lib/intake";
import { getMemberDetail } from "@/lib/members";
import { requireRole } from "@/lib/session";
import {
  cancelMemberSubscription,
  changeMemberPlan,
  changeMemberRole,
  deactivateMember,
  reactivateMember,
  saveMemberIntake,
  sendPasswordLink,
} from "../actions";
import { AccountForm } from "./account-form";

export const metadata: Metadata = { title: t.members.title };

const ROLES: Role[] = ["MEMBER", "COACH", "ADMIN"];

export default async function MemberDetailPage({ params, searchParams }: PageProps<"/admin/members/[id]">) {
  const admin = await requireRole("ADMIN");
  const { id } = await params;
  const query = await searchParams;
  const [member, plans] = await Promise.all([
    getMemberDetail(id),
    db.membershipPlan.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  if (!member) notFound();

  const state = accountState(member, member.profile);
  const parq = parseParq(member.profile?.healthQuestionnaire);
  const flagged = parq ? parqFlagged(parq) : false;
  const isSelf = member.id === admin.id;
  const todayKey = dateKeyFor(new Date());
  const today = gymToday();

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <Notice notice={query.notice} error={query.error} />

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-medium">{member.name}</h1>
        <Badge variant="secondary">{t.roles[member.role]}</Badge>
        <Badge variant={state === "active" ? "default" : state === "inactive" ? "destructive" : "outline"}>
          {t.accountState[state]}
        </Badge>
        {flagged ? <Badge variant="destructive">{t.intake.parqFlagged}</Badge> : null}
      </div>
      <p className="text-sm text-muted-foreground">
        {fill(t.memberDetail.createdAt, { date: formatDateTime(member.createdAt) })}
        {" · "}
        {member.emailVerifiedAt
          ? fill(t.memberDetail.verifiedAt, { date: formatDateTime(member.emailVerifiedAt) })
          : t.memberDetail.notVerified}
        {" · "}
        {member.profile?.intakeCompletedAt
          ? fill(t.intake.completedAt, { date: formatDateTime(member.profile.intakeCompletedAt) })
          : t.intake.notCompleted}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>{t.memberDetail.account}</CardTitle>
          <CardDescription>{t.memberDetail.accountDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountForm user={member} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.memberDetail.subscription}</CardTitle>
          <CardDescription>
            {t.memberDetail.currentPlan}:{" "}
            {member.current ? (
              <span className="text-foreground">
                {member.current.plan.name} · {formatMoney(member.current.plan.monthlyPrice)}
                {t.plans.perMonth}
              </span>
            ) : (
              t.member.noPlan
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <form action={changeMemberPlan} className="flex flex-col gap-3">
              <input type="hidden" name="userId" value={member.id} />
              <div>
                <h3 className="text-sm font-medium">{t.memberDetail.changePlan}</h3>
                <p className="text-xs text-muted-foreground">{t.memberDetail.changePlanHint}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="planId">{t.members.plan}</Label>
                <NativeSelect className="w-full" id="planId" name="planId" required disabled={plans.length === 0}>
                  {plans.map((plan) => (
                    <NativeSelectOption key={plan.id} value={plan.id}>
                      {plan.name} · {formatMoney(plan.monthlyPrice)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="startsOn">{t.memberDetail.startsOn}</Label>
                <Input id="startsOn" name="startsOn" type="date" defaultValue={todayKey} required />
              </div>
              <Button type="submit" size="sm" className="self-start" disabled={plans.length === 0}>
                {t.memberDetail.changePlan}
              </Button>
            </form>

            <form action={cancelMemberSubscription} className="flex flex-col gap-3">
              <input type="hidden" name="userId" value={member.id} />
              <div>
                <h3 className="text-sm font-medium">{t.memberDetail.cancelSubscription}</h3>
                <p className="text-xs text-muted-foreground">{t.memberDetail.cancelHint}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="endsOn">{t.memberDetail.endsOn}</Label>
                <Input id="endsOn" name="endsOn" type="date" defaultValue={todayKey} required />
              </div>
              <Button type="submit" size="sm" variant="destructive" className="self-start" disabled={!member.current}>
                {t.memberDetail.cancelSubscription}
              </Button>
            </form>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t.memberDetail.history}</h3>
            {member.subscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.memberDetail.noHistory}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.members.plan}</TableHead>
                    <TableHead>{t.memberDetail.startsOn}</TableHead>
                    <TableHead>{t.memberDetail.endsOn}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {member.subscriptions.map((row) => (
                    <TableRow key={row.id} className={row.id === member.current?.id ? "font-medium" : undefined}>
                      <TableCell>{row.plan.name}</TableCell>
                      <TableCell>{formatDate(row.startsOn)}</TableCell>
                      <TableCell>{row.endsOn ? formatDate(row.endsOn) : t.memberDetail.openEnded}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.memberDetail.actions}</CardTitle>
          {isSelf ? <CardDescription>{t.memberDetail.ownAccount}</CardDescription> : null}
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-6">
          <form action={changeMemberRole} className="flex flex-col gap-2">
            <input type="hidden" name="userId" value={member.id} />
            <Label htmlFor="role">{t.memberDetail.changeRole}</Label>
            <div className="flex gap-2">
              <NativeSelect id="role" name="role" defaultValue={member.role} disabled={isSelf}>
                {ROLES.map((role) => (
                  <NativeSelectOption key={role} value={role}>
                    {t.roles[role]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Button type="submit" variant="outline" size="sm" disabled={isSelf}>
                {t.common.save}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t.memberDetail.changeRoleHint}</p>
          </form>

          {member.status === "INACTIVE" ? (
            <form action={reactivateMember}>
              <input type="hidden" name="userId" value={member.id} />
              <Button type="submit" variant="outline" size="sm">
                {t.memberDetail.reactivate}
              </Button>
            </form>
          ) : (
            <form action={deactivateMember} className="flex flex-col gap-1">
              <input type="hidden" name="userId" value={member.id} />
              <Button type="submit" variant="destructive" size="sm" disabled={isSelf}>
                {t.memberDetail.deactivate}
              </Button>
              <p className="text-xs text-muted-foreground">{t.memberDetail.deactivateHint}</p>
            </form>
          )}

          <form action={sendPasswordLink}>
            <input type="hidden" name="userId" value={member.id} />
            <Button type="submit" variant="outline" size="sm">
              {t.memberDetail.sendPasswordLink}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t.memberDetail.intake}
            {member.profile?.dateOfBirth ? (
              <span className="text-sm font-normal text-muted-foreground">
                {fill(t.intake.age, { age: ageOn(member.profile.dateOfBirth, today) })}
              </span>
            ) : null}
          </CardTitle>
          <CardDescription>{t.memberDetail.intakeDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <IntakeForm
            action={saveMemberIntake}
            initial={intakeFormValues(member.profile)}
            photoUrl={member.profile?.photoFilename ? `/api/photos/${member.id}` : null}
            staff
            submitLabel={t.intake.update}
            hidden={{ userId: member.id }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
