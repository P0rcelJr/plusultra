import { z } from "zod";
import { PARQ_QUESTIONS, type ParqAnswers, parseParq } from "@/domain/parq";
import type { MemberProfile } from "@/generated/prisma/client";
import { t } from "@/i18n";
import { db } from "@/lib/db";
import { savePhoto } from "@/lib/uploads";
import { dateField, dateInputValueOf, firstIssue, formValues, nameField, optionalText } from "@/lib/validation";

/** Values the intake form renders; strings because they feed HTML inputs. */
export type IntakeFormValues = {
  dateOfBirth: string;
  cedula: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  goals: string;
  parq: ParqAnswers | null;
  staffNotes: string;
};

export function intakeFormValues(profile: MemberProfile | null): IntakeFormValues {
  return {
    dateOfBirth: dateInputValueOf(profile?.dateOfBirth),
    cedula: profile?.cedula ?? "",
    emergencyContactName: profile?.emergencyContactName ?? "",
    emergencyContactPhone: profile?.emergencyContactPhone ?? "",
    goals: profile?.goals ?? "",
    parq: parseParq(profile?.healthQuestionnaire),
    staffNotes: profile?.staffNotes ?? "",
  };
}

const schema = z.object({
  dateOfBirth: dateField,
  cedula: optionalText,
  emergencyContactName: nameField,
  emergencyContactPhone: z.string({ error: t.validation.required }).trim().min(6, { error: t.validation.required }),
  goals: optionalText,
  parqDetails: optionalText,
  staffNotes: optionalText,
});

function readParq(formData: FormData, details: string | null): ParqAnswers | null {
  const answers = {} as ParqAnswers["answers"];
  for (const question of PARQ_QUESTIONS) {
    const value = formData.get(`parq.${question}`);
    if (value !== "yes" && value !== "no") return null;
    answers[question] = value === "yes";
  }
  return { answers, details: details ?? "" };
}

/**
 * Persists the intake form for `userId` (decisions 20, 21). Members and staff share this; only staff
 * may write `staffNotes`. The first successful save stamps `intakeCompletedAt`, which is what puts the
 * member in the approval queue.
 */
export async function saveIntake(
  userId: string,
  formData: FormData,
  options: { staff: boolean },
): Promise<{ error?: string }> {
  const parsed = schema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const values = parsed.data;

  const parq = readParq(formData, values.parqDetails);
  if (!parq) return { error: t.validation.parq };

  let photoFilename: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const saved = await savePhoto(userId, photo);
    if (!saved.ok) return { error: saved.reason === "size" ? t.errors.photoSize : t.errors.photoType };
    photoFilename = saved.filename;
  }

  const now = new Date();
  const data = {
    dateOfBirth: values.dateOfBirth,
    cedula: values.cedula,
    emergencyContactName: values.emergencyContactName,
    emergencyContactPhone: values.emergencyContactPhone,
    goals: values.goals,
    healthQuestionnaire: parq,
    ...(photoFilename ? { photoFilename } : {}),
    ...(options.staff ? { staffNotes: values.staffNotes } : {}),
  };
  await db.memberProfile.upsert({
    where: { userId },
    create: { userId, ...data, intakeCompletedAt: now },
    update: data,
  });
  // Profiles created by staff before the member filled anything in have no completion stamp yet.
  await db.memberProfile.updateMany({ where: { userId, intakeCompletedAt: null }, data: { intakeCompletedAt: now } });
  return {};
}
