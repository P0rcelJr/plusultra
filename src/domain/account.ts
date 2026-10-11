import type { UserStatus } from "@/generated/prisma/client";

/**
 * Where a member stands in the onboarding lifecycle (decisions 13, 21). Every screen that branches
 * on status derives it from here, from the current database row rather than the login-time JWT.
 */
export type AccountState = "unverified" | "intake_pending" | "awaiting_approval" | "active" | "inactive";

export type AccountUser = { status: UserStatus; emailVerifiedAt: Date | null };
export type AccountProfile = { intakeCompletedAt: Date | null } | null;

export function accountState(user: AccountUser, profile: AccountProfile): AccountState {
  if (user.status === "INACTIVE") return "inactive";
  if (user.status === "ACTIVE") return "active";
  if (user.emailVerifiedAt === null) return "unverified";
  if (!profile || profile.intakeCompletedAt === null) return "intake_pending";
  return "awaiting_approval";
}

/** The intake form is only reachable once the email is verified (decision 21). */
export function canFillIntake(state: AccountState): boolean {
  return state !== "unverified" && state !== "inactive";
}
