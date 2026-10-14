import { CancelBookingButton } from "@/components/cancel-booking-button";
import { cancelDeadline, cancellationStatus, type CancelDeadlineSettings } from "@/domain/booking";
import { dateKeyFor } from "@/domain/time";
import { fill, t } from "@/i18n";
import { formatDateTime, formatTime } from "@/lib/format";

/**
 * The member's booking with its cancel deadline and a cancel button (decision 9). The deadline is
 * shown as a bare time when it falls on the class's own day, and with the date otherwise (an early
 * class or a long deadline puts it on a previous day).
 */
export function CancelBooking({
  bookingId,
  session,
  now,
  settings,
  returnTo,
}: {
  bookingId: string;
  session: { startsAt: Date };
  now: Date;
  settings: CancelDeadlineSettings;
  returnTo: "/member" | "/member/schedule";
}) {
  const late = cancellationStatus(session, now, settings) === "LATE_CANCELLED";
  const deadline = cancelDeadline(session, settings);
  const hint = late
    ? t.memberSchedule.cancelLate
    : dateKeyFor(deadline) === dateKeyFor(session.startsAt)
      ? fill(t.memberSchedule.cancelBefore, { time: formatTime(deadline) })
      : fill(t.memberSchedule.cancelBeforeOn, { date: formatDateTime(deadline) });

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-xs text-muted-foreground">{hint}</span>
      <CancelBookingButton bookingId={bookingId} returnTo={returnTo} late={late} />
    </div>
  );
}
