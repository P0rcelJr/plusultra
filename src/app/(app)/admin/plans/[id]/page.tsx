import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlanForm } from "@/components/plan-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { updatePlan } from "../actions";

export const metadata: Metadata = { title: t.plans.editTitle };

export default async function EditPlanPage({ params }: PageProps<"/admin/plans/[id]">) {
  await requireRole("ADMIN");
  const { id } = await params;
  const plan = await db.membershipPlan.findUnique({ where: { id } });
  if (!plan) notFound();

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{t.plans.editTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <PlanForm
          action={updatePlan}
          initial={{
            id: plan.id,
            name: plan.name,
            monthlyPrice: String(plan.monthlyPrice),
            weeklyClassQuota: plan.weeklyClassQuota === null ? "" : String(plan.weeklyClassQuota),
            includesTrainingPlan: plan.includesTrainingPlan,
          }}
        />
      </CardContent>
    </Card>
  );
}
