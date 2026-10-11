"use client";

import { useActionState, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { CLASS_TYPE_LIMITS } from "@/domain/class-types";
import { WEEKDAYS } from "@/domain/schedule";
import { t } from "@/i18n";
import { type ActionState, initialActionState } from "@/lib/action-state";

export type TemplateClassTypeOption = { id: string; name: string; durationMinutes: number; capacity: number };
export type TemplateCoachOption = { id: string; name: string };

export function TemplateForm({
  action,
  classTypes,
  coaches,
  defaultStartsOn,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  classTypes: TemplateClassTypeOption[];
  coaches: TemplateCoachOption[];
  defaultStartsOn: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const first = classTypes[0];
  const [durationMinutes, setDurationMinutes] = useState(String(first?.durationMinutes ?? ""));
  const [capacity, setCapacity] = useState(String(first?.capacity ?? ""));

  // Picking a class type copies its defaults; the template keeps its own values afterwards (A20).
  function onClassTypeChange(id: string) {
    const classType = classTypes.find((c) => c.id === id);
    if (!classType) return;
    setDurationMinutes(String(classType.durationMinutes));
    setCapacity(String(classType.capacity));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="classTypeId">{t.templates.classType}</Label>
        <NativeSelect
          className="w-full"
          id="classTypeId"
          name="classTypeId"
          defaultValue={first?.id}
          onChange={(event) => onClassTypeChange(event.target.value)}
          required
        >
          {classTypes.map((classType) => (
            <NativeSelectOption key={classType.id} value={classType.id}>
              {classType.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t.templates.weekdays}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {WEEKDAYS.map((weekday) => (
            <label key={weekday} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="weekday" value={weekday} className="size-4" />
              {t.weekdays[weekday]}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t.templates.weekdaysHint}</p>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startTime">{t.templates.startTime}</Label>
          <Input id="startTime" name="startTime" type="time" step={60} defaultValue="19:00" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="startsOn">{t.templates.startsOn}</Label>
          <Input id="startsOn" name="startsOn" type="date" defaultValue={defaultStartsOn} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="durationMinutes">{t.templates.durationMinutes}</Label>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={CLASS_TYPE_LIMITS.durationMinutes.min}
            max={CLASS_TYPE_LIMITS.durationMinutes.max}
            step={1}
            inputMode="numeric"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="capacity">{t.templates.capacity}</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={CLASS_TYPE_LIMITS.capacity.min}
            max={CLASS_TYPE_LIMITS.capacity.max}
            step={1}
            inputMode="numeric"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            required
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t.templates.prefillHint}</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="coachId">{t.templates.coach}</Label>
        <NativeSelect className="w-full" id="coachId" name="coachId" defaultValue={coaches[0]?.id} required>
          {coaches.map((coach) => (
            <NativeSelectOption key={coach.id} value={coach.id}>
              {coach.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
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
