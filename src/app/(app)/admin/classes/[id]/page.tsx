import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClassTypeForm } from "@/components/class-type-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { updateClassType } from "../actions";

export const metadata: Metadata = { title: t.classTypes.editTitle };

export default async function EditClassTypePage({ params }: PageProps<"/admin/classes/[id]">) {
  await requireRole("ADMIN");
  const { id } = await params;
  const classType = await db.classType.findUnique({ where: { id } });
  if (!classType) notFound();

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{t.classTypes.editTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ClassTypeForm
          action={updateClassType}
          initial={{
            id: classType.id,
            name: classType.name,
            description: classType.description ?? "",
            durationMinutes: String(classType.durationMinutes),
            capacity: String(classType.capacity),
          }}
        />
      </CardContent>
    </Card>
  );
}
