"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { t } from "@/i18n";
import { initialActionState } from "@/lib/action-state";
import { createMember } from "../actions";

export function NewMemberForm({
  plans,
  today,
}: {
  plans: { id: string; name: string; priceLabel: string }[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(createMember, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t.auth.name}</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">
          {t.auth.phone} <span className="font-normal text-muted-foreground">{t.common.optional}</span>
        </Label>
        <Input id="phone" name="phone" type="tel" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="planId">{t.members.plan}</Label>
          <NativeSelect className="w-full" id="planId" name="planId" defaultValue="">
            <NativeSelectOption value="">{t.members.noPlanOption}</NativeSelectOption>
            {plans.map((plan) => (
              <NativeSelectOption key={plan.id} value={plan.id}>
                {plan.name} · {plan.priceLabel}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="startsOn">{t.approvals.startsOn}</Label>
          <Input id="startsOn" name="startsOn" type="date" defaultValue={today} required />
        </div>
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t.members.creating : t.members.create}
      </Button>
    </form>
  );
}
