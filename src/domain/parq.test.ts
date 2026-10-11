import { describe, expect, it } from "vitest";
import { PARQ_QUESTIONS, parqFlagged, parseParq, type ParqAnswers } from "./parq";

const allNo = Object.fromEntries(PARQ_QUESTIONS.map((q) => [q, false])) as ParqAnswers["answers"];

describe("parseParq", () => {
  it("accepts a complete questionnaire and defaults missing details to empty", () => {
    expect(parseParq({ answers: allNo })).toEqual({ answers: allNo, details: "" });
  });

  it("rejects anything that is not a full set of boolean answers", () => {
    expect(parseParq(null)).toBeNull();
    expect(parseParq({})).toBeNull();
    expect(parseParq({ answers: { ...allNo, heartCondition: "no" } })).toBeNull();
    const incomplete: Partial<ParqAnswers["answers"]> = { ...allNo };
    delete incomplete.otherReason;
    expect(parseParq({ answers: incomplete })).toBeNull();
  });
});

describe("parqFlagged", () => {
  it("flags when any answer is yes", () => {
    expect(parqFlagged({ answers: allNo, details: "" })).toBe(false);
    expect(parqFlagged({ answers: { ...allNo, dizziness: true }, details: "" })).toBe(true);
  });
});
