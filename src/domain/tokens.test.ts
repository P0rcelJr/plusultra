import { describe, expect, it } from "vitest";
import { isTokenValid, tokenExpiry } from "./tokens";

const issued = new Date("2026-10-10T12:00:00Z");

describe("tokenExpiry", () => {
  it("gives verification links 24 hours and reset links 1 hour", () => {
    expect(tokenExpiry("EMAIL_VERIFY", issued).toISOString()).toBe("2026-10-11T12:00:00.000Z");
    expect(tokenExpiry("PASSWORD_RESET", issued).toISOString()).toBe("2026-10-10T13:00:00.000Z");
  });
});

describe("isTokenValid", () => {
  const expiresAt = tokenExpiry("PASSWORD_RESET", issued);

  it("accepts an unused token before expiry", () => {
    expect(isTokenValid({ expiresAt, usedAt: null }, new Date("2026-10-10T12:59:59Z"))).toBe(true);
  });

  it("rejects an expired token, including at the exact expiry instant", () => {
    expect(isTokenValid({ expiresAt, usedAt: null }, expiresAt)).toBe(false);
    expect(isTokenValid({ expiresAt, usedAt: null }, new Date("2026-10-10T14:00:00Z"))).toBe(false);
  });

  it("rejects a used token even before expiry", () => {
    expect(isTokenValid({ expiresAt, usedAt: issued }, new Date("2026-10-10T12:30:00Z"))).toBe(false);
  });
});
