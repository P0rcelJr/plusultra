import type { AuthTokenType } from "@/generated/prisma/client";

const HOUR = 60 * 60 * 1000;

/** Verification links last 24 h; password reset and set-password links last 1 h. */
export const TOKEN_TTL_MS: Record<AuthTokenType, number> = {
  EMAIL_VERIFY: 24 * HOUR,
  PASSWORD_RESET: 1 * HOUR,
};

export function tokenExpiry(type: AuthTokenType, issuedAt: Date): Date {
  return new Date(issuedAt.getTime() + TOKEN_TTL_MS[type]);
}

export type StoredToken = { expiresAt: Date; usedAt: Date | null };

/** A token is valid while it is unused and not yet expired (expiry instant itself is expired). */
export function isTokenValid(token: StoredToken, now: Date): boolean {
  return token.usedAt === null && now.getTime() < token.expiresAt.getTime();
}
