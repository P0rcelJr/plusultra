"use client";

import { cancelMyBooking } from "@/app/(app)/member/schedule/actions";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";

/**
 * One-click cancel. Past the deadline the member confirms first, because the class still counts
 * against their quota (decision 9). The server decides the final status, so the notice after the
 * redirect is what is authoritative if the deadline passes between render and click.
 */
export function CancelBookingButton({
  bookingId,
  returnTo,
  late,
}: {
  bookingId: string;
  returnTo: "/member" | "/member/schedule";
  late: boolean;
}) {
  return (
    <form
      action={cancelMyBooking}
      onSubmit={(event) => {
        if (late && !window.confirm(t.memberSchedule.cancelLateConfirm)) event.preventDefault();
      }}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <Button type="submit" size="sm" variant="outline">
        {t.memberSchedule.cancel}
      </Button>
    </form>
  );
}
