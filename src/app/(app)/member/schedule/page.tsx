import type { Metadata } from "next";
import { Notice } from "@/components/notice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bookingWindowEnd, canBook } from "@/domain/booking";
import { addCalendarDays, dateKeyFor, fromDateKey, gymToday, toDateKey } from "@/domain/time";
import { fill, t } from "@/i18n";
import { currentPlanFor } from "@/lib/booking";
import { db } from "@/lib/db";
import { formatDayHeading, formatTime } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { bookMySession } from "./actions";

export const metadata: Metadata = { title: t.memberSchedule.title };

/**
 * The days inside the booking window (decision 9), each session with spots left and either a book
 * button or the reason the member cannot book. Pending and inactive members see it too (A1).
 */
export default async function MemberSchedulePage({ searchParams }: PageProps<"/member/schedule">) {
  const params = await searchParams;
  const user = await requireRole("MEMBER");
  const now = new Date();
  const [settings, plan] = await Promise.all([getSettings(), currentPlanFor(user.id, now)]);
  const windowEnd = bookingWindowEnd(now, settings);

  const sessions = await db.classSession.findMany({
    where: { startsAt: { gt: now, lte: windowEnd } },
    include: {
      classType: { select: { name: true } },
      coach: { select: { name: true } },
      _count: { select: { bookings: { where: { status: "BOOKED" } } } },
      bookings: { where: { memberId: user.id, status: "BOOKED" }, select: { id: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const today = gymToday(now);
  const lastDay = fromDateKey(dateKeyFor(windowEnd)) as Date;
  const days: Date[] = [];
  for (let day = today; day.getTime() <= lastDay.getTime(); day = addCalendarDays(day, 1)) days.push(day);

  const banner =
    user.status === "INACTIVE"
      ? t.memberSchedule.inactiveBanner
      : user.status !== "ACTIVE" || plan === null
        ? t.memberSchedule.noPlanBanner
        : null;

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Notice notice={params.notice} error={params.error} />
      <div>
        <h1 className="text-lg font-medium">{t.memberSchedule.title}</h1>
        <p className="text-sm text-muted-foreground">
          {fill(t.memberSchedule.window, { days: settings.bookingWindowDays })}
        </p>
      </div>
      {banner ? (
        <Alert>
          <AlertDescription>{banner}</AlertDescription>
        </Alert>
      ) : null}

      {days.map((day) => {
        const key = toDateKey(day);
        const daySessions = sessions.filter((session) => dateKeyFor(session.startsAt) === key);
        return (
          <section key={key} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium capitalize">{formatDayHeading(day)}</h2>
            {daySessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t.memberSchedule.noSessions}</p>
            ) : (
              daySessions.map((session) => {
                const bookedCount = session._count.bookings;
                const result = canBook({
                  member: user,
                  plan,
                  session,
                  bookedCount,
                  alreadyBooked: session.bookings.length > 0,
                  now,
                  settings,
                });
                return (
                  <div key={session.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex flex-col gap-0.5 text-sm">
                      <span>
                        <span className="font-medium">{formatTime(session.startsAt)}</span>{" "}
                        <span className={session.status === "CANCELLED" ? "line-through" : ""}>
                          {session.classType.name}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">{session.coach.name}</span>
                      {session.status === "SCHEDULED" ? (
                        <span className="text-xs text-muted-foreground">
                          {fill(t.memberSchedule.spots, {
                            left: Math.max(session.capacity - bookedCount, 0),
                            capacity: session.capacity,
                          })}
                        </span>
                      ) : null}
                    </div>
                    {result.ok ? (
                      <form action={bookMySession}>
                        <input type="hidden" name="sessionId" value={session.id} />
                        <Button type="submit" size="sm">
                          {t.memberSchedule.book}
                        </Button>
                      </form>
                    ) : (
                      <Badge
                        variant={result.reason === "already_booked" ? "default" : "outline"}
                        className="shrink-0"
                      >
                        {t.memberSchedule.reasons[result.reason]}
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </section>
        );
      })}
    </div>
  );
}
