/**
 * PAR-Q style health questionnaire (decisions 20, A9): the standard seven yes/no questions plus a
 * free-text details field, stored as JSON on member_profiles. Question text lives in src/i18n/es.ts.
 */
export const PARQ_QUESTIONS = [
  "heartCondition",
  "chestPainActivity",
  "chestPainRest",
  "dizziness",
  "boneJoint",
  "bloodPressureMedication",
  "otherReason",
] as const;

export type ParqQuestion = (typeof PARQ_QUESTIONS)[number];

export type ParqAnswers = {
  answers: Record<ParqQuestion, boolean>;
  details: string;
};

/** Validates the JSON shape read back from the database. Returns null when it is not a PAR-Q. */
export function parseParq(input: unknown): ParqAnswers | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as { answers?: unknown; details?: unknown };
  if (typeof raw.answers !== "object" || raw.answers === null) return null;
  const answers = raw.answers as Record<string, unknown>;
  const result = {} as Record<ParqQuestion, boolean>;
  for (const q of PARQ_QUESTIONS) {
    if (typeof answers[q] !== "boolean") return null;
    result[q] = answers[q] as boolean;
  }
  return { answers: result, details: typeof raw.details === "string" ? raw.details : "" };
}

/** Any "yes" means staff should look at the questionnaire before the member trains. */
export function parqFlagged(parq: ParqAnswers): boolean {
  return PARQ_QUESTIONS.some((q) => parq.answers[q]);
}
