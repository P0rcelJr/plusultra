import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { homeFor } from "@/lib/routes";

/** The proxy already gates routes; pages call this too so a misconfigured matcher never leaks data. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/**
 * The JWT carries role and status from login time, so it goes stale after an approval or a role
 * change. Anything that renders or decides on current status reads the user row through here.
 */
export async function currentUser() {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });
  if (!user) throw new Error("Signed-in user no longer exists");
  return user;
}

export type CurrentUser = Awaited<ReturnType<typeof currentUser>>;

/** Role check against the database row, used by pages and by every server action that mutates data. */
export async function requireRole(...roles: Role[]) {
  const user = await currentUser();
  if (!roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}
