import { createHash, randomBytes } from "node:crypto";
import { isTokenValid, tokenExpiry } from "@/domain/tokens";
import type { AuthTokenType } from "@/generated/prisma/client";
import { db } from "@/lib/db";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Creates a single-use token for the user and returns the raw value to put in the link.
 * Earlier unused tokens of the same type are dropped so only the latest link works.
 */
export async function issueToken(userId: string, type: AuthTokenType): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const now = new Date();
  await db.$transaction([
    db.authToken.deleteMany({ where: { userId, type, usedAt: null } }),
    db.authToken.create({
      data: { userId, type, tokenHash: hashToken(raw), expiresAt: tokenExpiry(type, now) },
    }),
  ]);
  return raw;
}

/**
 * Marks the token used and returns its owner, or null when it is unknown, expired or already used.
 * The conditional update guarantees two concurrent requests cannot both consume it.
 */
export async function consumeToken(raw: unknown, type: AuthTokenType): Promise<{ userId: string } | null> {
  if (typeof raw !== "string" || raw.length !== 64) return null;
  const tokenHash = hashToken(raw);
  const now = new Date();
  const token = await db.authToken.findUnique({ where: { tokenHash } });
  if (!token || token.type !== type || !isTokenValid(token, now)) return null;
  const claimed = await db.authToken.updateMany({
    where: { id: token.id, usedAt: null },
    data: { usedAt: now },
  });
  if (claimed.count !== 1) return null;
  return { userId: token.userId };
}
