"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SETTINGS_LIMITS, type GymSettingsValues } from "@/domain/settings";
import { t } from "@/i18n";
import { initialActionState } from "@/lib/action-state";
import { updateSettings } from "./actions";

const FIELDS = ["bookingWindowDays", "cancelDeadlineHours", "materializeHorizonWeeks"] as const;

export function SettingsForm({ initial }: { initial: GymSettingsValues }) {
  const [state, formAction, pending] = useActionState(updateSettings, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {FIELDS.map((field) => (
        <div key={field} className="flex flex-col gap-2">
          <Label htmlFor={field}>{t.settings.fields[field].label}</Label>
          <Input
            id={field}
            name={field}
            type="number"
            min={SETTINGS_LIMITS[field].min}
            max={SETTINGS_LIMITS[field].max}
            step={1}
            inputMode="numeric"
            defaultValue={initial[field]}
            required
            className="max-w-32"
          />
          <p className="text-xs text-muted-foreground">{t.settings.fields[field].hint}</p>
        </div>
      ))}
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
