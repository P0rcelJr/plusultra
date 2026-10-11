import { describe, expect, it } from "vitest";
import { jobSecretMatches } from "./jobs";

describe("jobSecretMatches", () => {
  it("accepts the configured secret", () => {
    expect(jobSecretMatches("s3cret", "s3cret")).toBe(true);
  });

  it("rejects a missing or different header", () => {
    expect(jobSecretMatches(null, "s3cret")).toBe(false);
    expect(jobSecretMatches("", "s3cret")).toBe(false);
    expect(jobSecretMatches("s3cre", "s3cret")).toBe(false);
    expect(jobSecretMatches("S3CRET", "s3cret")).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    expect(jobSecretMatches("anything", undefined)).toBe(false);
    expect(jobSecretMatches("", "")).toBe(false);
  });
});
