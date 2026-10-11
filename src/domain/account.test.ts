import { describe, expect, it } from "vitest";
import { accountState, canFillIntake } from "./account";

const now = new Date("2026-10-10T12:00:00Z");

describe("accountState", () => {
  it("is unverified until the email is confirmed", () => {
    expect(accountState({ status: "PENDING", emailVerifiedAt: null }, null)).toBe("unverified");
  });

  it("is intake_pending after verification without a completed intake", () => {
    expect(accountState({ status: "PENDING", emailVerifiedAt: now }, null)).toBe("intake_pending");
    expect(accountState({ status: "PENDING", emailVerifiedAt: now }, { intakeCompletedAt: null })).toBe(
      "intake_pending",
    );
  });

  it("is awaiting_approval once the intake is complete", () => {
    expect(accountState({ status: "PENDING", emailVerifiedAt: now }, { intakeCompletedAt: now })).toBe(
      "awaiting_approval",
    );
  });

  it("is active or inactive from the status regardless of intake (admin-created members)", () => {
    expect(accountState({ status: "ACTIVE", emailVerifiedAt: now }, null)).toBe("active");
    expect(accountState({ status: "INACTIVE", emailVerifiedAt: null }, null)).toBe("inactive");
  });
});

describe("canFillIntake", () => {
  it("blocks unverified and inactive accounts only", () => {
    expect(canFillIntake("unverified")).toBe(false);
    expect(canFillIntake("inactive")).toBe(false);
    expect(canFillIntake("intake_pending")).toBe(true);
    expect(canFillIntake("awaiting_approval")).toBe(true);
    expect(canFillIntake("active")).toBe(true);
  });
});
