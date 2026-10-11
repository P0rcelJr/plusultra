import { createHash, timingSafeEqual } from "node:crypto";

/** Header a scheduler sends to run a job route (A4). */
export const JOB_SECRET_HEADER = "x-job-secret";

/**
 * True when the provided header value equals the configured secret. An unset or empty secret
 * rejects everything, so a deploy that forgets `JOB_SECRET` leaves the route closed rather than open.
 * Both sides are hashed first so the comparison is constant-time regardless of length.
 */
export function jobSecretMatches(provided: string | null, expected: string | undefined): boolean {
  if (!expected || !provided) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(provided), digest(expected));
}
