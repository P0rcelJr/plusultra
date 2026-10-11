"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/i18n";
import { initialActionState } from "@/lib/action-state";
import { updateMemberAccount } from "../actions";

export function AccountForm({ user }: { user: { id: string; name: string; email: string; phone: string | null } }) {
  const [state, formAction, pending] = useActionState(updateMemberAccount, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="userId" value={user.id} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">{t.auth.name}</Label>
          <Input id="name" name="name" defaultValue={user.name} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t.auth.email}</Label>
          <Input id="email" name="email" type="email" defaultValue={user.email} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">{t.auth.phone}</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} />
        </div>
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="outline" size="sm" disabled={pending} className="self-start">
        {pending ? t.common.saving : t.memberDetail.saveAccount}
      </Button>
    </form>
  );
}
