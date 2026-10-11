"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/i18n";
import { type ActionState, initialActionState } from "@/lib/action-state";

export type PlanFormValues = {
  id?: string;
  name: string;
  monthlyPrice: string;
  weeklyClassQuota: string;
  includesTrainingPlan: boolean;
};

export function PlanForm({
  action,
  initial,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  initial: PlanFormValues;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t.plans.name}</Label>
        <Input id="name" name="name" defaultValue={initial.name} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="monthlyPrice">{t.plans.monthlyPrice}</Label>
          <Input
            id="monthlyPrice"
            name="monthlyPrice"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={initial.monthlyPrice}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="weeklyClassQuota">{t.plans.weeklyClassQuota}</Label>
          <Input
            id="weeklyClassQuota"
            name="weeklyClassQuota"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            defaultValue={initial.weeklyClassQuota}
          />
          <p className="text-xs text-muted-foreground">{t.plans.weeklyClassQuotaHint}</p>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="includesTrainingPlan" defaultChecked={initial.includesTrainingPlan} />
        {t.plans.includesTrainingPlan}
      </label>
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
