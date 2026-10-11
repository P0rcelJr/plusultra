import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WEEKDAYS } from "@/domain/schedule";
import { fill, t } from "@/i18n";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: t.templates.title };

export default async function TemplatesPage({ searchParams }: PageProps<"/admin/schedule/templates">) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const templates = await db.scheduleTemplate.findMany({
    include: { classType: true, coach: { select: { name: true } } },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }, { startsOn: "asc" }],
  });
  const days = WEEKDAYS.map((weekday) => ({
    weekday,
    templates: templates.filter((template) => template.weekday === weekday),
  })).filter((day) => day.templates.length > 0);

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <Notice notice={params.notice} error={params.error} />
      <Card>
        <CardHeader>
          <CardTitle>{t.templates.title}</CardTitle>
          <CardDescription>{t.templates.description}</CardDescription>
          <div className="mt-2 flex gap-2">
            <Button nativeButton={false} render={<Link href="/admin/schedule/templates/new" />} size="sm">
              {t.templates.new}
            </Button>
            <Button nativeButton={false} render={<Link href="/admin/schedule" />} variant="outline" size="sm">
              {t.templates.viewSchedule}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {days.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.templates.empty}</p>
          ) : (
            days.map((day) => (
              <section key={day.weekday} className="flex flex-col gap-2">
                <h2 className="text-sm font-medium">{t.weekdays[day.weekday]}</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">{t.templates.startTime}</TableHead>
                      <TableHead>{t.templates.classType}</TableHead>
                      <TableHead>{t.templates.coach}</TableHead>
                      <TableHead>{t.templates.capacity}</TableHead>
                      <TableHead>{t.templates.period}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {day.templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.startTime}</TableCell>
                        <TableCell>
                          {template.classType.name}
                          <span className="text-muted-foreground">
                            {" · "}
                            {fill(t.classTypes.minutes, { n: template.durationMinutes })}
                          </span>
                        </TableCell>
                        <TableCell>{template.coach.name}</TableCell>
                        <TableCell>{fill(t.classTypes.people, { n: template.capacity })}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(template.startsOn)} –{" "}
                          {template.endsOn ? formatDate(template.endsOn) : t.templates.openEnded}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
