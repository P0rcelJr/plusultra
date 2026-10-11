import type { Metadata } from "next";
import Link from "next/link";
import { accountState } from "@/domain/account";
import type { Role, UserStatus } from "@/generated/prisma/client";
import { Notice } from "@/components/notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fill, t } from "@/i18n";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { listMembers } from "@/lib/members";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: t.members.title };

const STATUSES: UserStatus[] = ["PENDING", "ACTIVE", "INACTIVE"];
const ROLES: Role[] = ["MEMBER", "COACH", "ADMIN"];

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function MembersPage({ searchParams }: PageProps<"/admin/members">) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const q = one(params.q).trim();
  const status = one(params.status);
  const role = one(params.role);
  const planId = one(params.planId);

  const [members, plans] = await Promise.all([
    listMembers({
      q: q || undefined,
      status: STATUSES.includes(status as UserStatus) ? (status as UserStatus) : undefined,
      role: ROLES.includes(role as Role) ? (role as Role) : undefined,
      planId: planId || undefined,
    }),
    db.membershipPlan.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Notice notice={params.notice} error={params.error} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">{t.members.title}</h1>
          <p className="text-sm text-muted-foreground">{t.members.description}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/members/new" />} size="sm">
          {t.members.new}
        </Button>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <Input name="q" defaultValue={q} placeholder={t.members.searchPlaceholder} className="w-56" />
        <NativeSelect>
          <select name="status" defaultValue={status} aria-label={t.members.status}>
            <NativeSelectOption value="">{t.members.status}: {t.common.all}</NativeSelectOption>
            {STATUSES.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {t.status[s]}
              </NativeSelectOption>
            ))}
          </select>
        </NativeSelect>
        <NativeSelect>
          <select name="role" defaultValue={role} aria-label={t.members.role}>
            <NativeSelectOption value="">{t.members.role}: {t.common.all}</NativeSelectOption>
            {ROLES.map((r) => (
              <NativeSelectOption key={r} value={r}>
                {t.roles[r]}
              </NativeSelectOption>
            ))}
          </select>
        </NativeSelect>
        <NativeSelect>
          <select name="planId" defaultValue={planId} aria-label={t.members.plan}>
            <NativeSelectOption value="">{t.members.plan}: {t.common.all}</NativeSelectOption>
            {plans.map((plan) => (
              <NativeSelectOption key={plan.id} value={plan.id}>
                {plan.name}
                {plan.active ? "" : ` (${t.plans.archived.toLowerCase()})`}
              </NativeSelectOption>
            ))}
          </select>
        </NativeSelect>
        <Button type="submit" variant="outline" size="sm">
          {t.members.filter}
        </Button>
        <Button nativeButton={false} render={<Link href="/admin/members" />} variant="ghost" size="sm">
          {t.members.clear}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">{fill(t.members.count, { n: members.length })}</p>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.members.empty}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.members.columns.name}</TableHead>
              <TableHead>{t.members.columns.email}</TableHead>
              <TableHead>{t.members.columns.role}</TableHead>
              <TableHead>{t.members.columns.state}</TableHead>
              <TableHead>{t.members.columns.plan}</TableHead>
              <TableHead>{t.members.columns.period}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const state = accountState(member, member.profile);
              return (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/members/${member.id}`} className="underline underline-offset-4">
                      {member.name}
                    </Link>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{t.roles[member.role]}</TableCell>
                  <TableCell>
                    <Badge variant={state === "active" ? "default" : state === "inactive" ? "destructive" : "secondary"}>
                      {t.accountState[state]}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.current?.plan.name ?? t.common.none}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.current
                      ? `${formatDate(member.current.startsOn)} – ${
                          member.current.endsOn ? formatDate(member.current.endsOn) : t.memberDetail.openEnded
                        }`
                      : t.common.none}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
