"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/i18n";
import { type ActionState, initialActionState } from "@/lib/action-state";

/** Email-only form shared by "resend verification" and "forgot password". */
export function EmailRequestForm({
  action,
  description,
  submit,
  submitting,
  done,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  description: string;
  submit: string;
  submitting: string;
  done: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  if (state.done) {
    return <p className="text-sm">{done}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? submitting : submit}
      </Button>
    </form>
  );
}
