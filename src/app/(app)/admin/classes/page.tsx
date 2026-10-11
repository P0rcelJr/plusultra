import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fill, t } from "@/i18n";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { setClassTypeActive } from "./actions";

export const metadata: Metadata = { title: t.classTypes.title };

export default async function ClassTypesPage({ searchParams }: PageProps<"/admin/classes">) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const classTypes = await db.classType.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <Notice notice={params.notice} error={params.error} />
      <Card>
        <CardHeader>
          <CardTitle>{t.classTypes.title}</CardTitle>
          <CardDescription>{t.classTypes.description}</CardDescription>
          <div className="mt-2">
            <Button nativeButton={false} render={<Link href="/admin/classes/new" />} size="sm">
              {t.classTypes.new}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {classTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.classTypes.empty}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.classTypes.name}</TableHead>
                  <TableHead>{t.classTypes.durationMinutes}</TableHead>
                  <TableHead>{t.classTypes.capacity}</TableHead>
                  <TableHead>{t.members.status}</TableHead>
                  <TableHead className="text-right">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classTypes.map((classType) => (
                  <TableRow key={classType.id}>
                    <TableCell className="max-w-xs whitespace-normal">
                      <div className="font-medium">{classType.name}</div>
                      {classType.description ? (
                        <div className="text-xs text-muted-foreground">{classType.description}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>{fill(t.classTypes.minutes, { n: classType.durationMinutes })}</TableCell>
                    <TableCell>{fill(t.classTypes.people, { n: classType.capacity })}</TableCell>
                    <TableCell>
                      <Badge variant={classType.active ? "default" : "outline"}>
                        {classType.active ? t.classTypes.active : t.classTypes.archived}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          nativeButton={false}
                          render={<Link href={`/admin/classes/${classType.id}`} />}
                          variant="outline"
                          size="sm"
                        >
                          {t.common.edit}
                        </Button>
                        <form action={setClassTypeActive}>
                          <input type="hidden" name="id" value={classType.id} />
                          <input type="hidden" name="active" value={classType.active ? "false" : "true"} />
                          <Button type="submit" variant="ghost" size="sm">
                            {classType.active ? t.classTypes.archive : t.classTypes.restore}
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="mt-4 text-xs text-muted-foreground">{t.classTypes.archivedHint}</p>
        </CardContent>
      </Card>
    </div>
  );
}
