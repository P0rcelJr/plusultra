"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/i18n";
import { initialActionState } from "@/lib/action-state";
import { resetPassword } from "./actions";

export function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-muted-foreground">{t.auth.reset.description}</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t.auth.password}</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <p className="text-xs text-muted-foreground">{t.auth.signup.passwordHint}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="passwordConfirm">{t.auth.passwordConfirm}</Label>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t.auth.reset.submitting : t.auth.reset.submit}
      </Button>
    </form>
  );
}
