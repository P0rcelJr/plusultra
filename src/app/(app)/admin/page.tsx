import type { Metadata } from "next";
import { SkeletonNotice } from "@/components/skeleton-notice";
import { t } from "@/i18n";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: t.home.admin };

export default async function AdminHomePage() {
  const session = await requireRole("ADMIN");
  return <SkeletonNotice title={t.home.admin} name={session.user.name ?? ""} />;
}
