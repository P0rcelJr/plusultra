"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CLASS_TYPE_LIMITS } from "@/domain/class-types";
import { t } from "@/i18n";
import { type ActionState, initialActionState } from "@/lib/action-state";

export type ClassTypeFormValues = {
  id?: string;
  name: string;
  description: string;
  durationMinutes: string;
  capacity: string;
};

export function ClassTypeForm({
  action,
  initial,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  initial: ClassTypeFormValues;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t.classTypes.name}</Label>
        <Input id="name" name="name" defaultValue={initial.name} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">
          {t.classTypes.descriptionLabel} <span className="font-normal text-muted-foreground">{t.common.optional}</span>
        </Label>
        <Textarea id="description" name="description" defaultValue={initial.description} rows={3} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="durationMinutes">{t.classTypes.durationMinutes}</Label>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={CLASS_TYPE_LIMITS.durationMinutes.min}
            max={CLASS_TYPE_LIMITS.durationMinutes.max}
            step={1}
            inputMode="numeric"
            defaultValue={initial.durationMinutes}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="capacity">{t.classTypes.capacity}</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={CLASS_TYPE_LIMITS.capacity.min}
            max={CLASS_TYPE_LIMITS.capacity.max}
            step={1}
            inputMode="numeric"
            defaultValue={initial.capacity}
            required
          />
          <p className="text-xs text-muted-foreground">{t.classTypes.capacityHint}</p>
        </div>
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t.common.saving : t.common.save}
      </Button>
    </form>
  );
}
