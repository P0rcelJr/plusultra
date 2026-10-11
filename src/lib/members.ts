import { subscriptionCovering } from "@/domain/subscriptions";
import { gymToday } from "@/domain/time";
import type { Prisma, Role, UserStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type MemberFilters = {
  q?: string;
  status?: UserStatus;
  planId?: string;
  role?: Role;
};

/** Member list with search and filters (decision 13). "Current plan" is the row covering today. */
export async function listMembers(filters: MemberFilters) {
  const today = gymToday();
  const where: Prisma.UserWhereInput = {};
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.role) where.role = filters.role;
  if (filters.planId) {
    where.subscriptions = {
      some: { planId: filters.planId, startsOn: { lte: today }, OR: [{ endsOn: null }, { endsOn: { gt: today } }] },
    };
  }
  const users = await db.user.findMany({
    where,
    include: { profile: { select: { intakeCompletedAt: true } }, subscriptions: { include: { plan: true } } },
    orderBy: { name: "asc" },
  });
  return users.map((user) => ({ ...user, current: subscriptionCovering(user.subscriptions, today) }));
}

export async function getMemberDetail(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      profile: true,
      subscriptions: { include: { plan: true }, orderBy: { startsOn: "desc" } },
    },
  });
  if (!user) return null;
  return { ...user, current: subscriptionCovering(user.subscriptions, gymToday()) };
}
