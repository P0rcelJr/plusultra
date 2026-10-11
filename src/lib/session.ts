import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { homeFor } from "@/lib/routes";

/** The proxy already gates routes; pages call this too so a misconfigured matcher never leaks data. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(...roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) redirect(homeFor(session.user.role));
  return session;
}
