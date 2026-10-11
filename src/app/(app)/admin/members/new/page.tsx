import type { Metadata } from "next";
import { dateKeyFor } from "@/domain/time";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { NewMemberForm } from "./new-member-form";

export const metadata: Metadata = { title: t.members.newTitle };

export default async function NewMemberPage() {
  await requireRole("ADMIN");
  const plans = await db.membershipPlan.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{t.members.newTitle}</CardTitle>
        <CardDescription>{t.members.newDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <NewMemberForm
          plans={plans.map((plan) => ({ id: plan.id, name: plan.name, priceLabel: formatMoney(plan.monthlyPrice) }))}
          today={dateKeyFor(new Date())}
        />
      </CardContent>
    </Card>
  );
}
