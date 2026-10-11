import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addCalendarDays, dateKeyFor, fromDateKey, gymInstant, gymToday, toDateKey, weekBoundsFor } from "@/domain/time";
import { fill, t } from "@/i18n";
import { db } from "@/lib/db";
import { formatDate, formatDayHeading, formatTime } from "@/lib/format";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: t.schedule.title };

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/** Monday-to-Sunday week view (decision 8). `?week=YYYY-MM-DD` picks the week containing that day. */
export default async function SchedulePage({ searchParams }: PageProps<"/admin/schedule">) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const picked = fromDateKey(one(params.week)) ?? gymToday();
  // Noon local is safely inside the picked day, so the week is the one the admin asked for.
  const bounds = weekBoundsFor(gymInstant(picked, 12, 0));
  const monday = fromDateKey(dateKeyFor(bounds.start)) as Date;
  const days = Array.from({ length: 7 }, (_, i) => addCalendarDays(monday, i));
  const sunday = days[6];

  const sessions = await db.classSession.findMany({
    where: { startsAt: { gte: bounds.start, lt: bounds.end } },
    include: { classType: { select: { name: true } }, coach: { select: { name: true } } },
    orderBy: { startsAt: "asc" },
  });
  const todayKey = dateKeyFor(new Date());

  return (
    <div className="flex flex-col gap-4">
      <Notice notice={params.notice} error={params.error} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">{t.schedule.title}</h1>
          <p className="text-sm text-muted-foreground">
            {fill(t.schedule.weekOf, { from: formatDate(monday), to: formatDate(sunday) })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            nativeButton={false}
            render={<Link href={`/admin/schedule?week=${toDateKey(addCalendarDays(monday, -7))}`} />}
            variant="outline"
            size="sm"
          >
            {t.schedule.previousWeek}
          </Button>
          <Button nativeButton={false} render={<Link href="/admin/schedule" />} variant="outline" size="sm">
            {t.schedule.thisWeek}
          </Button>
          <Button
            nativeButton={false}
            render={<Link href={`/admin/schedule?week=${toDateKey(addCalendarDays(monday, 7))}`} />}
            variant="outline"
            size="sm"
          >
            {t.schedule.nextWeek}
          </Button>
          <Button nativeButton={false} render={<Link href="/admin/schedule/templates" />} size="sm">
            {t.schedule.templatesLink}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => {
          const key = toDateKey(day);
          const daySessions = sessions.filter((session) => dateKeyFor(session.startsAt) === key);
          return (
            <section
              key={key}
              className={`flex flex-col gap-2 rounded-lg border p-2 ${key === todayKey ? "border-primary" : ""}`}
            >
              <h2 className="text-sm font-medium capitalize">{formatDayHeading(day)}</h2>
              {daySessions.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t.schedule.noSessions}</p>
              ) : (
                daySessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex flex-col gap-1 rounded-md bg-muted/50 p-2 text-sm ${
                      session.status === "CANCELLED" ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">{formatTime(session.startsAt)}</span>
                      <span className="text-xs text-muted-foreground" title={t.schedule.bookedLabel}>
                        {/* Bookings arrive with the booking slice; until then every session is empty. */}
                        {fill(t.schedule.booked, { booked: 0, capacity: session.capacity })}
                      </span>
                    </div>
                    <span className={session.status === "CANCELLED" ? "line-through" : ""}>
                      {session.classType.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{session.coach.name}</span>
                    <Badge variant={session.status === "CANCELLED" ? "destructive" : "secondary"} className="self-start">
                      {t.schedule.status[session.status]}
                    </Badge>
                  </div>
                ))
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
