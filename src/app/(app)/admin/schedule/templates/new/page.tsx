import type { Metadata } from "next";
import { TemplateForm } from "@/components/template-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dateKeyFor } from "@/domain/time";
import { t } from "@/i18n";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { createTemplates } from "../actions";

export const metadata: Metadata = { title: t.templates.new };

export default async function NewTemplatePage() {
  await requireRole("ADMIN");
  const [classTypes, coaches] = await Promise.all([
    db.classType.findMany({
      where: { active: true },
      select: { id: true, name: true, durationMinutes: true, capacity: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { role: { in: ["COACH", "ADMIN"] }, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const missing = classTypes.length === 0 ? t.templates.noClassTypes : coaches.length === 0 ? t.templates.noCoaches : null;

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{t.templates.new}</CardTitle>
      </CardHeader>
      <CardContent>
        {missing ? (
          <Alert>
            <AlertDescription>{missing}</AlertDescription>
          </Alert>
        ) : (
          <TemplateForm
            action={createTemplates}
            classTypes={classTypes}
            coaches={coaches}
            defaultStartsOn={dateKeyFor(new Date())}
          />
        )}
      </CardContent>
    </Card>
  );
}
