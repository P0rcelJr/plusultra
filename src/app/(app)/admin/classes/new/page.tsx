import type { Metadata } from "next";
import { ClassTypeForm } from "@/components/class-type-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";
import { requireRole } from "@/lib/session";
import { createClassType } from "../actions";

export const metadata: Metadata = { title: t.classTypes.new };

export default async function NewClassTypePage() {
  await requireRole("ADMIN");
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{t.classTypes.new}</CardTitle>
      </CardHeader>
      <CardContent>
        <ClassTypeForm
          action={createClassType}
          initial={{ name: "", description: "", durationMinutes: "60", capacity: "" }}
        />
      </CardContent>
    </Card>
  );
}
