"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BookingRefusal } from "@/domain/booking";
import type { t } from "@/i18n";
import { bookSession, cancelBooking, type CancelRefusal } from "@/lib/booking";
import { requireRole } from "@/lib/session";

const REFUSAL_ERROR: Record<BookingRefusal | "not_found", keyof typeof t.errors> = {
  inactive: "bookingInactive",
  no_plan: "bookingNoPlan",
  session_cancelled: "bookingSessionCancelled",
  already_booked: "bookingAlreadyBooked",
  outside_window: "bookingOutsideWindow",
  full: "bookingFull",
  not_found: "notFound",
};

/** Member books a session from /member/schedule (decisions 9, A1). */
export async function bookMySession(formData: FormData) {
  const user = await requireRole("MEMBER");
  const sessionId = formData.get("sessionId");
  if (typeof sessionId !== "string" || sessionId === "") redirect("/member/schedule?error=notFound");

  const result = await bookSession(user, sessionId);
  if (!result.ok) redirect(`/member/schedule?error=${REFUSAL_ERROR[result.reason]}`);

  revalidatePath("/member");
  revalidatePath("/admin/schedule");
  redirect("/member/schedule?notice=booked");
}

const CANCEL_ERROR: Record<CancelRefusal, keyof typeof t.errors> = {
  not_found: "notFound",
  not_booked: "bookingNotActive",
  started: "bookingStarted",
};

/** Both member screens list bookings with a cancel button; anything else falls back to the schedule. */
const CANCEL_RETURN_PATHS = ["/member", "/member/schedule"] as const;

/** Member cancels their own booking from /member or /member/schedule (decision 9). */
export async function cancelMyBooking(formData: FormData) {
  const user = await requireRole("MEMBER");
  const from = formData.get("returnTo");
  const returnTo = CANCEL_RETURN_PATHS.find((path) => path === from) ?? "/member/schedule";
  const bookingId = formData.get("bookingId");
  if (typeof bookingId !== "string" || bookingId === "") redirect(`${returnTo}?error=notFound`);

  const result = await cancelBooking(user.id, bookingId);
  if (!result.ok) redirect(`${returnTo}?error=${CANCEL_ERROR[result.reason]}`);

  revalidatePath("/member");
  revalidatePath("/member/schedule");
  revalidatePath("/admin/schedule");
  redirect(`${returnTo}?notice=${result.status === "LATE_CANCELLED" ? "lateCancelled" : "cancelled"}`);
}
