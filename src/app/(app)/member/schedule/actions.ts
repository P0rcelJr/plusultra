"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BookingRefusal } from "@/domain/booking";
import type { t } from "@/i18n";
import { bookSession } from "@/lib/booking";
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
