import { planChangeEffects } from "@/domain/subscriptions";
import { db } from "@/lib/db";

/**
 * Assigns a plan from `startsOn` (decisions 13, 19): the running row is closed on that day, rows that
 * had not started are dropped, a new row opens, and a PENDING account becomes ACTIVE (assigning a plan
 * is the approval). Returns false when the plan cannot be assigned.
 */
export async function assignPlan(userId: string, planId: string, startsOn: Date): Promise<boolean> {
  const plan = await db.membershipPlan.findUnique({ where: { id: planId }, select: { active: true } });
  if (!plan?.active) return false;

  const existing = await db.subscription.findMany({ where: { userId } });
  const { close, remove } = planChangeEffects(existing, startsOn);

  await db.$transaction([
    ...close.map((s) => db.subscription.update({ where: { id: s.id }, data: { endsOn: startsOn } })),
    ...(remove.length > 0 ? [db.subscription.deleteMany({ where: { id: { in: remove.map((s) => s.id) } } })] : []),
    db.subscription.create({ data: { userId, planId, startsOn } }),
    db.user.updateMany({ where: { id: userId, status: "PENDING" }, data: { status: "ACTIVE" } }),
  ]);
  return true;
}

/** Closes every row still open on `endsOn` (decision 19: cancel sets ends_on). */
export async function closeOpenSubscriptions(userId: string, endsOn: Date): Promise<number> {
  const existing = await db.subscription.findMany({ where: { userId } });
  const { close, remove } = planChangeEffects(existing, endsOn);
  if (close.length === 0 && remove.length === 0) return 0;
  await db.$transaction([
    ...close.map((s) => db.subscription.update({ where: { id: s.id }, data: { endsOn } })),
    ...(remove.length > 0 ? [db.subscription.deleteMany({ where: { id: { in: remove.map((s) => s.id) } } })] : []),
  ]);
  return close.length + remove.length;
}
