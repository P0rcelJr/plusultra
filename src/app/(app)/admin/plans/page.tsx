import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fill, t } from "@/i18n";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { setPlanActive } from "./actions";

export const metadata: Metadata = { title: t.plans.title };

export default async function PlansPage({ searchParams }: PageProps<"/admin/plans">) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const plans = await db.membershipPlan.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <Notice notice={params.notice} error={params.error} />
      <Card>
        <CardHeader>
          <CardTitle>{t.plans.title}</CardTitle>
          <CardDescription>{t.plans.description}</CardDescription>
          <div className="mt-2">
            <Button nativeButton={false} render={<Link href="/admin/plans/new" />} size="sm">
              {t.plans.new}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.plans.empty}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.plans.name}</TableHead>
                  <TableHead>{t.plans.monthlyPrice}</TableHead>
                  <TableHead>{t.plans.weeklyClassQuota}</TableHead>
                  <TableHead>{t.plans.includesTrainingPlan}</TableHead>
                  <TableHead>{t.members.status}</TableHead>
                  <TableHead className="text-right">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{formatMoney(plan.monthlyPrice)}</TableCell>
                    <TableCell>
                      {plan.weeklyClassQuota === null
                        ? t.common.unlimited
                        : fill(t.plans.classesPerWeek, { n: plan.weeklyClassQuota })}
                    </TableCell>
                    <TableCell>{plan.includesTrainingPlan ? t.common.yes : t.common.no}</TableCell>
                    <TableCell>
                      <Badge variant={plan.active ? "default" : "outline"}>
                        {plan.active ? t.plans.active : t.plans.archived}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button nativeButton={false} render={<Link href={`/admin/plans/${plan.id}`} />} variant="outline" size="sm">
                          {t.common.edit}
                        </Button>
                        <form action={setPlanActive}>
                          <input type="hidden" name="id" value={plan.id} />
                          <input type="hidden" name="active" value={plan.active ? "false" : "true"} />
                          <Button type="submit" variant="ghost" size="sm">
                            {plan.active ? t.plans.archive : t.plans.restore}
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="mt-4 text-xs text-muted-foreground">{t.plans.archivedHint}</p>
        </CardContent>
      </Card>
    </div>
  );
}
