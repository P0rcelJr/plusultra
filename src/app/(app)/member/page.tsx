import type { Metadata } from "next";
import { SkeletonNotice } from "@/components/skeleton-notice";
import { t } from "@/i18n";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: t.home.member };

export default async function MemberHomePage() {
  const session = await requireSession();
  return <SkeletonNotice title={t.home.member} name={session.user.name ?? ""} />;
}
