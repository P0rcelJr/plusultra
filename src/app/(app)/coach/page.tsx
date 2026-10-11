import type { Metadata } from "next";
import { SkeletonNotice } from "@/components/skeleton-notice";
import { t } from "@/i18n";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: t.home.coach };

export default async function CoachHomePage() {
  const session = await requireRole("ADMIN", "COACH");
  return <SkeletonNotice title={t.home.coach} name={session.user.name ?? ""} />;
}
