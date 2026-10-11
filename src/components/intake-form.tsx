"use client";

import { useActionState } from "react";
import { PARQ_QUESTIONS } from "@/domain/parq";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/i18n";
import { type ActionState, initialActionState } from "@/lib/action-state";
import type { IntakeFormValues } from "@/lib/intake";

/**
 * Intake form (decisions 20, 21, A9) used by the member (first fill and later edits) and by staff from
 * the member detail page. Staff additionally see the private notes field.
 */
export function IntakeForm({
  action,
  initial,
  photoUrl,
  staff = false,
  submitLabel,
  hidden = {},
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  initial: IntakeFormValues;
  photoUrl: string | null;
  staff?: boolean;
  submitLabel: string;
  hidden?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <section className="flex flex-col gap-4">
        <h2 className="font-medium">{t.intake.personal}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="dateOfBirth">{t.intake.dateOfBirth}</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={initial.dateOfBirth} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cedula">
              {t.intake.cedula} <span className="font-normal text-muted-foreground">{t.common.optional}</span>
            </Label>
            <Input id="cedula" name="cedula" defaultValue={initial.cedula} inputMode="numeric" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-medium">{t.intake.emergency}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="emergencyContactName">{t.intake.emergencyName}</Label>
            <Input id="emergencyContactName" name="emergencyContactName" defaultValue={initial.emergencyContactName} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="emergencyContactPhone">{t.intake.emergencyPhone}</Label>
            <Input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              type="tel"
              defaultValue={initial.emergencyContactPhone}
              required
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Label htmlFor="goals">
          {t.intake.goals} <span className="font-normal text-muted-foreground">{t.common.optional}</span>
        </Label>
        <Textarea id="goals" name="goals" defaultValue={initial.goals} placeholder={t.intake.goalsPlaceholder} />
      </section>

      <section className="flex flex-col gap-2">
        <Label htmlFor="photo">
          {t.intake.photo} <span className="font-normal text-muted-foreground">{t.common.optional}</span>
        </Label>
        {photoUrl ? (
          <div className="flex items-center gap-3">
            {/* Served by an authenticated route handler; next/image optimization would drop the cookie. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt={t.intake.photoCurrent} className="size-20 rounded-lg object-cover ring-1 ring-foreground/10" />
            <span className="text-sm text-muted-foreground">{t.intake.photoReplace}</span>
          </div>
        ) : null}
        <Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
        <p className="text-xs text-muted-foreground">{t.intake.photoHint}</p>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-medium">{t.intake.parq}</h2>
          <p className="text-sm text-muted-foreground">{t.intake.parqDescription}</p>
        </div>
        <ol className="flex flex-col gap-4">
          {PARQ_QUESTIONS.map((question, index) => {
            const answer = initial.parq?.answers[question];
            return (
              <li key={question} className="flex flex-col gap-2">
                <span className="text-sm">
                  {index + 1}. {t.intake.parqQuestions[question]}
                </span>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="radio" name={`parq.${question}`} value="yes" defaultChecked={answer === true} required />
                    {t.common.yes}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name={`parq.${question}`} value="no" defaultChecked={answer === false} required />
                    {t.common.no}
                  </label>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="flex flex-col gap-2">
          <Label htmlFor="parqDetails">
            {t.intake.parqDetails} <span className="font-normal text-muted-foreground">{t.common.optional}</span>
          </Label>
          <Textarea
            id="parqDetails"
            name="parqDetails"
            defaultValue={initial.parq?.details ?? ""}
            placeholder={t.intake.parqDetailsPlaceholder}
          />
        </div>
      </section>

      {staff ? (
        <>
          <Separator />
          <section className="flex flex-col gap-2">
            <Label htmlFor="staffNotes">{t.intake.staffNotes}</Label>
            <Textarea id="staffNotes" name="staffNotes" defaultValue={initial.staffNotes} />
            <p className="text-xs text-muted-foreground">{t.intake.staffNotesHint}</p>
          </section>
        </>
      ) : null}

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t.intake.submitting : submitLabel}
      </Button>
    </form>
  );
}
