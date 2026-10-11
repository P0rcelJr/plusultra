import { canBook, type CanBookResult } from "@/domain/booking";
import { subscriptionCovering } from "@/domain/subscriptions";
import { gymToday } from "@/domain/time";
import type { UserStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

/** The plan of the subscription covering today (decision 19), or null when none does. */
export async function currentPlanFor(userId: string, now: Date = new Date()) {
  const subscriptions = await db.subscription.findMany({ where: { userId }, include: { plan: true } });
  return subscriptionCovering(subscriptions, gymToday(now))?.plan ?? null;
}

/**
 * Books a session for a member (decision 9). The session row is locked with `SELECT … FOR UPDATE`
 * before seats are counted, so two members racing for the last seat, or a double submit, are
 * serialized: the second transaction waits, then sees the first one's row and is refused.
 */
export async function bookSession(
  member: { id: string; status: UserStatus },
  sessionId: string,
  now: Date = new Date(),
): Promise<CanBookResult | { ok: false; reason: "not_found" }> {
  const [settings, plan] = await Promise.all([getSettings(), currentPlanFor(member.id, now)]);

  return db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM sessions WHERE id = ${sessionId} FOR UPDATE`;
    if (locked.length === 0) return { ok: false, reason: "not_found" } as const;

    const session = await tx.classSession.findUniqueOrThrow({
      where: { id: sessionId },
      select: { startsAt: true, status: true, capacity: true },
    });
    const [bookedCount, own] = await Promise.all([
      tx.booking.count({ where: { sessionId, status: "BOOKED" } }),
      tx.booking.count({ where: { sessionId, memberId: member.id, status: "BOOKED" } }),
    ]);

    const result = canBook({ member, plan, session, bookedCount, alreadyBooked: own > 0, now, settings });
    if (!result.ok) return result;

    await tx.booking.create({ data: { sessionId, memberId: member.id, bookedById: member.id } });
    return result;
  });
}
