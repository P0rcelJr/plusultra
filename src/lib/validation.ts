import { z } from "zod";
import { fromDateKey } from "@/domain/time";
import { fill, t } from "@/i18n";

/** Shared zod pieces so every form validates the same way and reports Spanish messages. */
export const emailField = z
  .string({ error: t.validation.required })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: t.validation.email }));

/** Any non-empty password is accepted (A23). */
export const passwordField = z.string({ error: t.validation.required }).min(1, { error: t.validation.required });

export const nameField = z.string({ error: t.validation.required }).trim().min(2, { error: t.validation.required });

/** Whole number within inclusive bounds; the error names the range. */
export function boundedInt({ min, max }: { min: number; max: number }) {
  const error = fill(t.validation.intRange, { min, max });
  return z.coerce.number({ error }).int({ error }).min(min, { error }).max(max, { error });
}

export const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .default(null);

/** `YYYY-MM-DD` from a date input, converted to the DATE-column representation. */
export const dateField = z
  .string({ error: t.validation.required })
  .transform((value, ctx) => {
    const date = fromDateKey(value);
    if (!date) {
      ctx.addIssue({ code: "custom", message: t.validation.date });
      return z.NEVER;
    }
    return date;
  });

export const optionalDateField = z
  .string()
  .default("")
  .transform((value, ctx) => {
    if (value === "") return null;
    const date = fromDateKey(value);
    if (!date) {
      ctx.addIssue({ code: "custom", message: t.validation.date });
      return z.NEVER;
    }
    return date;
  });

/** First human-readable message of a failed parse. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? t.validation.invalid;
}

/** FormData as a plain object of strings (files and repeated keys are read separately). */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

/** Value for `<input type="date">` from a DATE-column value (empty when null). */
export function dateInputValueOf(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}
