"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/i18n";
import { initialActionState } from "@/lib/action-state";
import { signup } from "./actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialActionState);

  if (state.done) {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-medium">{t.auth.signup.doneTitle}</p>
        <p className="text-sm text-muted-foreground">{t.auth.signup.doneBody}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t.auth.signup.description}</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t.auth.name}</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">{t.auth.phone}</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t.auth.password}</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <p className="text-xs text-muted-foreground">{t.auth.signup.passwordHint}</p>
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t.auth.signup.submitting : t.auth.signup.submit}
      </Button>
    </form>
  );
}
