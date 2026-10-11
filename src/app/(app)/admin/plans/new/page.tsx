import type { Metadata } from "next";
import { PlanForm } from "@/components/plan-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";
import { requireRole } from "@/lib/session";
import { createPlan } from "../actions";

export const metadata: Metadata = { title: t.plans.new };

export default async function NewPlanPage() {
  await requireRole("ADMIN");
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{t.plans.new}</CardTitle>
      </CardHeader>
      <CardContent>
        <PlanForm
          action={createPlan}
          initial={{ name: "", monthlyPrice: "", weeklyClassQuota: "", includesTrainingPlan: false }}
        />
      </CardContent>
    </Card>
  );
}
