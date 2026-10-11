import { occurrencesFor } from "@/domain/schedule";
import { addCalendarDays, gymToday } from "@/domain/time";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

/**
 * Inserts the missing sessions of every open template from today up to today + the materialize
 * horizon (A4). Occurrences that already started are skipped. Idempotent: the unique key on
 * (template, start) lets repeated runs, or two runs racing, insert each occurrence once.
 * Returns the number of rows inserted.
 */
export async function materializeSessions(now: Date = new Date()): Promise<number> {
  const settings = await getSettings();
  const from = gymToday(now);
  const to = addCalendarDays(from, settings.materializeHorizonWeeks * 7);

  const templates = await db.scheduleTemplate.findMany({
    where: { startsOn: { lt: to }, OR: [{ endsOn: null }, { endsOn: { gt: from } }] },
  });

  const rows = templates.flatMap((template) =>
    occurrencesFor(template, from, to)
      .filter((occurrence) => occurrence.startsAt.getTime() > now.getTime())
      .map((occurrence) => ({
        templateId: template.id,
        classTypeId: template.classTypeId,
        coachId: template.coachId,
        capacity: template.capacity,
        startsAt: occurrence.startsAt,
        endsAt: occurrence.endsAt,
      })),
  );
  if (rows.length === 0) return 0;

  const { count } = await db.classSession.createMany({ data: rows, skipDuplicates: true });
  return count;
}
